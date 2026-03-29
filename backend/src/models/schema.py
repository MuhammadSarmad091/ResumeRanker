"""Data Models and Schemas"""

from typing import List, Dict, Optional, Any
from dataclasses import dataclass
from pydantic import BaseModel


@dataclass
class ParsedJobDescription:
    """Parsed job description structure"""
    title: str
    skills: List[str]
    experience: int
    education: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'title': self.title,
            'skills': self.skills,
            'experience': self.experience,
            'education': self.education
        }


@dataclass
class ParsedResume:
    """Parsed resume structure"""
    name: str
    phone: Optional[str]
    email: Optional[str]
    skills: List[str]
    experience: int
    education: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'name': self.name,
            'phone': self.phone,
            'email': self.email,
            'skills': self.skills,
            'experience': self.experience,
            'education': self.education
        }


@dataclass
class ScoreBreakdown:
    """Score breakdown for each section"""
    skills: float
    experience: float
    education: float
    
    def to_dict(self) -> Dict[str, float]:
        return {
            'skills': self.skills,
            'experience': self.experience,
            'education': self.education
        }


@dataclass
class RankedResume:
    """Final ranked resume result"""
    name: str
    phone: Optional[str]
    email: Optional[str]
    total_score: float
    score_breakdown: ScoreBreakdown
    matched_skills: List[str]
    unmatched_skills: List[str]
    extra_skills: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'name': self.name,
            'phone': self.phone,
            'email': self.email,
            'total_score': round(self.total_score, 2),
            'score_breakdown': self.score_breakdown.to_dict(),
            'matched_skills': self.matched_skills,
            'unmatched_skills': self.unmatched_skills,
            'extra_skills': self.extra_skills
        }


# Pydantic models for API validation
class JobDescriptionRequest(BaseModel):
    """Job description request from frontend"""
    job_description_text: str
    weights: Dict[str, float]
    
    class Config:
        json_schema_extra = {
            "example": {
                "job_description_text": "Senior Python Developer needed...",
                "weights": {"skills": 0.5, "experience": 0.3, "education": 0.2}
            }
        }


class RankingResponse(BaseModel):
    """Ranking response to frontend"""
    status: str
    message: str
    ranked_resumes: List[Dict[str, Any]]
    job_title: str
    total_resumes_processed: int
