# Resume Ranker Backend

An AI-powered backend system for ranking resumes against job descriptions using Google Gemini API and advanced NLP skill matching.

## Project Structure

```
Model/
├── src/
│   ├── api/              # Flask API routes
│   ├── models/           # Core ranking and parsing logic
│   ├── utils/            # Utility modules (PDF parsing, skill matching, validation)
│   ├── app.py            # Flask application factory
│   ├── config.py         # Configuration management
│   └── constants.py      # Constants and prompts
├── data/
│   ├── uploads/          # Temporary storage for uploaded files
│   └── sample_jobs/      # Sample job descriptions
├── requirements.txt      # Python dependencies
├── .env.example          # Environment variables template
└── README.md             # This file
```

## Features

- **PDF Resume Parsing**: Extract and analyze resume PDFs
- **Gemini LLM Integration**: Parse resumes and job descriptions using Google's Gemini API
- **Intelligent Skill Matching**: Uses both fuzzy matching and semantic similarity (NLP) for accurate skill matching
- **Section-wise Scoring**: Separate scoring for skills, experience, and education
- **Weighted Ranking**: Customizable weights for different scoring sections
- **REST API**: Flask-based API for resume ranking

## Installation

### 1. Create and Activate Virtual Environment

```bash
cd Model
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Setup Environment Variables

```bash
# Create .env file from template
cp .env.example .env

# Edit .env and add your Gemini API key
# GEMINI_API_KEY=your_api_key_here
```

Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Running the Application

```bash
python -m src.app
```

The API will be available at `http://localhost:5000`

## API Endpoints

### 1. Health Check
```
GET /api/health
```
Returns health status of the API.

### 2. Job Description Parsing
```
POST /api/job-description/parse
Content-Type: application/json

{
  "job_description_text": "Full job description..."
}
```

Returns parsed job data:
```json
{
  "status": "success",
  "data": {
    "title": "Senior Python Developer",
    "skills": ["python", "django", "postgresql"],
    "experience": 5,
    "education": ["bachelor's in computer science"]
  }
}
```

### 3. Resume Parsing
```
POST /api/resume/parse
Content-Type: multipart/form-data

Form Data:
- resume: [PDF file]
```

Returns parsed resume data:
```json
{
  "status": "success",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "skills": ["python", "javascript"],
    "experience": 4,
    "education": ["bachelor's of science"]
  }
}
```

### 4. Rank Resumes (Main Endpoint)
```
POST /api/rank
Content-Type: multipart/form-data

Form Data:
- job_description: "Full job description..."
- weights: "{\"skills\": 0.5, \"experience\": 0.3, \"education\": 0.2}"
- resumes: [PDF file 1, PDF file 2, ...]
```

Returns ranked resumes:
```json
{
  "status": "success",
  "message": "Successfully ranked 3 resumes",
  "job_title": "Senior Python Developer",
  "total_resumes_processed": 3,
  "ranked_resumes": [
    {
      "name": "John Doe",
      "phone": "+1234567890",
      "email": "john@example.com",
      "total_score": 0.85,
      "score_breakdown": {
        "skills": 0.9,
        "experience": 0.8,
        "education": 0.8
      },
      "matched_skills": ["python", "django"],
      "unmatched_skills": ["postgresql"],
      "extra_skills": ["javascript"]
    },
    ...
  ]
}
```

## Ranking Algorithm

### Scoring Sections

1. **Skills Section (default weight: 0.5)**
   - Calculates percentage of job-required skills found in resume
   - Uses NLP-based semantic similarity + fuzzy string matching
   - Returns: matched_skills, unmatched_skills, extra_skills

2. **Experience Section (default weight: 0.3)**
   - Checks if candidate meets minimum required experience
   - Full score (1.0) if experience >= requirement
   - Partial score based on percentage if below requirement

3. **Education Section (default weight: 0.2)**
   - Matches degrees between job description and resume
   - Recognizes degree types (Bachelor, Master, PhD, etc.)
   - Returns normalized match score

### Total Score Calculation
```
Total Score = (Skills Score × Skills Weight) + 
              (Experience Score × Experience Weight) + 
              (Education Score × Education Weight)
```

Weights are automatically normalized to sum to 1.0.

## Dependencies

| Package | Purpose |
|---------|---------|
| Flask | Web framework |
| Flask-CORS | Cross-Origin Resource Sharing |
| google-generativeai | Gemini LLM integration |
| pymupdf | PDF text extraction |
| sentence-transformers | NLP embeddings for skill matching |
| rapidfuzz | Fuzzy string matching |
| pydantic | Data validation |
| python-dotenv | Environment configuration |

## Configuration

Edit `src/constants.py` to customize:
- Gemini model used
- Skill matching thresholds
- Default scoring weights
- LLM parsing prompts

## Error Handling

All endpoints return consistent error responses:
```json
{
  "status": "error",
  "message": "Description of the error"
}
```

Common error codes:
- `400`: Validation error (missing fields, invalid format)
- `404`: Endpoint not found
- `500`: Server error

## Development

For development, enable debug mode in `.env`:
```
FLASK_ENV=development
FLASK_DEBUG=True
```

The server will auto-reload on file changes.

## Frontend Integration

The React frontend should:
1. Collect job description text
2. Collect weight preferences
3. Collect resume PDF files
4. Send multipart POST request to `/api/rank`
5. Display ranked results with scores and skill breakdown

## Future Enhancements

- [ ] Database storage for job descriptions and rankings
- [ ] User authentication and authorization
- [ ] Bulk ranking operations
- [ ] Resume template support (Word documents)
- [ ] Advanced NLP models for better skill matching
- [ ] Caching for frequently used job descriptions
- [ ] Analytics and reporting dashboard

## Testing

```bash
# Run tests (add test suite as needed)
pytest
```

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please create an issue in the project repository.
