"""API Routes for Resume Ranker"""

import os
import traceback
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify
from ..config import Config
from ..constants import ALLOWED_FILE_EXTENSIONS, DEFAULT_WEIGHTS
from ..utils.validators import InputValidator
from ..utils.pdf_parser import PDFParser
from ..models.parser import GeminiParser
from ..models.ranker import ResumeRanker
from ..models.schema import JobDescriptionRequest


api = Blueprint("api", __name__, url_prefix="/api")


def is_provider_auth_error(message: str) -> bool:
    """Detect LLM provider authentication/key errors from exception text."""
    m = (message or "").lower()
    return (
        "api key was reported as leaked" in m
        or "invalid api key" in m
        or "api_key_invalid" in m
        or "permission denied" in m
        or "unauthenticated" in m
        or "authentication" in m
    )


def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_FILE_EXTENSIONS
    )


@api.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Resume Ranker API is running"}), 200


@api.route("/rank", methods=["POST"])
def rank_resumes():
    """
    Main ranking endpoint.

    Expected multipart form data:
    - job_description (text or PDF file): Job description input
    - weights (JSON string): Scoring weights
    - resumes (files): PDF resume files
    """
    try:
        # Validate request has files
        if "resumes" not in request.files or len(request.files.getlist("resumes")) == 0:
            return (
                jsonify({"status": "error", "message": "No resume files provided"}),
                400,
            )

        # Get job description from text form field OR uploaded PDF file
        job_description = request.form.get("job_description")
        jd_temp_path = None

        if not job_description:
            jd_file = request.files.get("job_description")
            if jd_file and allowed_file(jd_file.filename or ""):
                upload_dir = Config.UPLOAD_FOLDER
                os.makedirs(upload_dir, exist_ok=True)

                jd_filename = secure_filename(jd_file.filename or "job_description.pdf")
                jd_temp_path = os.path.join(upload_dir, f"jd_{jd_filename}")
                jd_file.save(jd_temp_path)
                job_description = PDFParser.extract_text_from_pdf(jd_temp_path)
            else:
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": "Job description is required (text or PDF file)",
                        }
                    ),
                    400,
                )

        # Validate job description text after extraction/normalization
        InputValidator.validate_job_description(job_description)

        # Get weights (use defaults if not provided)
        weights_str = request.form.get("weights")
        if weights_str:
            import json

            try:
                weights = json.loads(weights_str)
            except json.JSONDecodeError:
                weights = DEFAULT_WEIGHTS
        else:
            weights = DEFAULT_WEIGHTS

        # Validate weights
        InputValidator.validate_weights(weights)

        # Get resume files
        resume_files = request.files.getlist("resumes")
        InputValidator.validate_resume_list(resume_files, Config.MAX_RESUMES)

        # Save uploaded files
        upload_dir = Config.UPLOAD_FOLDER
        os.makedirs(upload_dir, exist_ok=True)

        saved_resume_paths = []
        for resume_file in resume_files:
            if resume_file and allowed_file(resume_file.filename):
                filename = secure_filename(resume_file.filename)
                filepath = os.path.join(upload_dir, filename)
                resume_file.save(filepath)
                saved_resume_paths.append(filepath)

        if not saved_resume_paths:
            return (
                jsonify(
                    {"status": "error", "message": "No valid PDF resumes provided"}
                ),
                400,
            )

        # Parse job description using Gemini
        parser = GeminiParser()
        job_text = job_description
        parsed_job = parser.parse_job_description(job_text)

        # Parse resumes using Gemini (batch processing for efficiency)
        parsed_resumes = []
        resume_texts = []

        try:
            # Extract text from all PDFs
            for resume_path in saved_resume_paths:
                try:
                    resume_text = PDFParser.extract_text_from_pdf(resume_path)
                    resume_texts.append(resume_text)
                except Exception as e:
                    print(f"Error extracting text from {resume_path}: {str(e)}")

            if not resume_texts:
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": "Failed to extract text from any resumes",
                        }
                    ),
                    400,
                )

            # Parse all resumes in a single API call (batch processing)
            parsed_resumes = parser.parse_resumes_batch(resume_texts)

        except Exception as e:
            print(f"Error in batch parsing: {str(e)}")
            return (
                jsonify(
                    {"status": "error", "message": f"Failed to parse resumes: {str(e)}"}
                ),
                400,
            )

        if not parsed_resumes:
            return (
                jsonify({"status": "error", "message": "Failed to parse any resumes"}),
                400,
            )

        # Rank resumes
        ranker = ResumeRanker()
        ranked_resumes = ranker.rank_resumes(parsed_job, parsed_resumes, weights)

        # Format response
        response_data = {
            "status": "success",
            "message": f"Successfully ranked {len(ranked_resumes)} resumes",
            "job_title": parsed_job.title,
            "total_resumes_processed": len(parsed_resumes),
            "ranked_resumes": [resume.to_dict() for resume in ranked_resumes],
        }

        # Cleanup uploaded files
        for filepath in saved_resume_paths:
            try:
                os.remove(filepath)
            except Exception:
                pass

        if jd_temp_path:
            try:
                os.remove(jd_temp_path)
            except Exception:
                pass

        return jsonify(response_data), 200

    except ValueError as e:
        return (
            jsonify({"status": "error", "message": f"Validation error: {str(e)}"}),
            400,
        )

    except Exception as e:
        jd_temp_path = locals().get("jd_temp_path")
        if jd_temp_path:
            try:
                os.remove(jd_temp_path)
            except Exception:
                pass
        if is_provider_auth_error(str(e)):
            return (
                jsonify(
                    {
                        "status": "error",
                        "code": "LLM_API_KEY_REVOKED",
                        "message": "Gemini API key is invalid or revoked. Please update GEMINI_API_KEY and restart the backend.",
                    }
                ),
                503,
            )
        print(f"Error in /rank endpoint: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500


@api.route("/job-description/parse", methods=["POST"])
def parse_job_description():
    """
    Parse a job description and return structured data.

    Expected JSON:
    {
        "job_description_text": "Full job description text"
    }
    """
    try:
        data = request.get_json()

        if not data:
            return (
                jsonify({"status": "error", "message": "Request body must be JSON"}),
                400,
            )

        job_description = data.get("job_description_text")
        if not job_description:
            return (
                jsonify(
                    {"status": "error", "message": "job_description_text is required"}
                ),
                400,
            )

        # Validate
        InputValidator.validate_job_description(job_description)

        # Parse
        parser = GeminiParser()
        parsed_job = parser.parse_job_description(job_description)

        return jsonify({"status": "success", "data": parsed_job.to_dict()}), 200

    except ValueError as e:
        return (
            jsonify({"status": "error", "message": f"Validation error: {str(e)}"}),
            400,
        )

    except Exception as e:
        print(f"Error in /job-description/parse: {str(e)}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500


@api.route("/resume/parse", methods=["POST"])
def parse_resume():
    """
    Parse a resume PDF and return structured data.

    Expected multipart form data:
    - resume (file): PDF resume file
    """
    try:
        if "resume" not in request.files:
            return (
                jsonify({"status": "error", "message": "Resume file is required"}),
                400,
            )

        resume_file = request.files["resume"]

        if not allowed_file(resume_file.filename):
            return jsonify({"status": "error", "message": "File must be a PDF"}), 400

        # Save file temporarily
        upload_dir = Config.UPLOAD_FOLDER
        os.makedirs(upload_dir, exist_ok=True)

        filename = secure_filename(resume_file.filename)
        filepath = os.path.join(upload_dir, filename)
        resume_file.save(filepath)

        try:
            # Extract text and parse
            resume_text = PDFParser.extract_text_from_pdf(filepath)
            parser = GeminiParser()
            parsed_resume = parser.parse_resume(resume_text)

            return jsonify({"status": "success", "data": parsed_resume.to_dict()}), 200

        finally:
            # Cleanup
            try:
                os.remove(filepath)
            except Exception:
                pass

    except ValueError as e:
        return (
            jsonify({"status": "error", "message": f"Validation error: {str(e)}"}),
            400,
        )

    except Exception as e:
        print(f"Error in /resume/parse: {str(e)}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
