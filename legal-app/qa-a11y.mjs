import { chromium, devices } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE = process.env.LEXIFRANCE_BASE_URL || 'http://127.0.0.1:4173/legal-app/';
const routes = ['home', 'learn', 'solve', 'search', 'profile'];
const acceptedKnownIssues = new Set(['meta-viewport']);

function summarize(violations) {
  return violations.map(v => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    nodes: v.nodes.length,
    targets: v.nodes.slice(0, 4).map(n => n.target)
  }));
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ...devices['iPhone 15'] });
const page = await context.newPage();
const failures = [];
const known = [];

try {
  for (const route of routes) {
    await page.goto(`${BASE}#${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root');
    await page.waitForTimeout(650);

    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    for (const violation of result.violations) {
      const row = { route, ...summarize([violation])[0] };
      if (acceptedKnownIssues.has(violation.id)) known.push(row);
      else if (violation.impact === 'critical' || violation.impact === 'serious') failures.push(row);
    }
  }
} finally {
  await context.close();
  await browser.close();
}

if (known.length) {
  console.log('A11Y KNOWN EXCEPTIONS');
  console.log(JSON.stringify(known, null, 2));
}

if (failures.length) {
  console.error('A11Y SERIOUS/CRITICAL FAILURES');
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}

console.log(`A11Y OK routes=${routes.length} knownExceptions=${known.length}`);
