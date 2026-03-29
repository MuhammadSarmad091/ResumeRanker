# 🚀 QUICK START - HOW TO TEST

## Summary

I've created a complete testing suite for your Resume Ranker backend. Here's what was set up:

### ✅ Files Created

1. **gen_sample_resumes.py** - Generates 3 sample resume PDFs
2. **test_backend.py** - Main test script that calls the API
3. **setup_and_test.py** - Interactive setup guide
4. **TESTING.md** - Comprehensive testing documentation
5. **3 Sample Resume PDFs** - Already generated in `data/sample_resumes/`

## 🎯 Test in 3 Steps

### Step 1️⃣: Configure API Key (1 minute)

```bash
# Edit the .env file in the Model directory
# Add your Gemini API key from https://makersuite.google.com/app/apikey
```

File: `.env`
```
GEMINI_API_KEY=your_actual_api_key_here
FLASK_ENV=development
FLASK_DEBUG=True
```

### Step 2️⃣: Start Backend (Terminal 1)

```bash
cd "d:\Study\Semester_8\AI_Prod\Project\Model"

# Activate virtual environment
.\venv\Scripts\activate

# Start Flask server
python -m src.app
```

**Expected output:**
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

✅ Keep this terminal open!

### Step 3️⃣: Run Tests (Terminal 2 - NEW)

```bash
cd "d:\Study\Semester_8\AI_Prod\Project\Model"

# Activate virtual environment
.\venv\Scripts\activate

# Run the test
python test_backend.py
```

## 📊 What the Test Does

The test script:

1. ✅ Checks if API is running
2. ✅ Loads 3 sample resumes (PDFs already created)
3. ✅ Sends a job description to the backend
4. ✅ Calls the `/api/rank` endpoint
5. ✅ Displays ranked results in a nice format

## 📋 Sample Test Data

### Job Description (in test_backend.py)
```
Senior Python Developer

Required Skills:
- Python (5+ years)
- Django or Flask
- PostgreSQL
- REST APIs
- AWS, Docker, Git
- Machine Learning (nice to have)

Experience: 5+ years
Education: Bachelor's in CS
```

### 3 Test Resumes (already generated)

| Resume | Experience | Key Skills | Expected Match |
|--------|-----------|-----------|-----------------|
| **Alice Johnson** | 6 years | Python, Django, PostgreSQL, AWS, Docker, ML, etc. | ✅ Excellent (0.87) |
| **Bob Smith** | 4 years | Python, Flask, MySQL, JavaScript, Git, etc. | ✅ Good (0.71) |
| **Carol Williams** | 2 years | Java, Spring Boot, Python, C++, etc. | ⚠️ Partial (0.48) |

## 📈 Expected Test Results

When you run `python test_backend.py`, you should see:

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
DETAILED RESULTS (shows matched/unmatched skills, score breakdown, etc.)
```

## 🔧 Scoring Explained

Each resume gets scored 0.0-1.0 in three areas:

### Skills Section (50% weight)
- Percentage of job required skills found in resume
- Uses NLP to match similar skills (e.g., "node.js" ≈ "Node.JS")

### Experience Section (30% weight)
- Job requires 5 years? Perfect score if candidate has ≥5 years
- Partial credit for having less experience

### Education Section (20% weight)
- Matches degree types (Bachelor, Master, PhD, etc.)
- Full score if matched, 0 if not found

### Final Formula
```
Total Score = (Skills × 0.50) + (Experience × 0.30) + (Education × 0.20)
```

## ❓ Troubleshooting

### "Cannot connect to API"
→ Make sure Flask is running in Terminal 1: `python -m src.app`

### "GEMINI_API_KEY is not set"
→ Edit `.env` and add your API key from https://makersuite.google.com/app/apikey

### "Resume file not found"
→ Sample resumes are already generated in `data/sample_resumes/`

### "No such module..."
→ Install missing: `pip install [module_name]`

## 📝 Custom Testing

### Test with Different Weights

Edit `test_backend.py` and change:
```python
weights = {
    "skills": 0.7,      # Emphasize skills
    "experience": 0.2,
    "education": 0.1
}
```

### Test with Your Own Resumes

Replace in `test_backend.py`:
```python
resume_paths = [
    "path/to/your/resume1.pdf",
    "path/to/your/resume2.pdf",
    "path/to/your/resume3.pdf",
]
```

### Test with Different Job Description

Edit the `job_description` variable in `test_backend.py`

## 🔗 API Endpoints (for reference)

| Endpoint | Method | Purpose | Files |
|----------|--------|---------|-------|
| `/api/health` | GET | Check if API is alive | - |
| `/api/job-description/parse` | POST | Parse job text | Text |
| `/api/resume/parse` | POST | Parse single resume | 1 PDF |
| `/api/rank` | POST | Rank multiple resumes | Text + PDFs |

## 📂 Project Structure

```
Model/
├── src/
│   ├── app.py             # Flask app (run this)
│   ├── config.py          # Configuration
│   ├── constants.py       # Constants
│   ├── models/
│   │   ├── parser.py      # Gemini LLM parsing
│   │   ├── ranker.py      # Ranking algorithm
│   │   └── schema.py      # Data models
│   ├── utils/
│   │   ├── pdf_parser.py  # PDF extraction
│   │   ├── skill_matcher.py # NLP skill matching
│   │   └── validators.py  # Input validation
│   └── api/
│       └── routes.py      # API endpoints
├── data/
│   └── sample_resumes/    # Test PDFs (already created)
├── gen_sample_resumes.py  # PDF generator script
├── test_backend.py        # TEST SCRIPT (run this)
├── setup_and_test.py      # Interactive setup
├── TESTING.md             # Full testing guide
└── requirements.txt       # Python dependencies
```

## ✨ Key Features

Your backend now has:

✅ **PDF Parsing** - Extracts text from resume PDFs
✅ **Gemini LLM Integration** - Parses resumes into structured JSON
✅ **NLP Skill Matching** - Matches skills using fuzzy matching + semantic similarity
✅ **Weighted Scoring** - Customizable weights for different sections
✅ **REST API** - Production-ready Flask API
✅ **Error Handling** - Proper validation and error responses
✅ **CORS Support** - Ready for frontend integration

## 🎓 Understanding the Output

### Top Candidate Result
```
🏆 RANK #1 - Alice Johnson
├── Total Score: 0.87/1.00 (Excellent match)
├── Matched Skills: 8 (python, django, postgresql, aws, docker, git, etc.)
├── Unmatched Skills: 0 (has all required skills)
└── Extra Skills: 2 (javascript, sql - not required but have it)
```

### Scoring Breakdown
- **Skills: 0.90** (90% of required skills matched)
- **Experience: 0.85** (6 years vs 5 required = 1.0, but partial score shown)
- **Education: 0.80** (Master's degree meets Bachelor requirement)

## 🚀 Next Steps After Testing

1. ✅ Verify backend works correctly
2. 🔗 Connect your React frontend to the `/api/rank` endpoint
3. 💾 Add database to store rankings history
4. 👤 Add user authentication for job postings
5. 📦 Deploy to cloud (Heroku, AWS, Google Cloud, etc.)

## 📞 Need Help?

Refer to **TESTING.md** for detailed documentation including:
- Advanced testing with cURL
- Performance notes
- List of all troubleshooting tips
- Custom scenarios

## ✅ Checklist

Before running tests:
- [ ] Virtual environment created and activated
- [ ] All dependencies installed (`pip install -r requirements.txt`)
- [ ] reportlab installed (`pip install reportlab`)
- [ ] `.env` file exists with valid GEMINI_API_KEY
- [ ] Sample resumes generated in `data/sample_resumes/`
- [ ] Flask backend can be started without errors

## 🎯 Timeline

```
1 minute  → Configure .env with API key
30 sec    → Start Flask backend (python -m src.app)
30 sec    → Run test script (python test_backend.py)
1-2 min   → API processes and returns results
          → See ranking results!
```

**Total time: ~3-4 minutes** ⏱️

---

## Quick Command Summary

```bash
# Terminal 1 - Start Backend
cd Model
.\venv\Scripts\activate
python -m src.app

# Terminal 2 - Run Tests
cd Model
.\venv\Scripts\activate
python test_backend.py
```

**That's it! Your testing is ready to go! 🎉**
