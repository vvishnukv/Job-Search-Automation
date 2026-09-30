export const meta = {
  name: 'practical-job-search',
  description: 'Practical job search workflow using Apify actors to find jobs and evaluate fit',
  phases: [
    { title: 'SearchJobs', detail: 'Search multiple job boards using Apify actors' },
    { title: 'FilterRelevant', detail: 'Filter jobs for LMS, Accessibility, Full Stack, and Flutter roles' },
    { title: 'CalculateFit', detail: 'Calculate fit scores against master resume data' },
    { title: 'ApplyRoutingRules', detail: 'Apply 85%/70%/<70% thresholds for auto-apply/manual review/auto-reject' },
    { title: 'GenerateResumes', detail: 'Create tailored 1-page resumes for auto-apply candidates' }
  ],
};

// Master resume keywords for matching
const MASTER_RESUME_KEYWORDS = {
  LMSAdministrator: [
    'Brightspace', 'Liferay CMS', 'Sakai', 'LMS', 'Learning Management System',
    'WCAG 2.2', 'WCAG 2.1', 'accessibility', 'faculty support', 'Jira',
    'Power Apps', 'Power Automate', 'Team Dynamix', 'course migration',
    'LMS QA testing', 'Brightspace courses', 'LMS administration'
  ],
  AccessibilitySpecialist: [
    'WCAG 2.2', 'WCAG 2.1', 'accessibility auditing', 'QA', 'testing',
    'error pipelines', 'AI detectability', 'Jira', 'Power Apps',
    'Power Automate', 'LMS accessibility', 'course accessibility'
  ],
  FullStackDeveloper: [
    'Liferay CMS', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL',
    'REST APIs', 'Docker', 'JavaScript', 'SQL', 'HTML', 'Flutter', 'Dart',
    'web development', 'full stack', 'backend', 'frontend'
  ],
  FlutterMobileDeveloper: [
    'Flutter', 'Dart', 'Firebase', 'FCM', 'SQLite', 'mobile app',
    'cross-platform', 'Realtor+', 'LinkNews', 'Personal Diary',
    'mobile development', 'iOS', 'Android', 'app development'
  ]
};

async function searchJobBoards() {
  log('Searching job boards using Apify actors...');

  // Search for different job categories using the multi-job board scraper
  const searchPromises = [
    // LMS Administrator roles
    agent('Search for LMS Administrator, Brightspace, Liferay CMS, WCAG 2.2 jobs in New York', {
      actor: 'openclawai/job-board-scraper',
      input: {
        searchTerms: ['LMS Administrator', 'Brightspace', 'Liferay CMS', 'WCAG 2.2', 'Learning Management System'],
        location: 'New York, USA',
        sites: ['linkedin', 'indeed'],
        maxResults: 25,
        isRemote: true,
        hoursOld: 168, // Last week
        linkedinFetchDescription: true,
        descriptionFormat: 'markdown',
        enforceAnnualSalary: true
      },
      label: 'LMS-Administrator-Search',
      phase: 'SearchJobs'
    }),

    // Accessibility Specialist roles
    agent('Search for Web Accessibility Specialist, WCAG auditing jobs', {
      actor: 'openclawai/job-board-scraper',
      input: {
        searchTerms: ['Web Accessibility Specialist', 'Accessibility QA', 'WCAG 2.2 auditor', 'Accessibility testing'],
        location: 'New York, USA',
        sites: ['linkedin', 'indeed'],
        maxResults: 25,
        isRemote: true,
        hoursOld: 168,
        linkedinFetchDescription: true,
        descriptionFormat: 'markdown',
        enforceAnnualSalary: true
      },
      label: 'Accessibility-Specialist-Search',
      phase: 'SearchJobs'
    }),

    // Full Stack Developer roles
    agent('Search for Full Stack Developer, Liferay CMS, Node.js jobs', {
      actor: 'openclawai/job-board-scraper',
      input: {
        searchTerms: ['Full Stack Developer', 'Liferay CMS Developer', 'Node.js Express', 'MongoDB PostgreSQL'],
        location: 'New York, USA',
        sites: ['linkedin', 'indeed'],
        maxResults: 25,
        isRemote: true,
        hoursOld: 168,
        linkedinFetchDescription: true,
        descriptionFormat: 'markdown',
        enforceAnnualSalary: true
      },
      label: 'FullStack-Developer-Search',
      phase: 'SearchJobs'
    }),

    // Flutter/Mobile Developer roles
    agent('Search for Flutter Developer, Mobile App Developer jobs', {
      actor: 'openclawai/job-board-scraper',
      input: {
        searchTerms: ['Flutter Developer', 'Mobile App Developer', 'Dart Flutter', 'Firebase mobile'],
        location: 'New York, USA',
        sites: ['linkedin', 'indeed'],
        maxResults: 25,
        isRemote: true,
        hoursOld: 168,
        linkedinFetchDescription: true,
        descriptionFormat: 'markdown',
        enforceAnnualSalary: true
      },
      label: 'Flutter-Mobile-Search',
      phase: 'SearchJobs'
    })
  ];

  const results = await Promise.all(searchPromises);
  return results.flat().filter(Boolean);
}

function filterRelevantJobs(jobs) {
  log('Filtering jobs for relevant categories...');

  // Filter jobs that match our target categories
  return jobs.filter(job => {
    const titleLower = (job.title || '').toLowerCase();
    const descLower = (job.description || '').toLowerCase();
    const combinedText = `${titleLower} ${descLower}`;

    // Check if job matches any of our target categories
    return Object.values(MASTER_RESUME_KEYWORDS).some(keywords =>
      keywords.some(keyword => combinedText.includes(keyword.toLowerCase()))
    );
  });
}

function calculateFitScore(job) {
  log(`Calculating fit score for: ${job.title} at ${job.company}`);

  const titleLower = (job.title || '').toLowerCase();
  const descLower = (job.description || '').toLowerCase();
  const combinedText = `${titleLower} ${descLower}`;

  // Determine which category this job belongs to
  let categoryScores = {};
  let maxScore = 0;
  let bestCategory = null;

  for (const [category, keywords] of Object.entries(MASTER_RESUME_KEYWORDS)) {
    const keywordMatches = keywords.filter(keyword =>
      combinedText.includes(keyword.toLowerCase())
    );
    const keywordScore = (keywordMatches.length / keywords.length) * 100;

    // Experience match (simplified)
    const experienceKeywords = ['experience', 'years', 'background', 'expertise'];
    const experienceMatches = experienceKeywords.filter(keyword =>
      combinedText.includes(keyword.toLowerCase())
    );
    const experienceScore = (experienceMatches.length / experienceKeywords.length) * 100;

    // Skills match
    const skillKeywords = ['skill', 'proficient', 'experience with', 'knowledge of'];
    const skillMatches = skillKeywords.filter(keyword =>
      combinedText.includes(keyword.toLowerCase())
    );
    const skillScore = (skillMatches.length / skillKeywords.length) * 100;

    // Weighted average (keywords 50%, experience 30%, skills 20%)
    const categoryScore = (keywordScore * 0.5) + (experienceScore * 0.3) + (skillScore * 0.2);
    categoryScores[category] = categoryScore;

    if (categoryScore > maxScore) {
      maxScore = categoryScore;
      bestCategory = category;
    }
  }

  return {
    ...job,
    fitScore: Math.min(Math.round(maxScore), 100),
    bestCategory: bestCategory,
    categoryScores: categoryScores
  };
}

function applyRoutingRules(jobWithScore) {
  const { fitScore } = jobWithScore;

  if (fitScore >= 85) {
    return {
      ...jobWithScore,
      decision: 'AUTO-APPLY INITIATED',
      reasoning: `Fit score of ${fitScore}% exceeds 85% threshold for auto-apply`
    };
  } else if (fitScore >= 70) {
    return {
      ...jobWithScore,
      decision: 'FLAGGED FOR MANUAL REVIEW',
      reasoning: `Fit score of ${fitScore}% is between 70-84%, requires manual review`
    };
  } else {
    return {
      ...jobWithScore,
      decision: 'AUTO-REJECTED',
      reasoning: `Fit score of ${fitScore}% is below 70% threshold`
    };
  }
}

function generateTailoredResume(job) {
  log(`Generating tailored resume for: ${job.title} at ${job.company}`);

  // This would generate a markdown resume - simplified for now
  const resume = `
# ${MASTER_RESUME_DATA.personal.name}
${MASTER_RESUME_DATA.personal.location} | ${MASTER_RESUME_DATA.personal.email} | ${MASTER_RESUME_DATA.personal.phone} | ${MASTER_RESUME_DATA.personal.portfolio}

## EDUCATION
${MASTER_RESUME_DATA.education.map(edu =>
  `- ${MASTER_RESUME_DATA.personal.name}'s institution} | ${edu.degree} | ${edu.period} | GPA: ${edu.gpa}`
).join('\n')}

## TECHNICAL SKILLS
- Languages & Frameworks: ${MASTER_RESUME_DATA.technicalSkills.languagesFrameworks.join(', ')}
- Data, AI & Automation: ${MASTER_RESUME_DATA.technicalSkills.dataAiAutomation.join(', ')}
- Databases & Cloud: ${MASTER_RESUME_DATA.technicalSkills.databasesCloud.join(', ')}
- DevOps, Tools & Platforms: ${MASTER_RESUME_DATA.technicalSkills.devopsTools.join(', ')}

## WORK EXPERIENCE
**Marist University** | Web Developer & LMS QA Tester, Digital Education | Apr 2025 – Present
${MASTER_RESUME_DATA.workExperience[0].bullets.slice(0, 4).map(bullet => `- ${bullet}`).join('\n')}

**Forge Alumnus** | Application Developer & Team Lead | Sep 2023 – Mar 2024
${MASTER_RESUME_DATA.workExperience[1].bullets.slice(0, 3).map(bullet => `- ${bullet}`).join('\n')}

## PROJECTS
${MASTER_RESUME_DATA.projects.slice(0, 2).map(project =>
  `- **${project.name}**: ${project.description}`
).join('\n')}

## LEADERSHIP & SOFT SKILLS
- Documented Minutes of Meetings for Digital Education projects
- Volunteered at Hudson Valley AI & Cloud Summit
- Co-led Bright Foxes outreach campaign
- Assisted faculty with Brightspace LMS and accessibility support

*Generated for position: ${job.title} at ${job.company}
*Fit Score: ${job.fitScore}%
*Decision: ${job.decision}
`;

  return resume;
}

async function executePracticalJobSearch() {
  log('Starting practical job search workflow...');

  // Phase 1: Search Jobs
  phase('SearchJobs');
  const rawJobs = await searchJobBoards();
  log(`Found ${rawJobs.length} total job listings from search`);

  // Phase 2: Filter Relevant
  phase('FilterRelevant');
  const relevantJobs = filterRelevantJobs(rawJobs);
  log(`Filtered to ${relevantJobs.length} relevant job listings`);

  // Phase 3: Calculate Fit
  phase('CalculateFit');
  const jobsWithScores = await parallel(
    relevantJobs.map(job => () =>
      agent(`Calculate fit score for ${job.title}`, {
        label: `fit:${job.id || Math.random()}`,
        phase: 'CalculateFit',
        agentType: 'general-purpose'
      })
    )
  ).then(results => results.map(job => calculateFitScore(job)).filter(Boolean));

  log(`Calculated fit scores for ${jobsWithScores.length} jobs`);

  // Phase 4: Apply Routing Rules
  phase('ApplyRoutingRules');
  const routedJobs = await parallel(
    jobsWithScores.map(job => () =>
      agent(`Apply routing rules for ${job.title}`, {
        label: `route:${job.id || Math.random()}`,
        phase: 'ApplyRoutingRules',
        agentType: 'general-purpose'
      })
    )
  ).then(results => results.map(job => applyRoutingRules(job)).filter(Boolean));

  // Separate by decision
  const autoApplyJobs = routedJobs.filter(job => job.decision === 'AUTO-APPLY INITIATED');
  const manualReviewJobs = routedJobs.filter(job => job.decision === 'FLAGGED FOR MANUAL REVIEW');
  const autoRejectedJobs = routedJobs.filter(job => job.decision === 'AUTO-REJECTED');

  log(`Routing complete: ${autoApplyJobs.length} auto-apply, ${manualReviewJobs.length} manual review, ${autoRejectedJobs.length} auto-rejected`);

  // Phase 5: Generate Resumes
  phase('GenerateResumes');
  const generatedResumes = await parallel(
    autoApplyJobs.map(job => () =>
      agent(`Generate resume for ${job.title}`, {
        label: `resume:${job.id || Math.random()}`,
        phase: 'GenerateResumes',
        agentType: 'general-purpose'
      })
    )
  ).then(results => results.map((resume, index) =>
    generateTailoredResume(autoApplyJobs[index])
  ).filter(Boolean));

  log(`Generated ${generatedResumes.length} tailored resumes`);

  return {
    autoApplyJobs,
    manualReviewJobs,
    autoRejectedJobs,
    generatedResumes,
    summary: {
      totalFound: rawJobs.length,
      relevantCount: relevantJobs.length,
      scoredCount: jobsWithScores.length,
      autoApplyCount: autoApplyJobs.length,
      manualReviewCount: manualReviewJobs.length,
      autoRejectedCount: autoRejectedJobs.length,
      resumesGenerated: generatedResumes.length
    }
  };
}

// Export main function
export { executePracticalJobSearch as main };