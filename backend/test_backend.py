"""Test script for Resume Ranker API"""

import requests
import json
from pathlib import Path
from typing import Dict, List, Any
import time


class ResumeRankerTester:
    """Test the Resume Ranker API"""
    
    def __init__(self, api_url: str = "http://localhost:5000"):
        self.api_url = api_url
        self.session = requests.Session()
    
    def check_api_health(self) -> bool:
        """Check if API is running and healthy"""
        try:
            response = self.session.get(f"{self.api_url}/api/health")
            if response.status_code == 200:
                print("✓ API is healthy and running")
                return True
            else:
                print(f"✗ API returned status code: {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            print(f"✗ Cannot connect to API at {self.api_url}")
            print("  Make sure the Flask app is running: python -m src.app")
            return False
        except Exception as e:
            print(f"✗ Error checking API health: {str(e)}")
            return False
    
    def rank_resumes(
        self,
        job_description: str,
        resume_paths: List[str],
        weights: Dict[str, float] = None
    ) -> Dict[str, Any]:
        """
        Test the main ranking endpoint
        
        Args:
            job_description: Job description text
            resume_paths: List of paths to resume PDFs
            weights: Scoring weights (optional)
        
        Returns:
            API response as dictionary
        """
        
        if weights is None:
            weights = {
                "skills": 0.5,
                "experience": 0.3,
                "education": 0.2
            }
        
        # Prepare multipart form data
        files = []
        for resume_path in resume_paths:
            if not Path(resume_path).exists():
                raise FileNotFoundError(f"Resume file not found: {resume_path}")
            
            with open(resume_path, 'rb') as f:
                files.append(('resumes', (Path(resume_path).name, f, 'application/pdf')))
        
        data = {
            'job_description': job_description,
            'weights': json.dumps(weights)
        }
        
        print("\n📤 Sending ranking request to API...")
        print(f"   Job Description: {job_description[:80]}...")
        print(f"   Resumes: {len(resume_paths)} PDFs")
        print(f"   Weights: {weights}")
        
        try:
            response = self.session.post(
                f"{self.api_url}/api/rank",
                data=data,
                files=[(f[0], (f[1][0], open(f[1][1] if isinstance(f[1][1], str) else resume_paths[files.index(f)], 'rb'), f[1][2])) 
                       for f in files]
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"✗ API returned status code: {response.status_code}")
                print(f"   Response: {response.text}")
                return None
        
        except Exception as e:
            print(f"✗ Error during ranking: {str(e)}")
            return None
    
    def rank_resumes_simplified(
        self,
        job_description: str,
        resume_paths: List[str],
        weights: Dict[str, float] = None
    ) -> Dict[str, Any]:
        """Simplified version of rank_resumes"""
        
        if weights is None:
            weights = {
                "skills": 0.5,
                "experience": 0.3,
                "education": 0.2
            }
        
        # Check all files exist
        for resume_path in resume_paths:
            if not Path(resume_path).exists():
                raise FileNotFoundError(f"Resume file not found: {resume_path}")
        
        print("\n📤 Sending ranking request to API...")
        print(f"   Job Description: {job_description[:80]}...")
        print(f"   Resumes: {len(resume_paths)} PDFs")
        print(f"   Weights: {weights}")
        
        try:
            files = []
            for resume_path in resume_paths:
                file_obj = open(resume_path, 'rb')
                filename = Path(resume_path).name
                # Properly format file tuple with filename
                files.append(('resumes', (filename, file_obj, 'application/pdf')))
            
            data = {
                'job_description': job_description,
                'weights': json.dumps(weights)
            }
            
            response = self.session.post(
                f"{self.api_url}/api/rank",
                data=data,
                files=files
            )
            
            # Close files
            for _, file_info in files:
                if isinstance(file_info, tuple):
                    file_info[1].close()
                else:
                    file_info.close()
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"✗ API returned status code: {response.status_code}")
                print(f"   Response: {response.text}")
                return None
        
        except Exception as e:
            print(f"✗ Error during ranking: {str(e)}")
            return None
    
    def display_results(self, response: Dict[str, Any]) -> None:
        """Display ranking results in a formatted way"""
        
        if response is None:
            print("\n✗ No results to display")
            return
        
        print("\n" + "="*80)
        print("📊 RANKING RESULTS")
        print("="*80)
        
        print(f"\n✓ Status: {response.get('status', 'unknown').upper()}")
        print(f"✓ Message: {response.get('message', 'N/A')}")
        print(f"✓ Job Title: {response.get('job_title', 'N/A')}")
        print(f"✓ Resumes Processed: {response.get('total_resumes_processed', 0)}")
        
        ranked_resumes = response.get('ranked_resumes', [])
        
        if not ranked_resumes:
            print("\n✗ No ranked resumes in response")
            return
        
        print(f"\n{'='*80}")
        print(f"{'RANK':<6} {'NAME':<20} {'SCORE':<10} {'SKILLS':<10} {'EXP':<8} {'EDU':<8}")
        print(f"{'='*80}")
        
        for idx, resume in enumerate(ranked_resumes, 1):
            name = resume.get('name', 'Unknown')[:19]
            total_score = resume.get('total_score', 0)
            
            breakdown = resume.get('score_breakdown', {})
            skills_score = breakdown.get('skills', 0)
            exp_score = breakdown.get('experience', 0)
            edu_score = breakdown.get('education', 0)
            
            print(f"{idx:<6} {name:<20} {total_score:<10.2f} {skills_score:<10.2f} {exp_score:<8.2f} {edu_score:<8.2f}")
        
        print(f"\n{'='*80}")
        print("DETAILED RESULTS")
        print(f"{'='*80}\n")
        
        for idx, resume in enumerate(ranked_resumes, 1):
            print(f"\n{'─'*80}")
            print(f"🏆 RANK #{idx}")
            print(f"{'─'*80}")
            
            print(f"\nCandidate Information:")
            print(f"  Name:  {resume.get('name', 'N/A')}")
            print(f"  Email: {resume.get('email', 'N/A')}")
            print(f"  Phone: {resume.get('phone', 'N/A')}")
            
            print(f"\nScoring:")
            print(f"  Total Score: {resume.get('total_score', 0):.2f}/1.00")
            
            breakdown = resume.get('score_breakdown', {})
            print(f"  Score Breakdown:")
            print(f"    • Skills:       {breakdown.get('skills', 0):.2f} (weight: 0.50)")
            print(f"    • Experience:   {breakdown.get('experience', 0):.2f} (weight: 0.30)")
            print(f"    • Education:    {breakdown.get('education', 0):.2f} (weight: 0.20)")
            
            print(f"\nSkill Analysis:")
            matched = resume.get('matched_skills', [])
            unmatched = resume.get('unmatched_skills', [])
            extra = resume.get('extra_skills', [])
            
            if matched:
                print(f"  ✓ Matched Skills ({len(matched)}):")
                for skill in matched:
                    print(f"    • {skill}")
            else:
                print(f"  ✓ Matched Skills: None")
            
            if unmatched:
                print(f"  ✗ Unmatched Skills ({len(unmatched)}):")
                for skill in unmatched:
                    print(f"    • {skill}")
            else:
                print(f"  ✗ Unmatched Skills: None")
            
            if extra:
                print(f"  ➕ Extra Skills ({len(extra)}):")
                for skill in extra[:5]:  # Show only first 5
                    print(f"    • {skill}")
                if len(extra) > 5:
                    print(f"    ... and {len(extra) - 5} more")
            else:
                print(f"  ➕ Extra Skills: None")


def main():
    """Run the test"""
    
    print("\n" + "="*80)
    print("🚀 RESUME RANKER API TEST")
    print("="*80)
    
    # Initialize tester
    tester = ResumeRankerTester()
    
    # Check API health
    print("\n🏥 Checking API Health...")
    if not tester.check_api_health():
        print("\n⚠️  API is not running. Please start it first:")
        print("   Command: python -m src.app")
        print("   Or: python src/app.py from the Model directory")
        return
    
    # Prepare test data
    print("\n📝 Preparing test data...")
    
    job_description = """
    Senior Python Developer
    
    We are looking for an experienced Senior Python Developer with extensive knowledge in:
    
    Required Skills:
    - Python (5+ years of professional experience)
    - Django or Flask web framework
    - PostgreSQL and database design
    - REST API development and design
    - AWS cloud services (EC2, S3, RDS, Lambda)
    - Docker containerization
    - Git version control
    
    Nice to Have:
    - Machine Learning libraries (TensorFlow, Scikit-learn)
    - SQL optimization and complex queries
    - JavaScript for frontend integration
    
    Required Experience:
    - Minimum 5 years of professional Python development
    - Experience with scalable backend systems
    
    Required Education:
    - Bachelor's Degree in Computer Science or related field
    
    Responsibilities:
    - Design and implement scalable backend systems
    - Optimize database queries and performance
    - Mentor junior developers
    - Participate in code reviews
    """
    
    resume_paths = [
        "data/sample_resumes/resume_1_excellent.pdf",
        "data/sample_resumes/resume_2_good.pdf",
        "data/sample_resumes/resume_3_partial.pdf",
    ]
    
    # Check if resume PDFs exist
    print("\n📂 Checking for resume files...")
    all_exist = True
    for resume_path in resume_paths:
        if Path(resume_path).exists():
            print(f"  ✓ {resume_path}")
        else:
            print(f"  ✗ {resume_path} NOT FOUND")
            all_exist = False
    
    if not all_exist:
        print("\n⚠️  Some resume files are missing!")
        print("   Please run: python gen_sample_resumes.py")
        print("   Or go to the Project/Model directory and run the script")
        return
    
    # Weights for scoring
    weights = {
        "skills": 0.5,
        "experience": 0.3,
        "education": 0.2
    }
    
    # Run ranking
    print("\n" + "="*80)
    response = tester.rank_resumes_simplified(job_description, resume_paths, weights)
    
    # Display results
    if response:
        tester.display_results(response)
        
        print("\n" + "="*80)
        print("✓ TEST COMPLETED SUCCESSFULLY")
        print("="*80)
        
        # Summary
        ranked = response.get('ranked_resumes', [])
        if ranked:
            top_candidate = ranked[0]
            print(f"\n🏆 Top Candidate: {top_candidate.get('name', 'N/A')}")
            print(f"   Score: {top_candidate.get('total_score', 0):.2f}/1.00")
    else:
        print("\n✗ TEST FAILED - No response from API")
        print("\nTroubleshooting:")
        print("  1. Make sure Flask app is running: python -m src.app")
        print("  2. Check that your GEMINI_API_KEY is set in .env")
        print("  3. Ensure resume PDFs exist: python gen_sample_resumes.py")


if __name__ == "__main__":
    main()
