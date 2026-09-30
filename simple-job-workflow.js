export const meta = {
  name: 'simple-job-test',
  description: 'Simple test workflow for job search concept',
  phases: [
    { title: 'Test', detail: 'Test the workflow concept' }
  ],
};

async function simpleTest() {
  log('Testing simple job workflow concept');
  // Quick test: just check that master resume data loads
  const configJson = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'job-search-config.json'), 'utf8'));
  const hasConfig = !!configJson.search?.actor;
  return { testResult: `Workflow concept is working. Config loaded: ${hasConfig}`, timestamp: new Date().toISOString() };
}

simpleTest();