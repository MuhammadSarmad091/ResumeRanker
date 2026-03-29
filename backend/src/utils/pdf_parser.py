"""PDF extraction utility"""

import os
from typing import List
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:
    raise ImportError("pypdf is required. Install with: pip install pypdf")


class PDFParser:
    """Parse PDF files and extract text"""
    
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """
        Extract text from a PDF file.
        
        Args:
            file_path: Path to the PDF file
        
        Returns:
            Extracted text from the PDF
        
        Raises:
            FileNotFoundError: If file doesn't exist
            ValueError: If file is not a valid PDF
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found: {file_path}")
        
        if not file_path.lower().endswith('.pdf'):
            raise ValueError("File must be a PDF")
        
        try:
            reader = PdfReader(file_path)
            text = ""
            
            for page_num, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text += page_text
                # Add page break indicator
                text += "\n--- PAGE BREAK ---\n"
            
            return text.strip()
        except Exception as e:
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")
    
    @staticmethod
    def extract_text_from_multiple_pdfs(file_paths: List[str]) -> dict:
        """
        Extract text from multiple PDF files.
        
        Args:
            file_paths: List of paths to PDF files
        
        Returns:
            Dictionary mapping file paths to extracted text
        """
        results = {}
        
        for file_path in file_paths:
            try:
                results[file_path] = PDFParser.extract_text_from_pdf(file_path)
            except Exception as e:
                results[file_path] = None
                print(f"Error processing {file_path}: {str(e)}")
        
        return results
    
    @staticmethod
    def validate_pdf_file(file_path: str) -> bool:
        """Validate if a file is a valid PDF"""
        try:
            PdfReader(file_path)
            return True
        except Exception:
            return False
