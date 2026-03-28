from pydantic import BaseModel
from typing import List, Dict, Any

class ParsedResume(BaseModel):
    name: str
    email: str
    phone: str
    skills: List[str]
    experience: List[str]
    education: str
    projects: List[str]


class ParsedJD(BaseModel):
    title: str
    skills: List[str]
    experience: str
    education: str
    responsibilities: List[str]