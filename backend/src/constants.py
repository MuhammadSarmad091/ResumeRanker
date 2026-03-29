"""Constants for Resume Ranker Application"""

# File upload settings
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
MAX_RESUMES = 20
ALLOWED_FILE_EXTENSIONS = {'pdf'}

# Gemini model configuration
GEMINI_MODEL = "gemini-2.5-flash"

# Skill matching threshold (0-1 scale)
SKILL_MATCH_THRESHOLD = 0.6

# Scoring weights defaults (can be overridden by frontend)
DEFAULT_WEIGHTS = {
    'skills': 0.5,
    'experience': 0.3,
    'education': 0.2
}

# Parsing prompt for Gemini
PARSING_PROMPT_TEMPLATE = """
Extract structured information from the following text.
Return a valid JSON object with these exact fields:
- skills: list of skill names (lowercase, comma-separated, unique) from all the sections
- experience: total years of experience as a number (for resumes, sum all years; for job descriptions, minimum required)
- education: list of degree names

Text:
{text}

Return ONLY valid JSON, no additional text.
"""

JOB_DESCRIPTION_PARSING_PROMPT = """
Extract structured information from this job description.
Return a valid JSON object with these exact fields:
- title: job title as string
- skills: list of required skill names (lowercase,unique) from all the sections including experience section
- experience: minimum years of experience required as a number
- education: list of required degrees

Job Description:
{text}

Return ONLY valid JSON, no additional text.
"""

RESUME_PARSING_PROMPT = """
Extract structured information from this resume.
Return a valid JSON object with these exact fields:
- name: candidate name
- phone: phone number (or null if not found)
- email: email address (or null if not found)
- skills: list of all skills mentioned (lowercase,unique)
- experience: total years of experience as a number
- education: list of degrees

Resume:
{text}

Return ONLY valid JSON, no additional text.
"""

BATCH_RESUME_PARSING_PROMPT = """
Extract structured information from the following {count} resumes.
Return a valid JSON array with {count} objects. Each object should have these exact fields:
- name: candidate name
- phone: phone number (or null if not found)
- email: email address (or null if not found)
- skills: list of all skills mentioned (lowercase)
- experience: total years of experience as a number
- education: list of degrees

Resumes (each separated by "--- RESUME SEPARATOR ---"):

{resumes_text}

Return ONLY a valid JSON array. Example format:
[
  {{"name": "John Doe", "email": "john@example.com", "phone": "+1-555-0001", "skills": ["python", "django"], "experience": 5, "education": ["bachelor's in cs"]}},
  {{"name": "Jane Smith", "email": "jane@example.com", "phone": "+1-555-0002", "skills": ["java", "spring"], "experience": 3, "education": ["bachelor's in se"]}}
]
"""
