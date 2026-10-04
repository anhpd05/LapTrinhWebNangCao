import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  closeBrowser,
  launchBrowser,
  MOBILE_VIEWPORT,
} from "./lib/browser.mjs";
import {
  DEFAULT_N,
  PROF_DIST_DIR,
  PROFILER_SCENARIOS,
  SEARCH_TEXT,
  intFlag,
  pageArg,
  pageDir,
  parseArgs,
  preflight,
  relFromRoot,
  runMain,
  shotPath,
  shotsDir,
  stringFlag,
} from "./lib/env.mjs";
import { identityOf } from "./lib/identity.mjs";
import {
  cancelEdit,
  firstRowId,
  openEdit,
  readField,
  setField,
  submitEdit,
} from "./lib/interact.mjs";
import { nextPaint, waitApplied, waitGone, waitInitial } from "./lib/waits.mjs";

const USAGE =
  "node scripts/measure-profiler.mjs <before|after> [--n=10000] [--out=lighthouse]";
const WAIT_MS = 180_000;

const DESCRIPTIONS = {
  a: "Edit the stock of the first row via the form and save (evidence for memo + useCallback + immutable update): rowRender",
  b: "Open the edit form then cancel, list state untouched (evidence for lazy initializer + useMemo): generate, filterSort",
  c: `Type "${SEARCH_TEXT}" then click #sort-price (combined evidence of all techniques, not memo alone): App commits / actualMs / maxMs`,
};

function normalizePerf(raw) {
  const num = (value, label) => {
    if (!Number.isFinite(value))
      throw new Error(
        `window.__PERF__.${label} is not a number (got ${JSON.stringify(value)}); raw: ${JSON.stringify(raw)}`,
      );
    return value;
  };
  return {
    rowRender: num(raw?.rowRender, "rowRender"),
    generate: num(raw?.generate, "generate"),
    filterSort: num(raw?.filterSort, "filterSort"),
    appCommits: num(raw?.App?.commits, "App.commits"),
    appActualMs: num(raw?.App?.actualMs, "App.actualMs"),
    appMaxMs: num(raw?.App?.maxMs, "App.maxMs"),
  };
}

const readPerf = async (tab) =>
  normalizePerf(
    await tab.evaluate(() =>
      JSON.parse(JSON.stringify(window.__PERF__ ?? null)),
    ),
  );

async function resetPerf(tab) {
  const hasReset = await tab.evaluate(
    () => typeof window.__PERF_RESET__ === "function",
  );
  if (!hasReset)
    throw new Error(
      "window.__PERF_RESET__ is missing: this is not a profiling build.",
    );
  await tab.evaluate(() => window.__PERF_RESET__());
}

const readRevision = (tab) =>
  tab.$eval("#result-count", (el) => Number(el.dataset.revision));
const visibleRowCount = (tab) =>
  tab.evaluate(
    () => document.querySelectorAll("#product-table [data-row-id]").length,
  );

// ---------- scenarios ----------

async function scenarioA(tab) {
  await resetPerf(tab);
  const revisionBefore = await readRevision(tab);
  const rowId = await firstRowId(tab);
  const rowSelector = `#product-table [data-row-id="${rowId}"]`;
  await openEdit(tab, rowId);
  await nextPaint(tab);
  const afterOpen = await readPerf(tab);
  // Count only the save commit; opening the form is measured separately in scenario (b).
  await resetPerf(tab);

  const oldStock = Number(await readField(tab, "#edit-stock"));
  if (!Number.isInteger(oldStock))
    throw new Error(
      `#edit-stock holds "${await readField(tab, "#edit-stock")}", expected an integer.`,
    );
  const newStock = oldStock < 1000 ? oldStock + 1 : oldStock - 1;
  await setField(tab, "#edit-stock", newStock);
  await submitEdit(tab);
  await waitGone(tab, "#edit-form", { timeout: WAIT_MS });
  // The mutation is finished only when the revision moved AND the row shows the new stock.
  await waitApplied(tab, { minRevision: revisionBefore + 1, timeout: WAIT_MS });
  await tab
    .waitForFunction(
      (selector, stock) => {
        const row = document.querySelector(selector);
        if (!row) return false;
        return row.children[4]?.textContent.trim() === stock;
      },
      { timeout: WAIT_MS, polling: 100 },
      rowSelector,
      String(newStock),
    )
    .catch((err) => {
      throw new Error(
        `Row ${rowId} did not show stock ${newStock} after save: ${err?.message}`,
      );
    });
  await nextPaint(tab);
  const final = await readPerf(tab);
  return {
    perf: final,
    checkpoints: [
      { step: "afterOpenForm", perf: afterOpen },
      { step: "afterSave", perf: final },
    ],
    rowId,
    oldStock,
    newStock,
    revisionBefore,
    revisionAfter: await readRevision(tab),
  };
}

async function scenarioB(tab) {
  await resetPerf(tab);
  await openEdit(tab);
  await nextPaint(tab);
  const afterOpen = await readPerf(tab);
  await cancelEdit(tab);
  const final = await readPerf(tab);
  return {
    perf: final,
    checkpoints: [
      { step: "afterOpenForm", perf: afterOpen },
      { step: "afterCancel", perf: final },
    ],
  };
}

async function scenarioC(tab) {
  await resetPerf(tab);
  await tab.type("#search", SEARCH_TEXT, { delay: 50 });
  await waitApplied(tab, { query: SEARCH_TEXT, timeout: WAIT_MS });
  const afterTyping = await readPerf(tab);
  await tab.click("#sort-price");
  await waitApplied(tab, {
    query: SEARCH_TEXT,
    sort: "price-asc",
    timeout: WAIT_MS,
  });
  const final = await readPerf(tab);
  return {
    perf: final,
    checkpoints: [
      { step: "afterTyping", perf: afterTyping },
      { step: "afterSort", perf: final },
    ],
    resultCount: await tab.$eval("#result-count", (el) =>
      Number(el.dataset.count),
    ),
  };
}

const SCENARIOS = { a: scenarioA, b: scenarioB, c: scenarioC };

// ---------- main ----------

runMain(async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const page = pageArg(positional, USAGE);
  const n = intFlag(flags, "n", DEFAULT_N, { min: 1 });
  const out = stringFlag(flags, "out", undefined);

  const { url } = await preflight(page, n, "profiling");
  const identity = identityOf(page, PROF_DIST_DIR);
  mkdirSync(shotsDir(out), { recursive: true });

  const scenarios = {};
  let browser;
  let chromeVersion = null;
  let initialInfo = null;
  try {
    browser = await launchBrowser();
    chromeVersion = (await browser.version()).replace(/^.*Chrome\//, "");
    for (const key of PROFILER_SCENARIOS) {
      const started = Date.now();
      const tab = await browser.newPage();
      const record = { status: "error", description: DESCRIPTIONS[key] };
      try {
        await tab.setViewport(MOBILE_VIEWPORT);
        await tab.goto(url, { waitUntil: "networkidle0", timeout: WAIT_MS });
        const info = await waitInitial(tab, { timeout: WAIT_MS });
        if (info.page !== page || info.buildMode !== "profiling") {
          throw new Error(
            `Loaded page identifies as page="${info.page}" mode="${info.buildMode}", expected "${page}"/"profiling".`,
          );
        }
        initialInfo ??= info;
        record.renderedRowsBefore = await visibleRowCount(tab);
        Object.assign(record, await SCENARIOS[key](tab));
        record.renderedRowsAfter = await visibleRowCount(tab);
        record.status = "ok";
      } catch (err) {
        record.message = err?.message ?? String(err);
      }
      record.wallMs = Date.now() - started;
      try {
        const file = shotPath(out, page, `profiler-${key}`);
        await tab.screenshot({ path: file });
        record.screenshot = relFromRoot(file);
      } catch (err) {
        record.screenshotError = err?.message ?? String(err);
      }
      await tab.close().catch(() => {});
      scenarios[key] = record;
      console.log(
        `[profiler] ${page} (${key}): ${record.status}${record.status === "ok" ? ` ${JSON.stringify(record.perf)}` : ` ${record.message}`}`,
      );
    }
  } finally {
    await closeBrowser(browser);
  }

  const after = identityOf(page, PROF_DIST_DIR);
  const identityChanged =
    after.sourceHash !== identity.sourceHash ||
    after.buildHash !== identity.buildHash;
  const failed = PROFILER_SCENARIOS.filter(
    (key) => scenarios[key]?.status !== "ok",
  );
  const profiler = {
    page,
    n,
    url,
    buildMode: "profiling",
    status: failed.length === 0 && !identityChanged ? "ok" : "failed",
    identityChanged,
    scenarios,
    checksum: initialInfo?.checksum ?? null,
    dataN: initialInfo?.n ?? null,
    chromeVersion,
    nodeVersion: process.version,
    sourceHash: identity.sourceHash,
    buildHash: identity.buildHash,
    generatedAt: new Date().toISOString(),
  };
  const dir = pageDir(out, page);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "profiler.json");
  writeFileSync(file, `${JSON.stringify(profiler, null, 2)}\n`);
  console.log(`[profiler] wrote ${relFromRoot(file)}`);
  if (failed.length)
    console.error(`[profiler] FAIL scenarios: ${failed.join(", ")}`);
  if (identityChanged)
    console.error(
      "[profiler] FAIL source or profiling build changed while measuring (IDENTITY_CHANGED)",
    );
  return profiler.status === "ok" ? 0 : 1;
});
