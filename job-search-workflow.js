export const meta = {
  name: 'job-search-automation',
  description: 'Automated job search and application system - scans job boards, evaluates fit scores, and generates tailored resumes',
  phases: [
    { title: 'Discover', detail: 'Search job boards for relevant positions' },
    { title: 'Evaluate', detail: 'Calculate fit scores against master resume data' },
    { title: 'Filter', detail: 'Apply routing rules based on fit score thresholds' },
    { title: 'Generate', detail: 'Create tailored resumes for auto-apply candidates' }
  ],
};

async function runJobSearch() {
  log('Starting automated job search workflow');

  // Phase 1: Discover - Search job boards
  phase('Discover');
  const lmsJobs = await agent('Search LinkedIn and Indeed for LMS Administrator, Brightspace, Liferay CMS, WCAG 2.2 jobs in New York. Use Apify openclawai/job-board-scraper actor with searchTerms as an array, location="New York, USA", sites=["linkedin","indeed"], maxResults=25, isRemote=true, hoursOld=168 (last week), linkedinFetchDescription=true, descriptionFormat="markdown", enforceAnnualSalary=true. Return the full job list.', { label: 'LMS-Search', phase: 'Discover' });
  const accessibilityJobs = await agent('Search LinkedIn and Indeed for Web Accessibility Specialist, WCAG auditor, QA testing jobs in New York. Same Apify actor parameters. Return full job list.', { label: 'Accessibility-Search', phase: 'Discover' });
  const fullstackJobs = await agent('Search LinkedIn and Indeed for Full Stack Developer, Liferay CMS, Node.js, MongoDB PostgreSQL jobs in New York. Same Apify actor parameters. Return full job list.', { label: 'FullStack-Search', phase: 'Discover' });
  const flutterJobs = await agent('Search LinkedIn and Indeed for Flutter Developer, Mobile App Developer, Dart, Firebase jobs in New York. Same Apify actor parameters. Return full job list.', { label: 'Flutter-Search', phase: 'Discover' });

  const allJobs = [lmsJobs, accessibilityJobs, fullstackJobs, flutterJobs].flat().filter(Boolean);
  log(`Found ${allJobs.length} total job listings`);

  // Phase 2: Evaluate - Calculate fit scores
  phase('Evaluate');
  const evaluatedJobs = [];
  for (const job of allJobs) {
    const result = await agent(`Evaluate job fit: ${job.title} at ${job.company}. Use master resume data: Brightspace (5,000+ courses audited), WCAG 2.2, Liferay CMS (150+ pages), Jira (100+ tickets), Sakai migration, Power Apps/Automate, Team Dynamix, faculty support. Return JSON with: title, company, fitScore (0-100), bestCategory, reasoning, decision (AUTO-APPLY if >=85%, FLAGGED if 70-84%, AUTO-REJECTED if <70%).`, { label: `evaluate:${job.title}`, phase: 'Evaluate' });
    if (result) evaluatedJobs.push(result);
  }

  const autoApply = evaluatedJobs.filter(j => j.decision === 'AUTO-APPLY');
  const manualReview = evaluatedJobs.filter(j => j.decision === 'FLAGGED');
  const autoRejected = evaluatedJobs.filter(j => j.decision === 'AUTO-REJECTED');

  log(`${autoApply.length} auto-apply, ${manualReview.length} manual review, ${autoRejected.length} auto-rejected`);

  // Phase 3: Generate - Create tailored resumes
  phase('Generate');
  const resumes = [];
  for (const job of autoApply) {
    const result = await agent(`Generate a 1-page ATS-compliant Markdown resume for Vishnu Kaushik Varma Vuddaraju targeting: ${job.title} at ${job.company}. Use ONLY verbatim bullets from master resume. Select 4-5 bullets for Marist, 3 for Forge, 2 most relevant projects (2 bullets each), max 2 leadership bullets. Preserve all words exactly.`, { label: `resume:${job.title}`, phase: 'Generate' });
    if (result) resumes.push(result);
  }

  log(`Generated ${resumes.length} tailored resumes`);

  return {
    autoApply,
    manualReview,
    autoRejected,
    resumes,
    summary: {
      total: evaluatedJobs.length,
      autoApply: autoApply.length,
      manualReview: manualReview.length,
      autoRejected: autoRejected.length,
      resumesGenerated: resumes.length
    }
  };
}

runJobSearch();