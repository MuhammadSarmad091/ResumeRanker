"""Resume ranking module"""

from typing import List, Dict, Tuple
from ..utils.skill_matcher import SkillMatcher
from .schema import ParsedJobDescription, ParsedResume, ScoreBreakdown, RankedResume


class ResumeRanker:
    """Ranks resumes against a job description"""
    
    def __init__(self):
        """Initialize ranker with skill matcher"""
        self.skill_matcher = SkillMatcher()
    
    def _score_skills(self, job_skills: List[str], resume_skills: List[str]) -> Tuple[float, List[str], List[str], List[str]]:
        """
        Score skills section using skill matching.
        
        Returns:
            - skill_score (0-1)
            - matched_skills (deduplicated)
            - unmatched_skills (deduplicated)
            - extra_skills (deduplicated)
        """
        matched_skills = []
        unmatched_skills = []
        extra_skills = []
        
        # Find matched and unmatched skills
        for job_skill in job_skills:
            match_found = self.skill_matcher.find_best_match(job_skill, resume_skills)
            if match_found:
                matched_skills.append(match_found)
            else:
                unmatched_skills.append(job_skill)
        
        # Find extra skills (resume skills not in job description)
        matched_resume_skills = set(matched_skills)
        for resume_skill in resume_skills:
            if resume_skill not in matched_resume_skills:
                if not any(self.skill_matcher.are_skills_similar(resume_skill, ms) 
                          for ms in matched_skills):
                    extra_skills.append(resume_skill)
        
        # Deduplicate all skill lists while preserving order
        matched_skills = list(dict.fromkeys(matched_skills))
        unmatched_skills = list(dict.fromkeys(unmatched_skills))
        extra_skills = list(dict.fromkeys(extra_skills))
        
        # Calculate score: percentage of required skills matched
        if len(job_skills) == 0:
            skill_score = 1.0
        else:
            skill_score = len(matched_skills) / len(job_skills)
        
        return skill_score, matched_skills, unmatched_skills, extra_skills
    
    def _score_experience(self, job_experience: int, resume_experience: int) -> float:
        """
        Score experience section.
        
        Score based on whether candidate meets minimum requirements:
        - If resume_experience >= job_experience: full score (1.0)
        - If resume_experience < job_experience: partial score based on percentage
        """
        if job_experience == 0:
            return 1.0
        
        if resume_experience >= job_experience:
            return 1.0
        
        # Partial score based on percentage of required experience
        score = resume_experience / job_experience
        return min(score, 1.0)
    
    def _score_education(self, job_education: List[str], resume_education: List[str]) -> float:
        """
        Score education section.
        
        Score based on matching degrees:
        - Full match: 1.0
        - Partial match: 0.5
        - No match: 0.0
        """
        if len(job_education) == 0:
            return 1.0
        
        matched_count = 0
        for job_degree in job_education:
            for resume_degree in resume_education:
                if self._are_degrees_similar(job_degree, resume_degree):
                    matched_count += 1
                    break
        
        if matched_count == 0:
            return 0.0
        
        return min(matched_count / len(job_education), 1.0)
    
    def _are_degrees_similar(self, degree1: str, degree2: str) -> bool:
        """Check if two degrees are similar"""
        # Normalize and compare
        degree1_lower = degree1.lower()
        degree2_lower = degree2.lower()
        
        # Exact match
        if degree1_lower == degree2_lower:
            return True
        
        # Check common degree keywords
        degree_keywords = {
            'bachelor': ['b.', 'bachelor', 'b.s', 'b.a'],
            'master': ['m.', 'master', 'm.s', 'm.a'],
            'phd': ['phd', 'ph.d', 'doctorate'],
            'diploma': ['diploma', 'dip'],
            'associate': ['associate', 'a.s']
        }
        
        for key, keywords in degree_keywords.items():
            has_in_degree1 = any(kw in degree1_lower for kw in keywords)
            has_in_degree2 = any(kw in degree2_lower for kw in keywords)
            if has_in_degree1 and has_in_degree2:
                return True
        
        return False
    
    def rank_resume(
        self,
        job: ParsedJobDescription,
        resume: ParsedResume,
        weights: Dict[str, float]
    ) -> RankedResume:
        """
        Rank a single resume against a job description.
        
        Args:
            job: Parsed job description
            resume: Parsed resume
            weights: Dictionary with keys 'skills', 'experience', 'education' summing to 1.0
        
        Returns:
            RankedResume with scores and breakdown
        """
        # Score each section
        skills_score, matched_skills, unmatched_skills, extra_skills = self._score_skills(
            job.skills, resume.skills
        )
        experience_score = self._score_experience(job.experience, resume.experience)
        education_score = self._score_education(job.education, resume.education)
        
        # Validate and normalize weights
        total_weight = sum(weights.values())
        if total_weight <= 0:
            raise ValueError("Weights must sum to a positive number")
        
        normalized_weights = {
            k: v / total_weight for k, v in weights.items()
        }
        
        # Calculate weighted score
        total_score = (
            skills_score * normalized_weights.get('skills', 0) +
            experience_score * normalized_weights.get('experience', 0) +
            education_score * normalized_weights.get('education', 0)
        )
        
        # Create score breakdown
        score_breakdown = ScoreBreakdown(
            skills=round(skills_score, 2),
            experience=round(experience_score, 2),
            education=round(education_score, 2)
        )
        
        # Create ranked resume
        return RankedResume(
            name=resume.name,
            phone=resume.phone,
            email=resume.email,
            total_score=round(total_score, 2),
            score_breakdown=score_breakdown,
            matched_skills=matched_skills,
            unmatched_skills=unmatched_skills,
            extra_skills=extra_skills
        )
    
    def rank_resumes(
        self,
        job: ParsedJobDescription,
        resumes: List[ParsedResume],
        weights: Dict[str, float]
    ) -> List[RankedResume]:
        """
        Rank multiple resumes against a job description.
        
        Args:
            job: Parsed job description
            resumes: List of parsed resumes
            weights: Dictionary with scoring weights
        
        Returns:
            Sorted list of RankedResume (highest score first)
        """
        ranked = []
        
        for resume in resumes:
            try:
                ranked_resume = self.rank_resume(job, resume, weights)
                ranked.append(ranked_resume)
            except Exception as e:
                print(f"Error ranking resume {resume.name}: {str(e)}")
                continue
        
        # Sort by total score (descending)
        ranked.sort(key=lambda x: x.total_score, reverse=True)
        
        return ranked
