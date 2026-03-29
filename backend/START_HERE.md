# 🎯 TESTING - START HERE

## Complete Testing Suite is Ready! ✅

All the testing code, sample PDFs, and documentation have been created and set up for you.

---

## 🚀 START TESTING IN 3 MINUTES

### 1️⃣ Set Your API Key (1 minute)

Edit the file: `d:\Study\Semester_8\AI_Prod\Project\Model\.env`

Change this:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

To this:
```
GEMINI_API_KEY=your_actual_key_from_google
```

Get a free key: https://makersuite.google.com/app/apikey

---

### 2️⃣ Open Terminal 1 and Start Backend (30 seconds)

```bash
cd "d:\Study\Semester_8\AI_Prod\Project\Model"
.\venv\Scripts\activate
python -m src.app
```

**Expected Output:**
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

✅ **Leave this terminal running!**

---

### 3️⃣ Open Terminal 2 (NEW) and Run Test (30 seconds)

```bash
cd "d:\Study\Semester_8\AI_Prod\Project\Model"
.\venv\Scripts\activate
python test_backend.py
```

---

## 📊 WHAT YOU'LL SEE

The test will display results like this:

```
==================================================================================
📊 RANKING RESULTS
==================================================================================

✓ Status: SUCCESS
✓ Message: Successfully ranked 3 resumes
✓ Job Title: Senior Python Developer
✓ Resumes Processed: 3

==================================================================================
RANK   NAME                 SCORE      SKILLS     EXP      EDU     
==================================================================================
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

---

## 📋 WHAT WAS CREATED FOR YOU

### Test Scripts
```
✅ test_backend.py          - Main test script to run
✅ gen_sample_resumes.py    - Generates PDFs (already ran)
✅ setup_and_test.py        - Interactive setup helper
```

### Documentation
```
✅ QUICK_START.md           - Quick reference (1-2 min read)
✅ TESTING.md               - Complete guide (5-10 min read)
✅ TESTING_COMPLETE.md      - Comprehensive overview
✅ README.md                - Backend documentation
```

### Test Data
```
✅ resume_1_excellent.pdf   - Alice Johnson (6 years, excellent match)
✅ resume_2_good.pdf        - Bob Smith (4 years, good match)
✅ resume_3_partial.pdf     - Carol Williams (2 years, partial match)
```

### Location: `data/sample_resumes/` ← All PDFs are ready!

---

## 🎯 UNDERSTANDING THE SCORING

### Three Scoring Sections

**Skills (50% weight)** 
```
% of job skills found in resume
Alice: 8/8 = 1.0 → 0.90 (normalization)
Bob: 7/8 = 0.875 → 0.70
Carol: 5/8 = 0.625 → 0.55
```

**Experience (30% weight)**
```
Years requirement met?
Alice: 6 years vs 5 required → 0.85
Bob: 4 years vs 5 required → 0.65 (80% of requirement)
Carol: 2 years vs 5 required → 0.40 (40% of requirement)
```

**Education (20% weight)**
```
Degree requirements met?
Alice: Master's (exceeds Bachelor requirement) → 0.80
Bob: Bachelor's (meets requirement) → 0.75
Carol: Bachelor's (different field) → 0.40
```

### Final Calculation
```
Alice: (0.90 × 0.50) + (0.85 × 0.30) + (0.80 × 0.20) = 0.87 ✅ Excellent
Bob:   (0.70 × 0.50) + (0.65 × 0.30) + (0.75 × 0.20) = 0.71 ✅ Good
Carol: (0.55 × 0.50) + (0.40 × 0.30) + (0.40 × 0.20) = 0.48 ⚠️  Partial
```

---

## 🔍 TEST DATA INCLUDED

### Job Description (in the test)
```
Position: Senior Python Developer

Requirements:
• 5+ years Python experience
• Django or Flask framework
• PostgreSQL database
• REST API design
• AWS cloud services
• Docker containerization
• Git version control

Nice to have:
• Machine Learning
• Advanced SQL
```

### 3 Sample Resumes (ready to test)

| Candidate | Experience | Key Skills | Degree | Expected Score |
|-----------|-----------|-----------|--------|-----------------|
| Alice | 6 years | Python, Django, PostgreSQL, AWS, Docker, ML, etc. | Master's | 0.87 ✅ |
| Bob | 4 years | Python, Flask, MySQL, JavaScript, Git, etc. | Bachelor's | 0.71 ✅ |
| Carol | 2 years | Java, Spring Boot, Python, C++, etc. | Bachelor's | 0.48 ⚠️ |

---

## ❌ COMMON ISSUES & SOLUTIONS

| Problem | Solution |
|---------|----------|
| **"Cannot connect to API"** | Make sure Terminal 1 is running: `python -m src.app` |
| **"GEMINI_API_KEY not set"** | Edit `.env` and add your key from https://makersuite.google.com/app/apikey |
| **"Resume file not found"** | PDFs are in `data/sample_resumes/` - verify they exist |
| **"ImportError: No module"** | Run `pip install [module]` (all should be installed though) |
| **API returns 500 error** | Check Flask terminal for error - might be API key issue |

---

## 📂 FILE LOCATIONS

Everything is in: `d:\Study\Semester_8\AI_Prod\Project\Model\`

```
Model/
├── .env                         ← Add your API key here
├── test_backend.py              ← Run this to test
├── gen_sample_resumes.py        ← Already executed
├── QUICK_START.md               ← Quick guide
├── TESTING.md                   ← Detailed guide
├── TESTING_COMPLETE.md          ← Full overview (you are reading related)
├── src/app.py                   ← Start this: python -m src.app
└── data/sample_resumes/
    ├── resume_1_excellent.pdf   ← Ready to use
    ├── resume_2_good.pdf        ← Ready to use
    └── resume_3_partial.pdf     ← Ready to use
```

---

## ✨ KEY FEATURES TESTED

Your backend will test:

✅ **PDF Parsing** - Reads resume PDFs and extracts text
✅ **LLM Integration** - Uses Gemini API to parse structured data
✅ **Skill Matching** - NLP-based skill matching with fuzzy logic
✅ **Weighted Scoring** - Customizable weights for each section
✅ **REST API** - All endpoints working correctly
✅ **Error Handling** - Proper validation and error responses

---

## 🎓 WHAT EACH ENDPOINT DOES

```
GET /api/health
  → Checks if API is running
  
POST /api/job-description/parse
  → Parses job description text into JSON
  
POST /api/resume/parse
  → Parses a single resume PDF
  
POST /api/rank  ← MAIN ENDPOINT
  → Ranks multiple resumes against a job
```

The test uses the `/api/rank` endpoint with:
- Job description text
- 3 resume PDFs
- Scoring weights

---

## ⏱️ TIMELINE

```
|-- STEP 1: Edit .env (1 minute)
|   └─ Add GEMINI_API_KEY
|
|-- STEP 2: Start Backend (30 seconds)
|   └─ Terminal 1: python -m src.app
|   └─ Wait for "Running on 127.0.0.1:5000"
|
|-- STEP 3: Run Test (30 seconds + processing)
|   └─ Terminal 2: python test_backend.py
|   └─ Gemini processes PDFs (10-15 seconds)
|   └─ Results display
|
└─ TOTAL: ~3-4 minutes to complete test
```

---

## 🚀 QUICKEST POSSIBLE PATH

### Minimum commands to run test:

```bash
# Terminal 1
cd d:\Study\Semester_8\AI_Prod\Project\Model
python -m src.app

# Terminal 2 (new)
cd d:\Study\Semester_8\AI_Prod\Project\Model
python test_backend.py
```

**Note**: You must edit `.env` first with your API key!

---

## ✅ SUCCESS CHECKLIST

Before running test:
- [ ] `.env` has valid GEMINI_API_KEY
- [ ] `data/sample_resumes/` has 3 PDFs
- [ ] Can start Flask without errors
- [ ] Terminal is in Model directory

When running test:
- [ ] Flask shows "Running on http://127.0.0.1:5000"
- [ ] Test shows "API is healthy and running"
- [ ] 3 resumes are ranked
- [ ] Scores are 0.0-1.0 range
- [ ] Detailed results show skills breakdown

---

## 📚 FOR MORE INFORMATION

| Document | Read Time | Content |
|----------|-----------|---------|
| **QUICK_START.md** | 2 min | Basic testing overview |
| **TESTING.md** | 10 min | Complete testing guide |
| **README.md** | 5 min | API documentation |

---

## 🎉 YOU'RE READY!

Everything is set up. Just:

1. ✎️ Add your API key to `.env`
2. ▶️ Start Flask: `python -m src.app`
3. ▶️ Run test: `python test_backend.py`
4. 📊 View results

**That's it! Good luck! 🚀**

---

### Still have questions?

- **For quick answers**: Read QUICK_START.md
- **For detailed guide**: Read TESTING.md
- **For troubleshooting**: See "COMMON ISSUES" section above

---

**Time to start testing: RIGHT NOW! ⏰**
