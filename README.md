# Job Search and Application Automation

An automated system that scans job boards, evaluates open roles against your Master Resume Data, calculates precise fit percentages, and generates tailored, 1-page ATS-compliant resumes for highly qualified positions.

## 🚀 Quick Start

### Run with Dashboard UI (Recommended)
```bash
./run-job-search.sh --mode dashboard --timeRange today
```

### Run from Claude Code
```bash
# Standard mode - CLI output
Workflow({scriptPath: "job-search-workflow.js"})

# Dashboard mode
Workflow({scriptPath: "job-search-workflow.js"})  # Dashboard renders in terminal
```

### Quick Test
```bash
Workflow({scriptPath: "simple-job-workflow.js"})
```

## 📋 How It Works

### 1. Discovery Phase
Searches multiple job boards (LinkedIn, Indeed) using Apify actors. Supports 3 time ranges:

| Time Range | Hours | Latest Jobs |
|------------|-------|-------------|
| **today**  | 24h   | Posted today / last 24 hours |
| **7days**  | 168h  | Posted in last week (default) |
| **30days** | 720h  | Posted in last month |

### 2. Evaluation Phase
Calculates strict Fit Scores (0-100%) based on:
- **Keyword matching**: 50% — skills, tools, frameworks from your resume
- **Experience match**: 30% — years, background, support keywords
- **Skills match**: 20% — proficiency, knowledge of keywords

### 3. Filtering Phase (Routing Rules)
| Fit Score | Action | Color |
|-----------|--------|-------|
| 85-100%   | **AUTO-APPLY** ✅ | 🟢 Green |
| 70-84%    | **MANUAL REVIEW** ⚠️ | 🟡 Yellow |
| <70%      | **AUTO-REJECTED** ❌ | 🔴 Red |

### 4. Generation Phase
Creates 1-page ATS-compliant Markdown resumes with:
- **Marist University**: 4-5 verbatim bullets from your experience
- **Forge Alumnus**: 3 verbatim bullets
- **Projects**: 2 most relevant (2 bullets each)
- **Leadership**: Maximum 2 bullets (if space permits)
- **100% verbatim preservation** — No rewriting or hallucination

## ⚙️ Configuration

Edit `job-search-config.json` to customize:

```json
{
  "search": {
    "location": "United States",
    "sites": ["linkedin", "indeed"],
    "maxResults": 25,
    "isRemote": true,
    "hoursOld": 168,
    "timeRange": "7days",
    "linkedinFetchDescription": true,
    "descriptionFormat": "markdown",
    "enforceAnnualSalary": true,
    "actor": "openclawai/job-board-scraper"
  },
  "thresholds": {
    "autoApply": 85,
    "manualReview": 70,
    "autoReject": 0
  }
}
```

### Time Range Options
- **today**: Jobs posted in last 24 hours — best for finding fresh opportunities
- **7days** (default): Jobs posted in last week — balanced approach
- **30days**: Jobs posted in last month — broader search

## 📊 Files

| File | Description |
|------|-------------|
| `job-search-workflow.js` | Main dashboard workflow with UI |
| `job-search-practical-workflow.js` | Practical keyword-based fit scoring |
| `simple-job-workflow.js` | Simple test workflow |
| `job-search-config.json` | Configuration parameters |
| `master-resume-data.json` | Your master resume data |
| `run-job-search.sh` | Helper script with dashboard UI |
| `.gitignore` | Excludes `.android/`, `.DS_Store`, sensitive files |

## 🎯 Example Output

### Dashboard Summary
```
📊 SUMMARY:
  🟢 Auto-apply (3): Fit ≥ 85%
  🟡 Manual review (5): Fit 70-84%
  🔴 Auto-rejected (2): Fit < 70%
```

### Auto-APPLY Candidate
```
Target Role & Company: Instructional Design Generalist - Culinary Institute of America
Fit Score: 90% - User has extensive Brightspace and WCAG 2.2 experience...
Execution Decision: [AUTO-APPLY INITIATED]
Document: [Full tailored 1-page Markdown resume]
```

### Manual Review Candidate
```
Target Role & Company: Full Stack Developer - Tech Startup XYZ
Fit Score: 78% - User has Node.js, Express, MongoDB experience...
Execution Decision: [FLAGGED FOR MANUAL REVIEW]
```

## 📦 Requirements

- Claude Code with Workflow tool access
- Apify account with access to `openclawai/job-board-scraper` actor
- Your master resume data at `master-resume-data.json`

## 🔄 Running Periodically

Use the `loop` skill for scheduled runs:
```
/loop 2h /job-search-workflow.js
```

## 📁 Output Files

Resumes are saved to `output/` directory as Markdown files with naming:
```
{LMSAdministrator|AccessibilitySpecialist|FullStackDeveloper|FlutterMobileDeveloper}_{Company}_{Timestamp}.md
```

Example: `LMSAdministrator_CulinaryInstituteOfAmerica_20260115_1430.md`

## 🛠️ Troubleshooting

- **No jobs found**: Try a different time range (`--timeRange 30days`)
- **Low fit scores**: Check `master-resume-data.json` keyword coverage
- **Dashboard not rendering**: Ensure you're in Claude Code with terminal access