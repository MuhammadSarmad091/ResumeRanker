from fastapi import FastAPI, UploadFile, File, Form
from typing import List
import tempfile
from extractor import extract_text_from_pdf
from parser import parse_resume, parse_job_description

app = FastAPI()


@app.post("/upload")
async def upload_files(
    job_description: UploadFile = File(...),
    resumes: List[UploadFile] = File(...)
):
    with tempfile.NamedTemporaryFile(delete=False) as tmp_jd:
        tmp_jd.write(await job_description.read())
        jd_text = extract_text_from_pdf(tmp_jd.name)

    parsed_jd = parse_job_description(jd_text)

    parsed_resumes = []

    for resume in resumes:
        with tempfile.NamedTemporaryFile(delete=False) as tmp_res:
            tmp_res.write(await resume.read())
            res_text = extract_text_from_pdf(tmp_res.name)

        parsed_data = parse_resume(res_text)
        parsed_resumes.append(parsed_data)

    return {
        "job_description": parsed_jd,
        "resumes": parsed_resumes
    }