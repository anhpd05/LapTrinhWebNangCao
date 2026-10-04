// Usage: node scripts/measure-navigation.mjs <before|after> [--n=10000] [--runs=5] [--out=lighthouse] [--a11y]
//
//   (no --a11y)            performance runs only -> <out>/<page>/n<n>/{summary.json,median.report.html,run-*.json}
//   --a11y                 accessibility only    -> <out>/<page>/a11y.json  (existing performance results are NOT touched)
//   --a11y --runs=<k>      both: k performance runs (overwrites n<n>/summary.json) and the a11y run
//
// Exit code: 1 for usage/preflight/identity problems; 0 otherwise, even when every run failed
// (the failure is recorded in summary.json so that measure:scale can continue).
import { describeSummary, measureNavigation } from './lib/navigation.mjs';
import { DEFAULT_N, intFlag, pageArg, parseArgs, relFromRoot, runMain, stringFlag, UsageError } from './lib/env.mjs';

const USAGE = 'node scripts/measure-navigation.mjs <before|after> [--n=10000] [--runs=5] [--out=lighthouse] [--a11y]';

runMain(async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const page = pageArg(positional, USAGE);
  const a11y = flags.a11y === true;
  if (flags.a11y !== undefined && !a11y) throw new UsageError('--a11y takes no value');
  const n = intFlag(flags, 'n', DEFAULT_N, { min: 0 });
  const runs = intFlag(flags, 'runs', a11y && flags.runs === undefined ? 0 : 5, { min: a11y ? 0 : 1, max: 50 });
  const out = stringFlag(flags, 'out', undefined);

  const result = await measureNavigation({ page, n, runs, out, a11y });

  if (result.summary) console.log(describeSummary(result.summary, result.summaryFile));
  if (result.a11y) {
    const a = result.a11y;
    console.log(
      `[a11y] ${page} n=${n}: ${a.status} score=${a.score ?? 'n/a'} failed=${a.failedAudits.map(f => f.id).join(',') || 'none'}${a.code ? ` code=${a.code}` : ''} -> ${relFromRoot(result.a11yFile)}`,
    );
  }
  return 0;
});
