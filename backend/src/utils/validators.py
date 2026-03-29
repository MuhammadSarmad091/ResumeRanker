"""Input validation utilities"""

from typing import Dict
import os


class InputValidator:
    """Validate input data"""
    
    @staticmethod
    def validate_weights(weights: Dict[str, float]) -> bool:
        """
        Validate weight dictionary.
        
        Args:
            weights: Dictionary with 'skills', 'experience', 'education' keys
        
        Returns:
            True if valid, raises ValueError otherwise
        """
        required_keys = {'skills', 'experience', 'education'}
        
        if not isinstance(weights, dict):
            raise ValueError("Weights must be a dictionary")
        
        if not required_keys.issubset(weights.keys()):
            missing = required_keys - set(weights.keys())
            raise ValueError(f"Missing weight keys: {missing}")
        
        # Verify all values are numbers
        try:
            float_weights = {k: float(v) for k, v in weights.items()}
        except (ValueError, TypeError):
            raise ValueError("All weight values must be numeric")
        
        # Verify sum is positive
        total = sum(float_weights.values())
        if total <= 0:
            raise ValueError("Sum of weights must be positive")
        
        # Verify values are between 0 and 1 (before normalization)
        for key, value in float_weights.items():
            if value < 0:
                raise ValueError(f"Weight '{key}' cannot be negative")
        
        return True
    
    @staticmethod
    def validate_job_description(job_description_text: str) -> bool:
        """
        Validate job description text.
        
        Args:
            job_description_text: Job description text
        
        Returns:
            True if valid, raises ValueError otherwise
        """
        if not isinstance(job_description_text, str):
            raise ValueError("Job description must be a string")
        
        if len(job_description_text.strip()) == 0:
            raise ValueError("Job description cannot be empty")
        
        if len(job_description_text.strip()) < 10:
            raise ValueError("Job description must be at least 10 characters")
        
        return True
    
    @staticmethod
    def validate_uploaded_file(file_path: str, max_size: int = 50*1024*1024) -> bool:
        """
        Validate uploaded file.
        
        Args:
            file_path: Path to the file
            max_size: Maximum file size in bytes
        
        Returns:
            True if valid, raises ValueError otherwise
        """
        if not os.path.exists(file_path):
            raise ValueError("File does not exist")
        
        if not file_path.lower().endswith('.pdf'):
            raise ValueError("File must be a PDF")
        
        file_size = os.path.getsize(file_path)
        if file_size > max_size:
            raise ValueError(f"File size exceeds maximum ({max_size} bytes)")
        
        if file_size == 0:
            raise ValueError("File is empty")
        
        return True
    
    @staticmethod
    def validate_resume_list(resume_files: list, max_resumes: int = 20) -> bool:
        """
        Validate list of resume files.
        
        Args:
            resume_files: List of resume file paths
            max_resumes: Maximum number of resumes
        
        Returns:
            True if valid, raises ValueError otherwise
        """
        if not isinstance(resume_files, (list, tuple)):
            raise ValueError("Resume files must be a list")
        
        if len(resume_files) == 0:
            raise ValueError("At least one resume is required")
        
        if len(resume_files) > max_resumes:
            raise ValueError(f"Maximum {max_resumes} resumes allowed")
        
        return True
