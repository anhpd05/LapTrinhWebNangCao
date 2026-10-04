import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import lighthouse from "lighthouse";
import {
  computeMedianRun,
  filterToValidRuns,
} from "lighthouse/core/lib/median-run.js";
import {
  closeBrowser,
  chromeVersionFromUA,
  killChrome,
  launchBrowser,
  launchChrome,
  MOBILE_VIEWPORT,
} from "./browser.mjs";
import { nDir, pageDir, preflight, relFromRoot, DIST_DIR } from "./env.mjs";
import { identityOf } from "./identity.mjs";
import { waitInitial } from "./waits.mjs";

const RUN_TIMEOUT_MS = Number(process.env.RUN_TIMEOUT_MS ?? 300_000);
const DOM_TIMEOUT_MS = 60_000;

const METRIC_AUDITS = {
  FCP: "first-contentful-paint",
  LCP: "largest-contentful-paint",
  TBT: "total-blocking-time",
  CLS: "cumulative-layout-shift",
  SI: "speed-index",
};
export const METRIC_KEYS = ["score", "FCP", "LCP", "TBT", "CLS", "SI"];

// ---------- helpers ----------

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          Object.assign(new Error(`Lighthouse run exceeded ${ms} ms`), {
            code: "RUN_TIMEOUT",
          }),
        ),
      ms,
    );
  });
  promise.catch(() => {}); // the loser of the race must not become an unhandled rejection
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Error code for a rejected run: Lighthouse/Node `code`, else the error class name, else UNKNOWN. */
export function errorCode(err) {
  if (typeof err?.code === "string" && err.code) return err.code;
  if (err?.name && err.name !== "Error") return err.name;
  return "UNKNOWN";
}

export function metricsOf(lhr) {
  const score = lhr.categories.performance?.score;
  const metrics = {
    score: typeof score === "number" ? Math.round(score * 100) : null,
  };
  for (const [key, id] of Object.entries(METRIC_AUDITS))
    metrics[key] = lhr.audits[id]?.numericValue ?? null;
  return metrics;
}

/** Classify a finished Lighthouse result. `ok` only when every headline metric is a finite number. */
function classifyLhr(lhr, requestedUrl) {
  if (
    lhr.runtimeError &&
    lhr.runtimeError.code &&
    lhr.runtimeError.code !== "NO_ERROR"
  ) {
    return {
      status: "runtime-error",
      code: lhr.runtimeError.code,
      message: lhr.runtimeError.message ?? "",
    };
  }
  const requested = new URL(requestedUrl);
  const finalUrl = new URL(
    lhr.finalDisplayedUrl ?? lhr.finalUrl ?? requestedUrl,
  );
  if (
    finalUrl.pathname !== requested.pathname ||
    finalUrl.search !== requested.search
  ) {
    return {
      status: "runtime-error",
      code: "URL_MISMATCH",
      message: `Requested ${requested.pathname}${requested.search}, Lighthouse measured ${finalUrl.pathname}${finalUrl.search}`,
    };
  }
  const metrics = metricsOf(lhr);
  if (filterToValidRuns([lhr]).length === 0) {
    return {
      status: "runtime-error",
      code: "METRIC_UNAVAILABLE",
      message: "FCP or TTI unavailable for computeMedianRun",
    };
  }
  const missing = METRIC_KEYS.filter((key) => !Number.isFinite(metrics[key]));
  if (missing.length) {
    const detail = missing.map((key) =>
      key === "score"
        ? "performance score"
        : `${key}: ${lhr.audits[METRIC_AUDITS[key]]?.errorMessage ?? lhr.audits[METRIC_AUDITS[key]]?.scoreDisplayMode ?? "absent"}`,
    );
    return {
      status: "runtime-error",
      code: metrics.score === null ? "NULL_SCORE" : "METRIC_UNAVAILABLE",
      message: `Unavailable: ${detail.join("; ")}`,
    };
  }
  return { status: "ok", code: null, message: "" };
}

async function lighthouseOnce(chrome, url, { categories, outputs }) {
  const result = await withTimeout(
    lighthouse(url, {
      port: chrome.port,
      output: outputs,
      onlyCategories: categories,
      logLevel: "error",
    }),
    RUN_TIMEOUT_MS,
  );
  if (!result?.lhr)
    throw Object.assign(new Error("Lighthouse returned no result"), {
      code: "NO_RESULT",
    });
  return {
    lhr: result.lhr,
    report: Array.isArray(result.report) ? result.report : [result.report],
  };
}

function cleanDir(dir, patterns) {
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir)) {
    if (patterns.some((p) => p.test(name)))
      rmSync(path.join(dir, name), { force: true });
  }
}

const writeJson = (file, value) =>
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

// ---------- DOM count ----------

async function countDom(url, page) {
  let browser;
  try {
    browser = await launchBrowser();
    const tab = await browser.newPage();
    await tab.setViewport(MOBILE_VIEWPORT);
    await tab.goto(url, { waitUntil: "networkidle0", timeout: DOM_TIMEOUT_MS });
    const info = await waitInitial(tab, { timeout: DOM_TIMEOUT_MS });
    const domElements = await tab.evaluate(
      () => document.body.getElementsByTagName("*").length,
    );
    if (info.page !== page)
      return {
        status: "error",
        message: `main#app data-page="${info.page}", expected "${page}"`,
      };
    if (info.buildMode !== "production")
      return {
        status: "error",
        message: `main#app data-build-mode="${info.buildMode}", expected "production"`,
      };
    return {
      status: "ok",
      domElements,
      checksum: info.checksum,
      dataN: info.n,
      viewport: `${MOBILE_VIEWPORT.width}x${MOBILE_VIEWPORT.height}`,
    };
  } catch (err) {
    return {
      status: "error",
      code: errorCode(err),
      message: err?.message ?? String(err),
    };
  } finally {
    await closeBrowser(browser);
  }
}

// ---------- performance runs ----------

async function runPerformance({ page, n, runs, url, dir, identity }) {
  cleanDir(dir, [
    /^run-\d+\.json$/,
    /^median\.report\.html$/,
    /^summary\.json$/,
  ]);
  const records = [];
  const good = [];
  let chrome = null;
  try {
    for (let i = 1; i <= runs; i++) {
      const record = {
        index: i,
        file: null,
        status: "rejected",
        code: null,
        message: "",
      };
      try {
        if (!chrome) {
          try {
            chrome = await launchChrome();
          } catch (err) {
            throw Object.assign(
              new Error(`Cannot launch Chrome: ${err?.message ?? err}`),
              { code: "CHROME_LAUNCH_FAILED" },
            );
          }
        }
        const { lhr, report } = await lighthouseOnce(chrome, url, {
          categories: ["performance"],
          outputs: ["json", "html"],
        });
        record.file = `run-${i}.json`;
        writeFileSync(path.join(dir, record.file), JSON.stringify(lhr));
        record.fetchTime = lhr.fetchTime;
        Object.assign(record, classifyLhr(lhr, url));
        record.warnings = lhr.runWarnings?.length ?? 0;
        if (record.status === "ok") {
          record.metrics = metricsOf(lhr);
          good.push({ lhr, html: report[1], record });
        }
      } catch (err) {
        record.status = "rejected";
        record.code = errorCode(err);
        record.message = err?.message ?? String(err);
      }
      records.push(record);
      const tag =
        record.status === "ok"
          ? `score ${record.metrics.score}, LCP ${Math.round(record.metrics.LCP)} ms`
          : `${record.status} ${record.code}: ${record.message}`;
      console.log(`[nav] ${page} n=${n} run ${i}/${runs}: ${tag}`);
      if (record.status !== "ok") {
        await killChrome(chrome);
        chrome = null;
      }
    }
  } finally {
    await killChrome(chrome);
  }

  const summary = {
    page,
    n,
    url,
    attempted: runs,
    valid: good.length,
    status:
      good.length === 0 ? "failed" : good.length < runs ? "partial" : "ok",
    runs: records,
    sourceHash: identity.sourceHash,
    buildHash: identity.buildHash,
    nodeVersion: process.version,
    errorCodes: [...new Set(records.map((r) => r.code).filter(Boolean))],
  };

  if (good.length === 0) {
    writeJson(path.join(dir, "summary.json"), summary);
    return summary;
  }

  const median = computeMedianRun(good.map((g) => g.lhr));
  const picked = good.find((g) => g.lhr === median);
  const medianMetrics = metricsOf(median);
  const min = {};
  const max = {};
  for (const key of METRIC_KEYS) {
    const values = good.map((g) => g.record.metrics[key]);
    min[key] = Math.min(...values);
    max[key] = Math.max(...values);
  }
  const audits = median.audits;
  const dom = audits["dom-size-insight"];
  const domCount = await countDom(url, page);

  Object.assign(summary, medianMetrics, {
    min,
    max,
    domElements: domCount.status === "ok" ? domCount.domElements : null,
    domCount,
    domSizeInsight: dom
      ? {
          numericValue: dom.numericValue ?? null,
          totalElements: dom.details?.debugData?.totalElements ?? null,
          maxDepth: dom.details?.debugData?.maxDepth ?? null,
          maxChildren: dom.details?.debugData?.maxChildren ?? null,
          score: dom.score ?? null,
          scoreDisplayMode: dom.scoreDisplayMode ?? null,
        }
      : null,
    unusedJsBytes:
      audits["unused-javascript"]?.details?.overallSavingsBytes ?? null,
    totalBytes: audits["total-byte-weight"]?.numericValue ?? null,
    checksum: domCount.status === "ok" ? domCount.checksum : null,
    dataN: domCount.status === "ok" ? domCount.dataN : null,
    lighthouseVersion: median.lighthouseVersion,
    chromeVersion: chromeVersionFromUA(median.environment?.hostUserAgent),
    userAgent: median.environment?.hostUserAgent ?? null,
    benchmarkIndex: median.environment?.benchmarkIndex ?? null,
    throttling: median.configSettings?.throttling ?? null,
    throttlingMethod: median.configSettings?.throttlingMethod ?? null,
    formFactor: median.configSettings?.formFactor ?? null,
    fetchTime: median.fetchTime,
    firstFetchTime: good[0].lhr.fetchTime,
    lastFetchTime: good.at(-1).lhr.fetchTime,
    medianRunIndex: picked.record.index,
    medianFile: picked.record.file,
  });
  writeFileSync(path.join(dir, "median.report.html"), picked.html);
  writeJson(path.join(dir, "summary.json"), summary);
  return summary;
}

// ---------- accessibility run ----------

async function runAccessibility({ page, n, url, dir, identity }) {
  const base = {
    page,
    n,
    url,
    sourceHash: identity.sourceHash,
    buildHash: identity.buildHash,
    nodeVersion: process.version,
  };
  let chrome = null;
  let result;
  try {
    try {
      chrome = await launchChrome();
    } catch (err) {
      throw Object.assign(
        new Error(`Cannot launch Chrome: ${err?.message ?? err}`),
        { code: "CHROME_LAUNCH_FAILED" },
      );
    }
    const { lhr } = await lighthouseOnce(chrome, url, {
      categories: ["accessibility"],
      outputs: ["json"],
    });
    const category = lhr.categories.accessibility;
    const failed = [];
    for (const ref of category?.auditRefs ?? []) {
      const audit = lhr.audits[ref.id];
      if (!audit || audit.score === null || audit.score >= 1) continue;
      if (
        audit.scoreDisplayMode !== "binary" &&
        audit.scoreDisplayMode !== "numeric"
      )
        continue;
      failed.push({
        id: audit.id,
        title: audit.title,
        score: audit.score,
        displayValue: audit.displayValue ?? null,
        items: audit.details?.items?.length ?? null,
      });
    }
    const runtime =
      lhr.runtimeError && lhr.runtimeError.code !== "NO_ERROR"
        ? lhr.runtimeError
        : null;
    const score = category?.score;
    result = {
      ...base,
      status: runtime
        ? "runtime-error"
        : typeof score === "number"
          ? "ok"
          : "runtime-error",
      code: runtime
        ? runtime.code
        : typeof score === "number"
          ? null
          : "NULL_SCORE",
      message: runtime?.message ?? "",
      score: typeof score === "number" ? Math.round(score * 100) : null,
      failedAudits: failed,
      lighthouseVersion: lhr.lighthouseVersion,
      chromeVersion: chromeVersionFromUA(lhr.environment?.hostUserAgent),
      fetchTime: lhr.fetchTime,
    };
  } catch (err) {
    result = {
      ...base,
      status: "rejected",
      code: errorCode(err),
      message: err?.message ?? String(err),
      score: null,
      failedAudits: [],
    };
  } finally {
    await killChrome(chrome);
  }
  mkdirSync(dir, { recursive: true });
  writeJson(path.join(dir, "a11y.json"), result);
  return result;
}

// ---------- public API ----------

/**
 * Measure one page at one n. Throws on preflight/identity problems (nothing is written).
 * Run-level failures never throw: they are recorded in summary.json.
 *
 * `runs: 0` with `a11y: true` writes only a11y.json and leaves existing performance results untouched.
 */
export async function measureNavigation({ page, n, runs, out, a11y = false }) {
  const { url } = await preflight(page, n, "production");
  const identity = identityOf(page, DIST_DIR);
  const result = {};

  if (runs > 0) {
    const dir = nDir(out, page, n);
    mkdirSync(dir, { recursive: true });
    const summary = await runPerformance({ page, n, runs, url, dir, identity });
    const after = identityOf(page, DIST_DIR);
    if (
      after.sourceHash !== identity.sourceHash ||
      after.buildHash !== identity.buildHash
    ) {
      summary.status = "failed";
      summary.identityChanged = true;
      summary.errorCodes = [
        ...new Set([...(summary.errorCodes ?? []), "IDENTITY_CHANGED"]),
      ];
      summary.message =
        "Source or build changed while measuring; results are not attributable to one build. Re-run.";
      writeJson(path.join(dir, "summary.json"), summary);
    }
    result.summary = summary;
    result.summaryFile = path.join(dir, "summary.json");
  }

  if (a11y) {
    result.a11y = await runAccessibility({
      page,
      n,
      url,
      dir: pageDir(out, page),
      identity,
    });
    result.a11yFile = path.join(pageDir(out, page), "a11y.json");
  }
  return result;
}

/** Record a cell that could not even start (preflight / identity error) so tables show why. */
export function writeCellFailure({ page, n, out, attempted, err }) {
  const dir = nDir(out, page, n);
  mkdirSync(dir, { recursive: true });
  cleanDir(dir, [
    /^run-\d+\.json$/,
    /^median\.report\.html$/,
    /^summary\.json$/,
  ]);
  const summary = {
    page,
    n,
    attempted,
    valid: 0,
    status: "failed",
    runs: [],
    errorCodes: [errorCode(err)],
    message: err?.message ?? String(err),
    nodeVersion: process.version,
  };
  writeJson(path.join(dir, "summary.json"), summary);
  return summary;
}

export function describeSummary(summary, file) {
  const parts = [
    `[nav] ${summary.page} n=${summary.n}: ${summary.status} valid=${summary.valid}/${summary.attempted}`,
  ];
  if (summary.status !== "failed") {
    parts.push(
      `score=${summary.score} FCP=${Math.round(summary.FCP)} LCP=${Math.round(summary.LCP)} TBT=${Math.round(summary.TBT)} CLS=${summary.CLS.toFixed(3)} DOM=${summary.domElements ?? "n/a"}`,
    );
  } else if (summary.errorCodes?.length) {
    parts.push(`codes=${summary.errorCodes.join(",")}`);
  }
  if (file) parts.push(`-> ${relFromRoot(file)}`);
  return parts.join(" ");
}
