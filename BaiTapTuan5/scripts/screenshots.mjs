import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  closeBrowser,
  chromeVersionFromUA,
  DESKTOP_VIEWPORT,
  launchBrowser,
  MOBILE_VIEWPORT,
} from "./lib/browser.mjs";
import {
  APP_SHOTS,
  CliError,
  DEFAULT_N,
  DIST_DIR,
  FLOW_SHOTS,
  REPORT_SHOTS,
  REQUIRED_SHOTS,
  intFlag,
  nDir,
  pageArg,
  pageDir,
  parseArgs,
  preflight,
  readJson,
  relFromRoot,
  runMain,
  shotPath,
  shotsDir,
  shotsManifestPath,
  stringFlag,
} from "./lib/env.mjs";
import { buildHash, sourceHash } from "./lib/identity.mjs";
import {
  cancelEdit,
  openEdit,
  readFieldError,
  selectTab,
  setField,
  submitEdit,
} from "./lib/interact.mjs";
import { nextPaint, waitInitial } from "./lib/waits.mjs";

const USAGE =
  "node scripts/screenshots.mjs <before|after> [--n=10000] [--out=lighthouse]";
const WAIT_MS = 180_000;

const REPORT_TARGETS = {
  score: "#performance .lh-exp-gauge__wrapper",
  metrics: "#performance .lh-metrics-container",
  filmstrip: "#performance .lh-filmstrip-container",
  "unused-js": "#unused-javascript",
  "dom-size": "#dom-size-insight",
};
const OPTIONAL_REPORT_TARGETS = { bytes: "#total-byte-weight" };
const MAX_FAILED_AUDIT_SHOTS = 4;
const REPORT_VIEWPORT = { width: 1100, height: 900, deviceScaleFactor: 2 };
const FULL_VIEWPORT = { width: 1100, height: 900, deviceScaleFactor: 1 };

const fileUrl = (p) => pathToFileURL(path.resolve(p)).href;

/** Collects captured buffers and failures; nothing touches disk until `commit`. */
class Shots {
  constructor(out, page) {
    this.out = out;
    this.page = page;
    this.images = new Map(); // name -> { buffer, required, viewport, selector? }
    this.failures = new Map(); // name -> { required, selector, message }
  }
  ok(name, buffer, extra = {}) {
    this.images.set(name, {
      buffer,
      required: REQUIRED_SHOTS.includes(name),
      ...extra,
    });
    console.log(`[shots] ${this.page}-${name}: captured`);
  }
  fail(name, message, selector = null) {
    const required = REQUIRED_SHOTS.includes(name);
    this.failures.set(name, { required, selector, message });
    console[required ? "error" : "warn"](
      `[shots] ${required ? "MISSING" : "optional"} ${this.page}-${name}${selector ? ` (selector ${selector})` : ""}: ${message}`,
    );
  }
  failGroup(names, message) {
    for (const name of names)
      if (!this.images.has(name)) this.fail(name, message);
  }
  commit() {
    const dir = shotsDir(this.out);
    mkdirSync(dir, { recursive: true });
    for (const file of readdirSync(dir)) {
      if (file.startsWith(`${this.page}-audit-`) && file.endsWith(".png"))
        rmSync(path.join(dir, file), { force: true });
    }
    // A failed image must not be masked by a stale file from an earlier run.
    for (const name of this.failures.keys())
      rmSync(shotPath(this.out, this.page, name), { force: true });
    const files = {};
    for (const [name, image] of this.images) {
      const file = shotPath(this.out, this.page, name);
      writeFileSync(file, image.buffer);
      files[name] = {
        file: relFromRoot(file),
        bytes: image.buffer.length,
        required: image.required,
        viewport: image.viewport ?? null,
      };
    }
    return files;
  }
}

async function openDetails(handle) {
  await handle.evaluate((node) => {
    for (
      let d = node.closest("details");
      d;
      d = d.parentElement?.closest("details")
    )
      d.open = true;
    node.querySelector("details")?.setAttribute("open", "");
  });
}

async function shootElement(tab, shots, name, selector) {
  const handle = await tab.$(selector);
  if (!handle) {
    shots.fail(
      name,
      "selector matched no element in the report (Lighthouse report markup changed? investigate)",
      selector,
    );
    return;
  }
  try {
    await openDetails(handle);
    await handle.evaluate((node) => node.scrollIntoView({ block: "center" }));
    const box = await handle.boundingBox();
    if (!box || box.width === 0 || box.height === 0) {
      shots.fail(name, "element has an empty box", selector);
      return;
    }
    shots.ok(name, await handle.screenshot(), {
      selector,
      viewport: `${REPORT_VIEWPORT.width}x${REPORT_VIEWPORT.height}@${REPORT_VIEWPORT.deviceScaleFactor}`,
    });
  } catch (err) {
    shots.fail(name, err?.message ?? String(err), selector);
  } finally {
    await handle.dispose().catch(() => {});
  }
}

// ---------- groups ----------

async function captureReport(browser, shots, reportFile) {
  if (!existsSync(reportFile)) {
    shots.failGroup(
      REPORT_SHOTS,
      `${relFromRoot(reportFile)} does not exist; run the navigation measurement first`,
    );
    return;
  }
  const tab = await browser.newPage();
  try {
    await tab.setViewport(REPORT_VIEWPORT);
    await tab.goto(fileUrl(reportFile), { waitUntil: "load", timeout: 60_000 });
    await tab.waitForSelector("#performance", { timeout: 30_000 });
    for (const [name, selector] of Object.entries(REPORT_TARGETS))
      await shootElement(tab, shots, name, selector);
    for (const [name, selector] of Object.entries(OPTIONAL_REPORT_TARGETS))
      await shootElement(tab, shots, name, selector);

    // Informational: failing / average audits that exist in this report (not mandatory).
    const requiredIds = new Set([
      "unused-javascript",
      "dom-size-insight",
      "total-byte-weight",
    ]);
    const failedIds = await tab.evaluate(
      (limit) =>
        [
          ...document.querySelectorAll(
            "#performance .lh-audit--fail, #performance .lh-audit--average",
          ),
        ]
          .map((el) => el.id)
          .filter((id) => id)
          .slice(0, limit + 3),
      MAX_FAILED_AUDIT_SHOTS,
    );
    let taken = 0;
    for (const id of failedIds) {
      if (requiredIds.has(id) || taken >= MAX_FAILED_AUDIT_SHOTS) continue;
      taken++;
      await shootElement(
        tab,
        shots,
        `audit-${id}`,
        `#performance [id="${id}"]`,
      );
    }

    await tab.setViewport(FULL_VIEWPORT);
    await nextPaint(tab);
    shots.ok("full", await tab.screenshot({ fullPage: true }), {
      viewport: `${FULL_VIEWPORT.width}x${FULL_VIEWPORT.height}@1 fullPage`,
    });
  } catch (err) {
    shots.failGroup(
      REPORT_SHOTS,
      `report capture failed: ${err?.message ?? err}`,
    );
  } finally {
    await tab.close().catch(() => {});
  }
}

async function captureFlow(browser, shots, flowFile) {
  if (!existsSync(flowFile)) {
    shots.failGroup(
      FLOW_SHOTS,
      `${relFromRoot(flowFile)} does not exist; run measure:flow first`,
    );
    return;
  }
  const tab = await browser.newPage();
  try {
    await tab.setViewport(FULL_VIEWPORT);
    await tab.goto(fileUrl(flowFile), { waitUntil: "load", timeout: 60_000 });
    await tab.waitForFunction(
      () => document.body && document.body.innerText.trim().length > 200,
      { timeout: 30_000 },
    );
    await nextPaint(tab);
    shots.ok("flow-full", await tab.screenshot({ fullPage: true }), {
      viewport: `${FULL_VIEWPORT.width}x${FULL_VIEWPORT.height}@1 fullPage`,
    });
  } catch (err) {
    shots.fail(
      "flow-full",
      `flow report capture failed: ${err?.message ?? err}`,
      "body",
    );
  } finally {
    await tab.close().catch(() => {});
  }
}

/** Screenshot of the viewport with the DOM element count overlaid (overlay exists only while shooting). */
async function shootApp(tab, shots, name, viewport) {
  const count = await tab.evaluate(
    () => document.body.getElementsByTagName("*").length,
  );
  await tab.evaluate((total) => {
    const box = document.createElement("div");
    box.id = "btvn-dom-overlay";
    box.textContent = `DOM elements: ${total.toLocaleString("en-US")}`;
    box.style.cssText =
      "position:fixed;top:6px;right:6px;z-index:2147483647;background:#111;color:#7CFC00;font:700 13px monospace;padding:4px 8px;border-radius:6px;pointer-events:none";
    document.body.appendChild(box);
  }, count);
  try {
    await nextPaint(tab);
    shots.ok(name, await tab.screenshot(), {
      viewport: `${viewport.width}x${viewport.height}`,
      domElements: count,
    });
  } finally {
    await tab.evaluate(() =>
      document.getElementById("btvn-dom-overlay")?.remove(),
    );
  }
  return count;
}

async function captureApp(browser, shots, page, n, info) {
  let preflighted;
  try {
    preflighted = await preflight(page, n, "production");
  } catch (err) {
    shots.failGroup(APP_SHOTS, `preflight failed: ${err?.message ?? err}`);
    return;
  }
  const tab = await browser.newPage();
  try {
    await tab.setViewport(MOBILE_VIEWPORT);
    await tab.goto(preflighted.url, {
      waitUntil: "networkidle0",
      timeout: WAIT_MS,
    });
    const initial = await waitInitial(tab, { timeout: WAIT_MS });
    if (initial.page !== page || initial.buildMode !== "production") {
      throw new Error(
        `Loaded page identifies as page="${initial.page}" mode="${initial.buildMode}", expected "${page}"/"production".`,
      );
    }
    info.checksum = initial.checksum;
    info.dataN = initial.n;

    const step = async (name, fn) => {
      try {
        await fn();
      } catch (err) {
        shots.fail(name, err?.message ?? String(err));
      }
    };

    await step("app-mobile", async () => {
      info.domElementsMobile = await shootApp(
        tab,
        shots,
        "app-mobile",
        MOBILE_VIEWPORT,
      );
    });

    await step("app-desktop", async () => {
      await tab.setViewport(DESKTOP_VIEWPORT);
      await nextPaint(tab);
      info.domElementsDesktop = await shootApp(
        tab,
        shots,
        "app-desktop",
        DESKTOP_VIEWPORT,
      );
    });

    await step("app-stats", async () => {
      await selectTab(tab, "stats");
      await tab.waitForSelector("#stats-chart .recharts-wrapper", {
        visible: true,
        timeout: WAIT_MS,
      });
      await nextPaint(tab);
      const chart = await tab.$eval("#stats-chart", (el) => ({
        ...el.dataset,
      }));
      const rows = await tab.$$eval("#stats-summary tr[data-category]", (trs) =>
        trs.map((tr) => ({ ...tr.dataset })),
      );
      const total = await tab
        .$eval("#stats-summary tfoot tr[data-total]", (tr) => ({
          ...tr.dataset,
        }))
        .catch(() => null);
      if (Number(chart.productCount) !== initial.n)
        throw new Error(
          `#stats-chart data-product-count=${chart.productCount}, expected ${initial.n}`,
        );
      for (const key of ["totalStock", "totalValue"]) {
        if (!Number.isFinite(Number(chart[key])) || chart[key] === "")
          throw new Error(
            `#stats-chart data-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)} is not a number (got ${JSON.stringify(chart[key])})`,
          );
      }
      info.statsChart = chart;
      info.statsCategories = rows;
      info.statsTotal = total;
      await shootApp(tab, shots, "app-stats", DESKTOP_VIEWPORT);
    });

    await step("app-edit-error", async () => {
      await selectTab(tab, "table");
      await tab.waitForSelector("#product-table [data-row-id]", {
        timeout: WAIT_MS,
      });
      await openEdit(tab);
      await setField(tab, "#edit-price", "-1");
      await submitEdit(tab);
      await nextPaint(tab);
      const error = await readFieldError(tab, "price");
      if (!error.open)
        throw new Error(
          "#edit-form closed after submitting price -1; validation did not block it",
        );
      if (!error.invalid || !error.message) {
        throw new Error(
          `#edit-price shows no validation error after price -1 (aria-invalid=${error.invalid}, message=${JSON.stringify(error.message)})`,
        );
      }
      info.editErrorMessage = error.message;
      await shootApp(tab, shots, "app-edit-error", DESKTOP_VIEWPORT);
      await cancelEdit(tab);
    });
  } catch (err) {
    shots.failGroup(APP_SHOTS, `app capture failed: ${err?.message ?? err}`);
  } finally {
    await tab.close().catch(() => {});
  }
}

// ---------- main ----------

runMain(async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const page = pageArg(positional, USAGE);
  const n = intFlag(flags, "n", DEFAULT_N, { min: 1 });
  const out = stringFlag(flags, "out", undefined);

  const summaryFile = path.join(nDir(out, page, n), "summary.json");
  const flowSummaryFile = path.join(pageDir(out, page), "flow-summary.json");
  const summary = existsSync(summaryFile) ? readJson(summaryFile) : null;
  const flowSummary = existsSync(flowSummaryFile)
    ? readJson(flowSummaryFile)
    : null;

  const currentSource = sourceHash(page);
  for (const [label, doc] of [
    ["summary.json", summary],
    ["flow-summary.json", flowSummary],
  ]) {
    if (doc?.sourceHash && doc.sourceHash !== currentSource) {
      throw new CliError(
        `STALE: ${label} was measured from sourceHash ${doc.sourceHash}, current source is ${currentSource}. Screenshots would not match the measured code.`,
        {
          code: "STALE",
        },
      );
    }
  }

  const shots = new Shots(out, page);
  const info = {};
  let browser;
  let chromeVersion = null;
  try {
    browser = await launchBrowser();
    chromeVersion = chromeVersionFromUA(await browser.version());
    await captureReport(
      browser,
      shots,
      path.join(nDir(out, page, n), "median.report.html"),
    );
    await captureFlow(
      browser,
      shots,
      path.join(pageDir(out, page), "flow.report.html"),
    );
    await captureApp(browser, shots, page, n, info);
  } finally {
    await closeBrowser(browser);
  }

  let currentBuild = null;
  try {
    currentBuild = buildHash(page, DIST_DIR);
  } catch {
    // dist missing: recorded as null, build-results reports it
  }
  const files = shots.commit();
  const missing = REQUIRED_SHOTS.filter((name) => !shots.images.has(name));
  const manifest = {
    page,
    n,
    status: missing.length ? "failed" : "ok",
    missing,
    failures: Object.fromEntries(shots.failures),
    files,
    sourceHash: currentSource,
    buildHash: currentBuild,
    reportFetchTime: summary?.fetchTime ?? null,
    reportSummarySourceHash: summary?.sourceHash ?? null,
    reportSummaryBuildHash: summary?.buildHash ?? null,
    flowFetchTime: flowSummary?.fetchTime ?? null,
    chromeVersion,
    nodeVersion: process.version,
    app: info,
    generatedAt: new Date().toISOString(),
  };
  const manifestFile = shotsManifestPath(out, page);
  writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(
    `[shots] ${page}: ${Object.keys(files).length} images written to ${relFromRoot(shotsDir(out))}, manifest ${relFromRoot(manifestFile)}`,
  );
  if (missing.length) {
    console.error(
      `[shots] FAIL missing mandatory images: ${missing.map((name) => `${page}-${name}${shots.failures.get(name)?.selector ? ` [${shots.failures.get(name).selector}]` : ""}`).join(", ")}`,
    );
    return 1;
  }
  return 0;
});
