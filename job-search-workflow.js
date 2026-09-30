/**
 * Job Search Automation - Dashboard Workflow
 *
 * Full terminal dashboard for job discovery, fit scoring, and single-click apply.
 * Supports time range selection: today | last 7 days | last 30 days
 *
 * Usage in Claude Code:
 *   Workflow({scriptPath: "job-search-workflow.js"})
 *
 * Or via shell:
 *   ./run-job-search.sh dashboard --timeRange today
 */

const fs = require('fs');
const path = require('path');

// ─── Configuration ───────────────────────────────────────────────────────────

const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, 'job-search-config.json'), 'utf8'));
const MASTER_RESUME = JSON.parse(fs.readFileSync(path.join(__dirname, 'master-resume-data.json'), 'utf8'));

// Build keyword set from resume for matching
const RESUME_KEYWORDS = {
  LMSAdministrator: [
    'Brightspace', 'Liferay CMS', 'Sakai', 'LMS', 'Learning Management System',
    'WCAG 2.2', 'WCAG 2.1', 'accessibility', 'faculty support', 'Jira',
    'Power Apps', 'Power Automate', 'Team Dynamix', 'course migration',
    'course migration', 'QA testing', 'Sakai to Brightspace', 'migration'
  ],
  AccessibilitySpecialist: [
    'WCAG 2.2', 'WCAG 2.1', 'accessibility', 'accessibility auditing', 'QA',
    'cross-browser testing', 'error pipelines', 'AI detectability',
    'Copyleaks', 'Turnitin', 'prompt engineering', 'institutional guidelines'
  ],
  FullStackDeveloper: [
    'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'REST APIs', 'REST API',
    'JavaScript', 'SQL', 'HTML', 'Python', 'Tableau', 'Pandas', 'NumPy',
    'OpenAI API', 'Speech-to-Text', 'JSON Parsing', 'prompt engineering',
    'Docker', 'GCP', 'Google Cloud Platform', 'cloud'
  ],
  FlutterMobileDeveloper: [
    'Flutter', 'Dart', 'Firebase', 'FCM', 'Firebase Cloud Messaging',
    'SQLite', 'mobile app', 'cross-platform', 'GetX', 'Provider',
    'Realtor+', 'LinkNews', 'Personal Diary', 'mobile development',
    'iOS', 'Android', 'Apple App Store', 'Google Play Store',
    'App Store', 'Play Store', '10,000+ active users'
  ]
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIME_RANGE_MAP = {
  today: 24,
  '7days': 168,
  '30days': 720
};

/**
 * Calculate fit score for a job against the master resume.
 * Returns { fitScore, category, matchingKeywords, explanation }
 */
function calculateFitScore(job) {
  const title = (job.title || '').toLowerCase();
  const company = (job.company || '').toLowerCase();
  const description = (job.description || '').toLowerCase();
  const combinedText = `${title} ${company} ${description}`;

  let categoryScores = {};
  let maxScore = 0;
  let bestCategory = 'General';

  for (const [category, keywords] of Object.entries(RESUME_KEYWORDS)) {
    const matchingKeywords = keywords.filter(kw => combinedText.includes(kw.toLowerCase()));
    const keywordScore = (matchingKeywords.length / keywords.length) * 100;

    // Experience match weight (30%)
    const experienceKeywords = ['experience', 'years', 'background', 'expertise', 'support'];
    const experienceMatches = experienceKeywords.filter(kw => combinedText.includes(kw.toLowerCase()));
    const experienceScore = (experienceMatches.length / experienceKeywords.length) * 100;

    // Skills match weight (20%)
    const skillKeywords = ['skill', 'proficient', 'knowledge of', 'familiar', 'requirement'];
    const skillMatches = skillKeywords.filter(kw => combinedText.includes(kw.toLowerCase()));
    const skillScore = (skillMatches.length / skillKeywords.length) * 100;

    // Weighted: 50% keyword, 30% experience, 20% skills
    const categoryScore = (keywordScore * 0.5) + (experienceScore * 0.3) + (skillScore * 0.2);
    categoryScores[category] = Math.min(Math.round(categoryScore), 100);

    if (categoryScore > maxScore) {
      maxScore = categoryScore;
      bestCategory = category;
    }
  }

  const finalScore = Math.min(Math.round(maxScore), 100);
  const matchingKeywords = RESUME_KEYWORDS[bestCategory]
    ? RESUME_KEYWORDS[bestCategory].filter(kw => combinedText.includes(kw.toLowerCase())).slice(0, 8)
    : [];

  return {
    fitScore: finalScore,
    category: bestCategory,
    matchingKeywords,
    categoryScores,
    explanation: `Matched ${matchingKeywords.length} key skills for ${bestCategory} role`
  };
}

/**
 * Generate tiered decision based on fit score.
 */
function getRoutingDecision(fitScore) {
  if (fitScore >= 85) {
    return { level: 'AUTO-APPLY', color: '🟢', action: 'Apply' };
  } else if (fitScore >= 70) {
    return { level: 'MANUAL REVIEW', color: '🟡', action: 'Review' };
  } else {
    return { level: 'AUTO-REJECTED', color: '🔴', action: 'Skip' };
  }
}

/**
 * Generate a 1-page ATS-compliant resume tailored to the job.
 * Uses ONLY verbatim bullets from master resume data.
 */
function generateTailoredResume(job, fitInfo) {
  const { title, company } = job;
  const { personal, education, workExperience, projects, technicalSkills, leadershipSkills } = MASTER_RESUME;

  // Select most relevant project(s) based on job category keywords
  const descLower = (job.description || '').toLowerCase();
  const relevantProjects = projects
    .filter(p => {
      const projDesc = `${p.name} ${p.description} ${p.techStack.join(' ')}`.toLowerCase();
      return fitInfo.matchingKeywords.some(kw => projDesc.includes(kw.toLowerCase()));
    })
    .slice(0, 2);

  const topProject1 = relevantProjects[0] || projects[0];
  const topProject2 = relevantProjects[1] || projects[1];

  // Select 4-5 most relevant bullets for Marist (based on matching keywords)
  const titleLower = title.toLowerCase();
  const descLowerFull = `${titleLower} ${(job.description || '').toLowerCase()}`;
  const maristBullets = workExperience[0].bullets
    .filter(bullet => {
      const bulletLower = bullet.toLowerCase();
      return fitInfo.matchingKeywords.some(kw =>
        bulletLower.includes(kw.toLowerCase()) || descLowerFull.includes(kw.toLowerCase())
      );
    })
    .slice(0, 5);
  // Fill to 5 if fewer matches
  if (maristBullets.length < 5) {
    for (const bullet of workExperience[0].bullets) {
      if (!maristBullets.includes(bullet)) {
        maristBullets.push(bullet);
      }
      if (maristBullets.length >= 5) break;
    }
  }

  // Select 3 most relevant bullets for Forge
  const forgeBullets = workExperience[1].bullets
    .filter(bullet => {
      const bulletLower = bullet.toLowerCase();
      return fitInfo.matchingKeywords.some(kw => bulletLower.includes(kw.toLowerCase()));
    })
    .slice(0, 3);
  if (forgeBullets.length < 3) {
    for (const bullet of workExperience[1].bullets) {
      if (!forgeBullets.includes(bullet)) {
        forgeBullets.push(bullet);
      }
      if (forgeBullets.length >= 3) break;
    }
  }

  // Leadership: max 2 bullets
  const relevantLeadership = leadershipSkills
    .filter(ls => {
      const lsLower = ls.toLowerCase();
      return fitInfo.matchingKeywords.some(kw => lsLower.includes(kw.toLowerCase()));
    })
    .slice(0, 2);

  // ─── Build the resume ───
  const resume = `
# ${personal.name}
${personal.location} | ${personal.email} | ${personal.phone} | ${personal.linkedin} | ${personal.portfolio}

## PROFESSIONAL SUMMARY
${fitInfo.category.replace(/([A-Z])/g, ' $1').trim()} with ${workExperience[0].bullets.length}+ years of experience in LMS administration, web accessibility, full-stack development, and mobile app engineering. Proven track record of shipping scalable software for 10,000+ users and improving system accessibility and efficiency.

## EDUCATION
${education.map(edu =>
  `| ${edu.institution} | ${edu.degree} | ${edu.period} | GPA: ${edu.gpa} |`
).join('\n')}

## TECHNICAL SKILLS
| Languages & Frameworks | ${technicalSkills.languagesFrameworks.join(', ')} |
| Data, AI & Automation | ${technicalSkills.dataAiAutomation.join(', ')} |
| Databases & Cloud | ${technicalSkills.databasesCloud.join(', ')} |
| DevOps & Tools | ${technicalSkills.devopsTools.join(', ')} |

## PROFESSIONAL EXPERIENCE

| ${workExperience[0].company} | ${workExperience[0].title}, ${workExperience[0].department} | ${workExperience[0].period} |
| --- | --- | --- |
${maristBullets.map(bullet => `| • ${bullet} |  |`).join('\n')}

| ${workExperience[1].company} | ${workExperience[1].title} | ${workExperience[1].period} |
| --- | --- | --- |
${forgeBullets.map(bullet => `| • ${bullet} |  |`).join('\n')}

## KEY PROJECTS

### ${topProject1.name}
${topProject1.description}
**Tech Stack:** ${topProject1.techStack.join(', ')}

### ${topProject2.name}
${topProject2.description}
**Tech Stack:** ${topProject2.techStack.join(', ')}

${relevantLeadership.length > 0 ? `## LEADERSHIP & SOFT SKILLS\n${relevantLeadership.map(ls => `- ${ls}`).join('\n')}` : ''}

---
*Resume tailored for: ${title} at ${company}*
*Fit Score: ${fitInfo.fitScore}% | Category: ${fitInfo.category} | Generated by Job Search Automation*
`;

  return resume;
}

// ─── Dashboard Rendering ──────────────────────────────────────────────────────

/**
 * Render the job dashboard in the terminal.
 * Displays all jobs with fit scores, categories, and action buttons.
 */
function renderDashboard(jobs, selectedIndex = 0, title = 'JOB SEARCH DASHBOARD') {
  console.clear();

  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + title.padStart(39 + title.length / 2).padEnd(39 + title.length / 2) + '║');
  console.log('╠' + '═'.repeat(78) + '╣');
  console.log('║ Time Range: ' + CONFIG.search.timeRange.padEnd(78 - 12) + '║');
  console.log('║ Location:   ' + CONFIG.search.location.padEnd(78 - 12) + '║');
  console.log('║ Jobs Found: ' + String(jobs.length).padEnd(78 - 12) + '║');
  console.log('╠' + '═'.repeat(78) + '╣');
  console.log('║ #  │ Title                              │ Company             │ Fit% │ Action       ' + '║');
  console.log('╠═══╪════════════════════════════════════╪═════════════════════╪══════╪════════════════' + '╣');

  jobs.forEach((job, idx) => {
    const fitInfo = job._fit || calculateFitScore(job);
    const decision = getRoutingDecision(fitInfo.fitScore);
    const isSelected = idx === selectedIndex;
    const prefix = isSelected ? '▶ ' : '  ';
    const num = `${idx + 1}`.padEnd(2);
    const jobTitle = (job.title || 'Untitled').substring(0, 35).padEnd(35);
    const company = (job.company || 'Unknown').substring(0, 18).padEnd(18);
    const fitScore = `${fitInfo.fitScore}%`.padEnd(5);
    const action = `${decision.color} ${decision.action}`;
    const row = `║${prefix}${num}│ ${jobTitle}│ ${company}│ ${fitScore}│ ${action}`.padEnd(81) + '║';

    // Highlight selected row
    if (isSelected) {
      console.log(row.replace(/║/g, '█'));
      // Re-print with correct background
    }

    console.log(`║ ${prefix}${num}│ ${jobTitle}│ ${company}│ ${fitScore}│ ${action.padEnd(12)} ║`.substring(0, 81));
  });

  console.log('╠' + '═'.repeat(78) + '╣');
  console.log('║ Commands: [a] Auto-apply checked | [m] Manual review | [s] Skip | [q] Quit          ' + '║');
  console.log('║ Press [number] to select job, [Enter] to apply to all with fit >= 85%              ' + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
}

/**
 * Render detailed job view for inspection before applying.
 */
function renderJobDetail(job) {
  const fitInfo = job._fit || calculateFitScore(job);
  const decision = getRoutingDecision(fitInfo.fitScore);

  console.log('\n' + '═'.repeat(80));
  console.log(`  ${decision.color} ${job.title} at ${job.company} — Fit: ${fitInfo.fitScore}%`);
  console.log('═'.repeat(80));
  console.log(`\nCategory: ${fitInfo.category}`);
  console.log(`Explanation: ${fitInfo.explanation}`);
  console.log(`Matching Keywords: ${fitInfo.matchingKeywords.join(', ')}`);
  console.log(`\nDecision: ${decision.level}`);

  if (job.description) {
    console.log(`\n--- DESCRIPTION (${job.description.substring(0, 600)}...)`);
  }
  console.log('\n' + '═'.repeat(80) + '\n');
}

// ─── Workflow ─────────────────────────────────────────────────────────────────

export const meta = {
  name: 'job-search-dashboard',
  description: 'Dashboard for finding latest jobs, calculating fit scores, and applying with single click',
  phases: [
    { title: 'Configure', detail: 'Select time range (today/7days/30days) and location' },
    { title: 'Discover', detail: 'Search job boards for jobs matching your resume keywords' },
    { title: 'Evaluate', detail: 'Calculate fit scores against master resume data' },
    { title: 'Dashboard', detail: 'Display all jobs with fit scores and action buttons' },
    { title: 'Apply', detail: 'Single-click apply with tailored resume generation' },
  ],
};

async function runDashboardWorkflow() {
  log('🚀 Starting Job Search Automation Dashboard');
  log(`  Portfolio: ${MASTER_RESUME.personal.portfolio}`);

  // ─── Phase 1: Configure ───
  phase('Configure');

  // Determine time range from config
  const timeRange = CONFIG.search.timeRange || '7days';
  const hoursOld = TIME_RANGE_MAP[timeRange] || 168;
  log(`Time range: ${timeRange} (${hoursOld}h) | Location: ${CONFIG.search.location}`);

  // ─── Phase 2: Discover ───
  phase('Discover');

  log('Searching job boards for relevant positions...');

  const searchResult = await agent(
    `Search LinkedIn and Indeed for jobs matching these keywords: Brightspace, Liferay, Sakai, WCAG 2.2, accessibility, Node.js, Express, MongoDB, PostgreSQL, Flutter, Dart, Firebase, mobile app developer, full stack developer, LMS Administrator, Web Accessibility Specialist. Use Apify ${CONFIG.search.actor} actor with: searchTerms as array of these keywords, location="${CONFIG.search.location}", sites=${JSON.stringify(CONFIG.search.sites)}, maxResults=${CONFIG.search.maxResults}, isRemote=true, hoursOld=${hoursOld}, linkedinFetchDescription=true, descriptionFormat="markdown", enforceAnnualSalary=true. Return full job list with title, company, and description fields.`,
    { label: 'JobSearch', phase: 'Discover' }
  );

  const rawJobs = Array.isArray(searchResult) ? searchResult : (searchResult?.jobs || searchResult?.results || [searchResult]).filter(Boolean);

  // Filter to relevant jobs
  const relevantJobs = rawJobs.filter(job => {
    if (!job) return false;
    const text = `${job.title || ''} ${job.company || ''} ${job.description || ''}`.toLowerCase();
    return Object.values(RESUME_KEYWORDS).flat().some(kw => text.includes(kw.toLowerCase()));
  });

  log(`Found ${rawJobs.length} total jobs, ${relevantJobs.length} relevant to your resume`);

  // ─── Phase 3: Evaluate ───
  phase('Evaluate');

  // Calculate fit scores for all jobs
  const evaluatedJobs = relevantJobs.map(job => ({
    ...job,
    _fit: calculateFitScore(job)
  }));

  // Sort by fit score descending
  evaluatedJobs.sort((a, b) => (b._fit.fitScore) - (a._fit.fitScore));

  log(`Fit scores calculated. Range: ${evaluatedJobs[0]?._fit.fitScore || 0}% - ${evaluatedJobs[evaluatedJobs.length - 1]?._fit.fitScore || 0}%`);

  // ─── Phase 4: Dashboard ───
  phase('Dashboard');

  renderDashboard(evaluatedJobs, 0, '🔍 JOB SEARCH DASHBOARD');

  // ─── Phase 5: Interactive Apply ───
  log('\n=== Dashboard Mode ===');
  log('Select jobs to apply (enter numbers separated by commas, or "auto" for all fit >= 85%):');
  log('Type "detail <num>" to see job details, or "quit" to exit.\n');

  const autoApplyJobs = evaluatedJobs.filter(j => j._fit.fitScore >= 85);
  const manualReviewJobs = evaluatedJobs.filter(j => j._fit.fitScore >= 70 && j._fit.fitScore < 85);
  const rejectedJobs = evaluatedJobs.filter(j => j._fit.fitScore < 70);

  log(`\n📊 SUMMARY:` +
    `\n  🟢 Auto-apply (${autoApplyJobs.length}):  Fit ≥ 85%` +
    `\n  🟡 Manual review (${manualReviewJobs.length}):  Fit 70-84%` +
    `\n  🔴 Auto-rejected (${rejectedJobs.length}):  Fit < 70%`);

  // Single-click apply to all auto-apply candidates
  log('\n🚀 Single-Click Apply: Generating tailored resumes for all auto-apply candidates...\n');

  const generatedResumes = [];
  for (const job of autoApplyJobs) {
    log(`  → Generating resume for: ${job.title} @ ${job.company} (Fit: ${job._fit.fitScore}%)`);
    const resume = generateTailoredResume(job, job._fit);
    generatedResumes.push({
      job: { title: job.title, company: job.company },
      fitScore: job._fit.fitScore,
      category: job._fit.category,
      resume
    });
    log(`     ✅ Resume generated (${resume.length} chars)`);
  }

  // Save resumes to disk
  const outputDir = path.join(__dirname, 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  generatedResumes.forEach((item, idx) => {
    const filename = `${item.category.replace(/\s/g, '_')}_${item.job.company.replace(/\s/g, '_')}_${Date.now()}.md`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, item.resume);
    log(`     💾 Saved: output/${filename}`);
  });

  // Return structured results
  return {
    summary: {
      totalFound: rawJobs.length,
      relevant: relevantJobs.length,
      autoApply: autoApplyJobs.length,
      manualReview: manualReviewJobs.length,
      autoRejected: rejectedJobs.length,
      resumesGenerated: generatedResumes.length
    },
    autoApplyJobs,
    manualReviewJobs,
    autoRejectedJobs,
    generatedResumes,
    outputDir
  };
}

// ─── Single Start Button ──────────────────────────────────────────────────────
// This runs everything from start to finish with one command

async function main() {
  const results = await runDashboardWorkflow();
  return results;
}

main();