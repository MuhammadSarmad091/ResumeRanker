# Resume Ranker - Testing Guide

Complete guide to test the Resume Ranker backend with sample resumes.

## Overview

The testing setup includes:
- **2 Scripts** to generate test data and run tests
- **3 Sample Resumes** with different qualification levels
- **API Test** that ranks resumes against a job description

## Quick Start (5 minutes)

### Step 1: Configure Environment

```bash
# Copy .env template and edit it
copy .env.example .env

# Edit .env and add your Gemini API key from:
# https://makersuite.google.com/app/apikey
```

Edit `.env` file and replace:
```
GEMINI_API_KEY=your_api_key_here
```

with your actual API key:
```
GEMINI_API_KEY=sk-...your-actual-key...
```

### Step 2: Generate Sample Resumes

```bash
# Activate your virtual environment (if not already)
# Windows:
.\venv\Scripts\activate

# Generate 3 sample resume PDFs
python gen_sample_resumes.py
```

This creates 3 resumes in `data/sample_resumes/`:
- `resume_1_excellent.pdf` - Excellent match (6 years, 10+ skills)
- `resume_2_good.pdf` - Good match (4 years, 10 skills)
- `resume_3_partial.pdf` - Partial match (2 years, 9 skills)

### Step 3: Start the Flask Backend

In **Terminal 1**, run:
```bash
# Activate virtual environment
.\venv\Scripts\activate

# Start Flask server
python -m src.app
```

You should see:
```
 * Running on http://127.0.0.1:5000 (Press CTRL+C to quit)
 * Restarting with reloader
```

### Step 4: Run the Test (in a NEW Terminal)

In **Terminal 2**, run:
```bash
# Activate virtual environment
.\venv\Scripts\activate

# Run the test
python test_backend.py
```

You should see results like:
```
================================================================================
📊 RANKING RESULTS
================================================================================

✓ Status: SUCCESS
✓ Message: Successfully ranked 3 resumes
✓ Job Title: Senior Python Developer
✓ Resumes Processed: 3

================================================================================
RANK   NAME                 SCORE      SKILLS     EXP      EDU     
================================================================================
1      Alice Johnson        0.87       0.90       0.85     0.80    
2      Bob Smith            0.71       0.70       0.65     0.75    
3      Carol Williams       0.48       0.55       0.40     0.40    
```

## Detailed Testing Steps

### Step 1: Setup Environment Variables

Create a `.env` file in the Model directory:

```
GEMINI_API_KEY=your_api_key_here
FLASK_ENV=development
FLASK_DEBUG=True
MAX_FILE_SIZE=50000000
MAX_RESUMES=20
```

**Get your free Gemini API key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API Key"
3. Click "Create API Key in new project"
4. Copy the key and paste in `.env`

### Step 2: Install Additional Dependencies

Some machines may need reportlab:

```bash
pip install reportlab
```

### Step 3: Generate Sample Resumes

Run the resume generator:

```bash
python gen_sample_resumes.py
```

**Output:**
```
✓ Created data/sample_resumes/resume_1_excellent.pdf
✓ Created data/sample_resumes/resume_2_good.pdf
✓ Created data/sample_resumes/resume_3_partial.pdf

✓ All sample resumes created successfully!
✓ Location: D:\Study\Semester_8\AI_Prod\Project\Model\data\sample_resumes
```

### Step 4: Launch the Backend Server

**Terminal 1:**
```bash
# Navigate to Model directory
cd "d:\Study\Semester_8\AI_Prod\Project\Model"

# Activate virtual environment
.\venv\Scripts\activate

# Start the Flask server
python -m src.app
```

**Expected Output:**
```
 * Serving Flask app 'src.app'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
 * Press CTRL+C to quit
 * Restarting with reloader
 * Debugger is active!
 * Debugger PIN: 123-456-789
```

⚠️ **Important:** Keep this terminal open while testing!

### Step 5: Run Tests

**Terminal 2 (NEW):**
```bash
# Navigate to Model directory
cd "d:\Study\Semester_8\AI_Prod\Project\Model"

# Activate virtual environment
.\venv\Scripts\activate

# Run the test script
python test_backend.py
```

## Sample Test Output

### Health Check
```
🏥 Checking API Health...
✓ API is healthy and running
```

### Ranking Results

```
================================================================================
📊 RANKING RESULTS
================================================================================

✓ Status: SUCCESS
✓ Message: Successfully ranked 3 resumes
✓ Job Title: Senior Python Developer
✓ Resumes Processed: 3

================================================================================
RANK   NAME                 SCORE      SKILLS     EXP      EDU     
================================================================================
1      Alice Johnson        0.87       0.90       0.85     0.80    
2      Bob Smith            0.71       0.70       0.65     0.75    
3      Carol Williams       0.48       0.55       0.40     0.40    

════════════════════════════════════════════════════════════════════════════════
DETAILED RESULTS
════════════════════════════════════════════════════════════════════════════════


────────────────────────────────────────────────────────────────────────────────
🏆 RANK #1
────────────────────────────────────────────────────────────────────────────────

Candidate Information:
  Name:  Alice Johnson
  Email: alice.johnson@email.com
  Phone: +1-555-0101

Scoring:
  Total Score: 0.87/1.00
  Score Breakdown:
    • Skills:       0.90 (weight: 0.50)
    • Experience:   0.85 (weight: 0.30)
    • Education:    0.80 (weight: 0.20)

Skill Analysis:
  ✓ Matched Skills (8):
    • python
    • django
    • postgresql
    • rest apis
    • aws
    • docker
    • git
    • machine learning
  ✗ Unmatched Skills (0):
  ➕ Extra Skills (2):
    • JavaScript
    • SQL
```

## Understanding the Results

### Scoring Breakdown

Each resume is scored in 3 sections (0.0 to 1.0 scale):

1. **Skills Score** (weight: 50%)
   - Percentage of job required skills found in resume
   - Uses NLP matching for skill synonyms
   - Example: If job needs 10 skills and resume has 9 → score = 0.90

2. **Experience Score** (weight: 30%)
   - Compares years of experience
   - 1.0 = meets or exceeds requirement
   - 0.5 = has 50% of required years
   - Example: Job needs 5 years, resume has 4 → score = 0.80

3. **Education Score** (weight: 20%)
   - Matches degree types
   - Recognizes Bachelor, Master, PhD, etc.
   - Example: If match found → score = 1.0

### Final Score Calculation

```
Total Score = (Skills Score × 0.50) + 
              (Experience Score × 0.30) + 
              (Education Score × 0.20)
```

### In the Sample Test

**Resume 1 (Alice Johnson) - Score: 0.87** ✓ Excellent Match
- Has 6+ years experience (exceeds 5 year requirement) → 0.85
- Has 8 out of 8 required skills → 0.90
- Has Master's degree (exceeds Bachelor requirement) → 0.80
- Final: (0.90 × 0.5) + (0.85 × 0.3) + (0.80 × 0.2) = 0.87

**Resume 2 (Bob Smith) - Score: 0.71** ✓ Good Match
- Has 4 years experience (80% of 5 required) → 0.80
- Has 7 out of 8 required skills → 0.88
- Has Bachelor's degree (meets requirement) → 0.85
- Final: (0.88 × 0.5) + (0.80 × 0.3) + (0.85 × 0.2) = 0.85

**Resume 3 (Carol Williams) - Score: 0.48** ⚠️ Partial Match
- Has 2 years experience (40% of 5 required) → 0.40
- Has 5 out of 8 required skills → 0.63
- Has Bachelor's degree (meets requirement) → 0.85
- May not match due to different tech stack
- Final: (0.63 × 0.5) + (0.40 × 0.3) + (0.85 × 0.2) = 0.57

## Troubleshooting

### Problem: "Cannot connect to API"

```
✗ Cannot connect to API at http://localhost:5000
```

**Solution:**
```bash
# Make sure Flask app is running in another terminal
python -m src.app

# Check the terminal where you started Flask - look for:
# * Running on http://127.0.0.1:5000
```

### Problem: "No API response" or "API returned status code"

**Solution:**
1. Check Flask terminal for errors
2. Verify GEMINI_API_KEY is set in .env
3. Test a simpler endpoint first:
   ```bash
   curl http://localhost:5000/api/health
   ```

### Problem: "Resume file not found"

```
FileNotFoundError: Resume file not found: data/sample_resumes/resume_1_excellent.pdf
```

**Solution:**
```bash
# Generate the sample resumes
python gen_sample_resumes.py
```

### Problem: "GEMINI_API_KEY is not set"

```
ValueError: GEMINI_API_KEY is not set in environment variables
```

**Solution:**
1. Check that `.env` file exists in Model directory
2. Edit `.env` and set a valid GEMINI_API_KEY
3. Restart the Flask server

### Problem: "reportlab is not installed"

```
ModuleNotFoundError: No module named 'reportlab'
```

**Solution:**
```bash
pip install reportlab
```

## Testing Different Scenarios

### Test 1: Default Weights (Current)

Uses:
- Skills: 50%
- Experience: 30%
- Education: 20%

```bash
python test_backend.py
```

### Test 2: Custom Weights (Skills-Heavy)

Modify `test_backend.py`:

```python
weights = {
    "skills": 0.7,      # Prioritize skills
    "experience": 0.2,
    "education": 0.1
}
```

### Test 3: Single Resume

Modify `test_backend.py`:

```python
resume_paths = [
    "data/sample_resumes/resume_1_excellent.pdf",
]
```

### Test 4: Custom Job Description

Modify `test_backend.py`:

```python
job_description = """
Your custom job description here...

Required Skills:
- Python
- Django
- PostgreSQL
...
"""
```

## Advanced Testing

### Using cURL Commands

Test individual endpoints:

```bash
# 1. Health Check
curl http://localhost:5000/api/health

# 2. Parse Job Description
curl -X POST http://localhost:5000/api/job-description/parse \
  -H "Content-Type: application/json" \
  -d "{\"job_description_text\": \"Senior Python Developer needed...\"}"

# 3. Parse Resume (requires PDF file)
curl -X POST http://localhost:5000/api/resume/parse \
  -F "resume=@data/sample_resumes/resume_1_excellent.pdf"

# 4. Rank Resumes (requires multiple PDFs)
curl -X POST http://localhost:5000/api/rank \
  -F "job_description=Senior Python Developer needed..." \
  -F "weights={\"skills\": 0.5, \"experience\": 0.3, \"education\": 0.2}" \
  -F "resumes=@data/sample_resumes/resume_1_excellent.pdf" \
  -F "resumes=@data/sample_resumes/resume_2_good.pdf" \
  -F "resumes=@data/sample_resumes/resume_3_partial.pdf"
```

### Using Python with requests

```python
import requests

# Test parsing endpoint
response = requests.post(
    "http://localhost:5000/api/job-description/parse",
    json={
        "job_description_text": "Looking for a Python developer..."
    }
)

print(response.json())
```

## Performance Notes

- Parsing with Gemini API takes ~2-5 seconds per resume
- Total test with 3 resumes: ~10-15 seconds
- Network latency depends on API key and location

## Next Steps

After successful testing:

1. **Frontend Integration**: Connect your React frontend to these API endpoints
2. **Database**: Add MongoDB to store rankings history
3. **Authentication**: Add user authentication for job postings
4. **Batch Processing**: Handle bulk resume uploads
5. **Caching**: Cache job descriptions to reduce API calls

## Files Created for Testing

```
Model/
├── gen_sample_resumes.py      # Generate sample PDFs
├── test_backend.py            # Main test script
├── setup_and_test.py          # Interactive setup
├── TESTING.md                 # This file
└── data/sample_resumes/       # Generated test data
    ├── resume_1_excellent.pdf
    ├── resume_2_good.pdf
    └── resume_3_partial.pdf
```

## Support

If you encounter issues:

1. Check the error message carefully
2. Review the Troubleshooting section
3. Verify all files are in place
4. Check that Flask server is running
5. Ensure GEMINI_API_KEY is valid

## Quick Command Reference

```bash
# Generate resumes
python gen_sample_resumes.py

# Start backend (Terminal 1)
python -m src.app

# Run tests (Terminal 2)
python test_backend.py

# Check if API is running
curl http://localhost:5000/api/health

# Install missing packages
pip install reportlab

# View Flask logs
python -m src.app

# Stop Flask (press Ctrl+C in the Flask terminal)
```

---

**Happy Testing! 🚀**
