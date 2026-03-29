"""Gemini LLM-based parsing module"""

import json
import re
from typing import Union, Dict, Any, List
import google.generativeai as genai
from ..config import Config
from ..constants import (
    GEMINI_MODEL,
    JOB_DESCRIPTION_PARSING_PROMPT,
    RESUME_PARSING_PROMPT,
    BATCH_RESUME_PARSING_PROMPT
)
from .schema import ParsedJobDescription, ParsedResume


class GeminiParser:
    """Parser using Google Gemini API"""
    
    def __init__(self):
        """Initialize Gemini parser"""
        genai.configure(api_key=Config.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(GEMINI_MODEL)
    
    def _clean_json_response(self, response: str) -> str:
        """Clean and extract JSON from LLM response"""
        # Remove markdown code blocks if present
        response = re.sub(r'```json\n?', '', response)
        response = re.sub(r'```\n?', '', response)
        response = response.strip()
        
        # Try to find JSON object in the response
        start_idx = response.find('{')
        end_idx = response.rfind('}')
        
        if start_idx != -1 and end_idx != -1:
            response = response[start_idx:end_idx + 1]
        
        return response
    
    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Parse JSON response from Gemini"""
        try:
            cleaned = self._clean_json_response(response)
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM response as JSON: {str(e)}")
    
    def _normalize_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize parsed data and deduplicate arrays"""
        # Ensure skills and education are lists of lowercase strings
        if 'skills' in data:
            if isinstance(data['skills'], str):
                data['skills'] = [s.strip().lower() for s in data['skills'].split(',')]
            else:
                data['skills'] = [str(s).strip().lower() for s in data['skills']]
            
            # Deduplicate while preserving order
            data['skills'] = list(dict.fromkeys(data['skills']))
            # Remove empty strings
            data['skills'] = [s for s in data['skills'] if s.strip()]
        
        if 'education' in data:
            if isinstance(data['education'], str):
                data['education'] = [e.strip().lower() for e in data['education'].split(',')]
            else:
                data['education'] = [str(e).strip().lower() for e in data['education']]
            
            # Deduplicate while preserving order
            data['education'] = list(dict.fromkeys(data['education']))
            # Remove empty strings
            data['education'] = [e for e in data['education'] if e.strip()]
        
        # Ensure experience is an integer
        if 'experience' in data:
            try:
                data['experience'] = int(float(data['experience']))
            except (ValueError, TypeError):
                data['experience'] = 0
        
        return data
    
    def parse_job_description(self, text: str) -> ParsedJobDescription:
        """Parse job description using Gemini"""
        if not text or len(text.strip()) == 0:
            raise ValueError("Job description text cannot be empty")
        
        prompt = JOB_DESCRIPTION_PARSING_PROMPT.format(text=text)
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text
            
            parsed_data = self._parse_json_response(response_text)
            normalized_data = self._normalize_data(parsed_data)
            
            # Ensure required fields exist
            required_fields = ['title', 'skills', 'experience', 'education']
            for field in required_fields:
                if field not in normalized_data:
                    raise ValueError(f"Missing required field: {field}")
            
            return ParsedJobDescription(
                title=normalized_data['title'],
                skills=normalized_data['skills'],
                experience=normalized_data['experience'],
                education=normalized_data['education']
            )
        except Exception as e:
            raise RuntimeError(f"Failed to parse job description: {str(e)}")
    
    def parse_resume(self, text: str) -> ParsedResume:
        """Parse resume using Gemini"""
        if not text or len(text.strip()) == 0:
            raise ValueError("Resume text cannot be empty")
        
        prompt = RESUME_PARSING_PROMPT.format(text=text)
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text
            
            parsed_data = self._parse_json_response(response_text)
            normalized_data = self._normalize_data(parsed_data)
            
            # Ensure required fields exist
            required_fields = ['name', 'skills', 'experience', 'education']
            for field in required_fields:
                if field not in normalized_data:
                    raise ValueError(f"Missing required field: {field}")
            
            return ParsedResume(
                name=normalized_data.get('name', 'Unknown'),
                phone=normalized_data.get('phone'),
                email=normalized_data.get('email'),
                skills=normalized_data['skills'],
                experience=normalized_data['experience'],
                education=normalized_data['education']
            )
        except Exception as e:
            raise RuntimeError(f"Failed to parse resume: {str(e)}")
    
    def _clean_json_array_response(self, response: str) -> str:
        """Clean and extract JSON array from LLM response"""
        # Remove markdown code blocks if present
        response = re.sub(r'```json\n?', '', response)
        response = re.sub(r'```\n?', '', response)
        response = response.strip()
        
        # Try to find JSON array in the response
        start_idx = response.find('[')
        end_idx = response.rfind(']')
        
        if start_idx != -1 and end_idx != -1:
            response = response[start_idx:end_idx + 1]
        
        return response
    
    def _parse_json_array_response(self, response: str) -> List[Dict[str, Any]]:
        """Parse JSON array response from Gemini"""
        try:
            cleaned = self._clean_json_array_response(response)
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM response as JSON array: {str(e)}")
    
    def parse_resumes_batch(self, texts: List[str]) -> List[ParsedResume]:
        """
        Parse multiple resumes in a single API call (batch processing).
        
        This is more efficient than parsing each resume individually,
        reducing API calls and costs.
        
        Args:
            texts: List of resume texts
        
        Returns:
            List of ParsedResume objects
        
        Raises:
            ValueError: If texts is empty or invalid
            RuntimeError: If parsing fails
        """
        if not texts or len(texts) == 0:
            raise ValueError("Resume texts list cannot be empty")
        
        # Combine all resumes with separator
        combined_text = "\n--- RESUME SEPARATOR ---\n".join(texts)
        
        # Create batch prompt
        prompt = BATCH_RESUME_PARSING_PROMPT.format(
            count=len(texts),
            resumes_text=combined_text
        )
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text
            
            # Parse as array
            parsed_array = self._parse_json_array_response(response_text)
            
            if not isinstance(parsed_array, list):
                raise ValueError("Expected JSON array response from Gemini")
            
            if len(parsed_array) != len(texts):
                raise ValueError(
                    f"Expected {len(texts)} parsed resumes, got {len(parsed_array)}"
                )
            
            # Convert to ParsedResume objects
            parsed_resumes = []
            for idx, data in enumerate(parsed_array):
                try:
                    normalized_data = self._normalize_data(data)
                    
                    # Ensure required fields exist
                    required_fields = ['name', 'skills', 'experience', 'education']
                    for field in required_fields:
                        if field not in normalized_data:
                            raise ValueError(f"Resume {idx}: Missing required field: {field}")
                    
                    parsed_resume = ParsedResume(
                        name=normalized_data.get('name', 'Unknown'),
                        phone=normalized_data.get('phone'),
                        email=normalized_data.get('email'),
                        skills=normalized_data['skills'],
                        experience=normalized_data['experience'],
                        education=normalized_data['education']
                    )
                    parsed_resumes.append(parsed_resume)
                except Exception as e:
                    raise RuntimeError(f"Failed to parse resume {idx + 1}: {str(e)}")
            
            return parsed_resumes
        
        except Exception as e:
            raise RuntimeError(f"Failed to parse resumes batch: {str(e)}")
