#!/bin/bash
# ============================================================================
# Job Search and Application Automation Script
# ============================================================================
# This script runs the automated job search workflow that:
# 1. Searches job boards (LinkedIn, Indeed) using Apify actors
# 2. Evaluates fit scores against master resume data
# 3. Applies routing rules (85%/70% thresholds)
# 4. Generates tailored 1-page resumes for auto-apply candidates
#
# Usage: ./run-job-search.sh
# ============================================================================

set -e

echo "=========================================="
echo "  Job Search Automation Workflow"
echo "=========================================="
echo ""

# Check if the workflow file exists
WORKFLOW_FILE="job-search-workflow.js"
if [ ! -f "$WORKFLOW_FILE" ]; then
  echo "ERROR: Workflow file not found: $WORKFLOW_FILE"
  exit 1
fi

echo "Starting workflow..."
echo "Workflow file: $WORKFLOW_FILE"
echo ""

# Run the workflow using the Workflow tool
# Note: This requires the Workflow tool to be available in the environment
echo "Run this in Claude Code with the Workflow tool:"
echo "  Workflow({scriptPath: '$WORKFLOW_FILE'})"
echo ""
echo "Or run the simple test first:"
echo "  Workflow({scriptPath: 'simple-job-workflow.js'})"
echo ""

# Display the current date
echo "Date: $(date)"
echo ""

# Output summary of what the workflow does
echo "=========================================="
echo "  Workflow Phases:"
echo "=========================================="
echo "1. Discover - Search job boards for relevant positions"
echo "2. Evaluate - Calculate fit scores against master resume"
echo "3. Filter   - Apply 85%/70% routing rules"
echo "4. Generate - Create tailored resumes for auto-apply"
echo ""
echo "Target roles:"
echo "  - LMS Administrator (Brightspace, Sakai, Liferay CMS, WCAG 2.2)"
echo "  - Web Accessibility Specialist (QA/A11y, WCAG 2.2 auditing)"
echo "  - Full Stack Developer (Liferay CMS, Node.js/Express, MongoDB)"
echo "  - Flutter / Mobile Developer (Flutter, Dart, Firebase FCM, SQLite)"
echo ""
echo "Fit Score Thresholds:"
echo "  - 85-100%: AUTO-APPLY (generate tailored resume)"
echo "  - 70-84%:  FLAGGED FOR MANUAL REVIEW (wait for approval)"
echo "  - <70%:    AUTO-REJECTED (discard, move on)"
echo ""
echo "=========================================="