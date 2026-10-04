// Usage: node scripts/measure-flow.mjs <before|after> [--n=10000] [--out=lighthouse]
// One Lighthouse Timespan over: type "dien thoai" (50 ms/key) -> wait applied -> click #sort-price -> wait applied.
// Writes <out>/<page>/{flow.report.html,flow.json,flow-summary.json}. Exit 1 on any failure.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { startFlow } from 'lighthouse';
import { closeBrowser, chromeVersionFromUA, launchBrowser, MOBILE_VIEWPORT } from './lib/browser.mjs';
import { DEFAULT_N, DIST_DIR, SEARCH_TEXT, intFlag, pageArg, pageDir, parseArgs, preflight, relFromRoot, runMain, stringFlag } from './lib/env.mjs';
import { identityOf } from './lib/identity.mjs';
import { waitApplied, waitInitial } from './lib/waits.mjs';

const USAGE = 'node scripts/measure-flow.mjs <before|after> [--n=10000] [--out=lighthouse]';
const WAIT_MS = 180_000;
const NOTE = 'Timespan TBT sums the blocking time of the whole interaction trace under 4x CPU throttling; it is not comparable with navigation TBT or the navigation score.';

const auditValue = (lhr, id) => {
  const audit = lhr.audits[id];
  return { value: audit?.numericValue ?? null, score: audit?.score ?? null, scoreDisplayMode: audit?.scoreDisplayMode ?? null, displayValue: audit?.displayValue ?? null };
};

runMain(async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const page = pageArg(positional, USAGE);
  const n = intFlag(flags, 'n', DEFAULT_N, { min: 1 });
  const out = stringFlag(flags, 'out', undefined);

  const { url } = await preflight(page, n, 'production');
  const identity = identityOf(page, DIST_DIR);
  const dir = pageDir(out, page);
  mkdirSync(dir, { recursive: true });
  for (const f of ['flow.report.html', 'flow.json', 'flow-summary.json']) rmSync(path.join(dir, f), { force: true });

  let browser;
  let flowResult;
  let reportHtml;
  let initial;
  try {
    browser = await launchBrowser();
    const tab = await browser.newPage();
    await tab.setViewport(MOBILE_VIEWPORT);
    await tab.goto(url, { waitUntil: 'networkidle0', timeout: WAIT_MS });
    initial = await waitInitial(tab, { timeout: WAIT_MS });
    if (initial.page !== page || initial.buildMode !== 'production') {
      throw new Error(`Loaded page identifies as page="${initial.page}" mode="${initial.buildMode}", expected "${page}"/"production".`);
    }

    const flow = await startFlow(tab, { name: `${page} search + sort`, flags: { formFactor: 'mobile', throttlingMethod: 'devtools' } });
    await flow.startTimespan({ name: 'search + sort' });
    await tab.type('#search', SEARCH_TEXT, { delay: 50 });
    await waitApplied(tab, { query: SEARCH_TEXT, timeout: WAIT_MS });
    await tab.click('#sort-price');
    await waitApplied(tab, { query: SEARCH_TEXT, sort: 'price-asc', timeout: WAIT_MS });
    await flow.endTimespan();

    flowResult = await flow.createFlowResult();
    reportHtml = await flow.generateReport();
  } finally {
    await closeBrowser(browser);
  }

  const after = identityOf(page, DIST_DIR);
  const identityChanged = after.sourceHash !== identity.sourceHash || after.buildHash !== identity.buildHash;

  const lhr = flowResult.steps[0].lhr;
  const runtimeError = lhr.runtimeError && lhr.runtimeError.code !== 'NO_ERROR' ? { code: lhr.runtimeError.code, message: lhr.runtimeError.message } : null;
  const TBT = auditValue(lhr, 'total-blocking-time');
  const CLS = auditValue(lhr, 'cumulative-layout-shift');
  const INP = auditValue(lhr, 'interaction-to-next-paint');
  const problems = [];
  if (runtimeError) problems.push(`Lighthouse runtimeError ${runtimeError.code}: ${runtimeError.message}`);
  if (!Number.isFinite(TBT.value)) problems.push('TBT is not a number');
  if (!Number.isFinite(CLS.value)) problems.push('CLS is not a number');
  if (identityChanged) problems.push('Source or build changed while measuring (IDENTITY_CHANGED)');

  const summary = {
    page,
    n,
    url,
    status: problems.length ? 'failed' : 'ok',
    problems,
    runtimeError,
    stepName: flowResult.steps[0].name,
    gatherMode: lhr.gatherMode ?? null,
    interactions: [`type "${SEARCH_TEXT}" (50 ms/key)`, '#sort-price click (price-asc)'],
    TBT,
    CLS,
    INP,
    note: NOTE,
    checksum: initial.checksum,
    dataN: initial.n,
    lighthouseVersion: lhr.lighthouseVersion,
    chromeVersion: chromeVersionFromUA(lhr.environment?.hostUserAgent),
    nodeVersion: process.version,
    benchmarkIndex: lhr.environment?.benchmarkIndex ?? null,
    throttling: lhr.configSettings?.throttling ?? null,
    throttlingMethod: lhr.configSettings?.throttlingMethod ?? null,
    formFactor: lhr.configSettings?.formFactor ?? null,
    fetchTime: lhr.fetchTime,
    sourceHash: identity.sourceHash,
    buildHash: identity.buildHash,
  };

  writeFileSync(path.join(dir, 'flow.report.html'), reportHtml);
  writeFileSync(path.join(dir, 'flow.json'), JSON.stringify(flowResult));
  writeFileSync(path.join(dir, 'flow-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

  console.log(
    `[flow] ${page} n=${n}: ${summary.status} TBT=${TBT.value === null ? 'n/a' : Math.round(TBT.value)} ms CLS=${CLS.value === null ? 'n/a' : CLS.value.toFixed(3)} INP=${INP.value === null ? 'n/a' : Math.round(INP.value)} ms (${INP.scoreDisplayMode}) -> ${relFromRoot(path.join(dir, 'flow-summary.json'))}`,
  );
  console.log(`[flow] note: ${NOTE}`);
  if (problems.length) {
    for (const p of problems) console.error(`[flow] FAIL ${p}`);
    return 1;
  }
  return 0;
});
