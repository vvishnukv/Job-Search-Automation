# Job Search and Application Automation

An automated system that scans job boards, evaluates open roles against your Master Resume Data, calculates precise fit percentages, and generates tailored, 1-page ATS-compliant resumes for highly qualified positions.

## Quick Start

Run the workflow in Claude Code:

```bash
# Run the main job search workflow
Workflow({scriptPath: "job-search-workflow.js"})

# Run the simple test first (to verify setup)
Workflow({scriptPath: "simple-job-workflow.js"})
```

## How It Works

### 1. Discovery Phase
Searches multiple job boards (LinkedIn, Indeed) using Apify actors for 4 target tracks:
- **LMS Administrator**: Brightspace, Sakai, Liferay CMS, WCAG 2.2, faculty support
- **Web Accessibility Specialist**: WCAG 2.2 auditing, QA testing, error pipelines, AI detectability
- **Full Stack Developer**: Liferay CMS, Node.js/Express, MongoDB, PostgreSQL, REST APIs, Docker
- **Flutter / Mobile Developer**: Flutter, Dart, Firebase FCM, SQLite, Realtor+, LinkNews apps

### 2. Evaluation Phase
Calculates strict Fit Scores (0-100%) based on:
- Keyword matching against job descriptions
- Experience alignment with master resume
- Skills match verification

### 3. Filtering Phase (Routing Rules)
| Fit Score | Action |
|-----------|--------|
| 85-100%   | **AUTO-APPLY** - Generate tailored resume immediately |
| 70-84%    | **FLAGGED FOR MANUAL REVIEW** - Wait for your approval |
| <70%      | **AUTO-REJECTED** - Discard, move on |

### 4. Generation Phase
Creates 1-page ATS-compliant Markdown resumes with:
- **Marist University**: Exactly 4-5 verbatim bullets
- **Forge Alumnus**: Exactly 3 verbatim bullets
- **Projects**: 2 most relevant (2 bullets each)
- **Leadership**: Maximum 2 bullets (if space permits)
- **100% verbatim preservation** - No rewriting or hallucination

## Configuration

Edit `job-search-config.json` to customize:
- Search parameters (location, sites, time range)
- Fit score thresholds
- Track keywords and priorities
- Resume constraints

## Files

| File | Description |
|------|-------------|
| `job-search-workflow.js` | Main workflow script |
| `simple-job-workflow.js` | Simple test workflow |
| `job-search-config.json` | Configuration parameters |
| `run-job-search.sh` | Helper script with documentation |

## Example Output

For an AUTO-APPLY candidate, you'll get a structured response:
```
Target Role & Company: Instructional Design Generalist - Culinary Institute of America
Fit Score: 90% - User has extensive Brightspace and WCAG 2.2 experience...
Execution Decision: [AUTO-APPLY INITIATED]
Document: [Full tailored 1-page Markdown resume]
```

## Requirements

- Claude Code with Workflow tool access
- Apify account with access to `openclawai/job-board-scraper` actor
- Node.js environment for running workflow scripts

## Running Periodically

Use the `loop` skill to run on a schedule:
```
/loop 1h /job-search-workflow.js
```