"""Configuration Management"""

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', False)
    MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', 50000000))
    MAX_RESUMES = int(os.getenv('MAX_RESUMES', 20))
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'data', 'uploads')
    
    @staticmethod
    def validate():
        """Validate configuration"""
        if not Config.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set in environment variables")
        return True
