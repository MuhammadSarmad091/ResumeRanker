"""Skill matching utility using NLP and similarity matching"""

from typing import List, Optional
from rapidfuzz import fuzz
from sentence_transformers import SentenceTransformer
import numpy as np


class SkillMatcher:
    """Match skills using NLP and fuzzy matching"""
    
    def __init__(self):
        """Initialize skill matcher with sentence encoder"""
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.embeddings_cache = {}
        self.fuzz_threshold = 70  # Fuzzy match threshold
        self.semantic_threshold = 0.6  # Semantic similarity threshold
    
    def are_skills_similar(self, skill1: str, skill2: str) -> bool:
        """
        Check if two skills are similar using fuzzy matching.
        
        Args:
            skill1: First skill
            skill2: Second skill
        
        Returns:
            True if skills are similar, False otherwise
        """
        skill1_lower = skill1.lower().strip()
        skill2_lower = skill2.lower().strip()
        
        # Exact match
        if skill1_lower == skill2_lower:
            return True
        
        # Fuzzy string matching
        similarity_ratio = fuzz.token_set_ratio(skill1_lower, skill2_lower)
        return similarity_ratio >= self.fuzz_threshold
    
    def _get_embedding(self, text: str) -> np.ndarray:
        """Get embedding for a text, using cache when possible"""
        text_lower = text.lower().strip()
        
        if text_lower not in self.embeddings_cache:
            self.embeddings_cache[text_lower] = self.model.encode(text_lower)
        
        return self.embeddings_cache[text_lower]
    
    def _semantic_similarity(self, skill1: str, skill2: str) -> float:
        """
        Calculate semantic similarity between two skills using embeddings.
        
        Returns:
            Similarity score between 0 and 1
        """
        embedding1 = self._get_embedding(skill1)
        embedding2 = self._get_embedding(skill2)
        
        # Cosine similarity
        dot_product = np.dot(embedding1, embedding2)
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    def find_best_match(self, target_skill: str, candidate_skills: List[str]) -> Optional[str]:
        """
        Find the best matching skill from a list of candidate skills.
        
        Uses a combination of:
        1. Fuzzy string matching (strict)
        2. Semantic similarity (NLP-based)
        
        Args:
            target_skill: The skill to match
            candidate_skills: List of candidate skills to match against
        
        Returns:
            The best matching skill, or None if no good match found
        """
        if not candidate_skills:
            return None
        
        target_skill_lower = target_skill.lower().strip()
        best_match = None
        best_score = 0.0
        
        for candidate in candidate_skills:
            candidate_lower = candidate.lower().strip()
            
            # Exact match - return immediately
            if target_skill_lower == candidate_lower:
                return candidate
            
            # Fuzzy matching (priority over semantic)
            fuzzy_score = fuzz.token_set_ratio(target_skill_lower, candidate_lower) / 100.0
            
            if fuzzy_score >= 0.7:  # High confidence fuzzy match
                if fuzzy_score > best_score:
                    best_score = fuzzy_score
                    best_match = candidate
                continue
            
            # Semantic similarity as fallback
            semantic_score = self._semantic_similarity(target_skill_lower, candidate_lower)
            
            if semantic_score > best_score:
                best_score = semantic_score
                best_match = candidate
        
        # Return match only if score meets minimum threshold
        if best_score >= self.semantic_threshold:
            return best_match
        
        return None
    
    def match_skills_batch(
        self,
        target_skills: List[str],
        candidate_skills: List[str]
    ) -> dict:
        """
        Batch match multiple target skills against candidate skills.
        
        Returns:
            Dictionary with matched, unmatched, and extra skills
        """
        matched = []
        unmatched = []
        extra = list(candidate_skills)
        
        for target in target_skills:
            best_match = self.find_best_match(target, candidate_skills)
            if best_match:
                matched.append(best_match)
                if best_match in extra:
                    extra.remove(best_match)
            else:
                unmatched.append(target)
        
        return {
            'matched': matched,
            'unmatched': unmatched,
            'extra': extra
        }
