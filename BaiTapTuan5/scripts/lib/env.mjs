import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

function resolveFromRoot(p) {
  return path.isAbsolute(p) ? path.normalize(p) : path.resolve(ROOT, p);
}

function stripTrailingSlash(url) {
  return url.replace(/\/+$/, "");
}

// Environment overrides (all optional).
export const CHROME_PATH =
  process.env.CHROME_PATH ??
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
export const BASE_URL = stripTrailingSlash(
  process.env.BASE_URL ?? "http://127.0.0.1:4173",
);
export const PROF_URL = stripTrailingSlash(
  process.env.PROF_URL ?? "http://127.0.0.1:4174",
);
export const DIST_DIR = resolveFromRoot(process.env.DIST_DIR ?? "dist");
export const PROF_DIST_DIR = resolveFromRoot(
  process.env.PROF_DIST_DIR ?? "dist-prof",
);
export const DEFAULT_OUT = process.env.LIGHTHOUSE_DIR ?? "lighthouse";

export const PAGES = ["before", "after"];
export const DEFAULT_N = 10000;
export const SCALE_NS = [1000, 10000, 50000];
export const SEARCH_TEXT = "dien thoai";

/** Mandatory screenshots per page. A missing one makes `shots` and `results` fail. */
export const REPORT_SHOTS = [
  "score",
  "metrics",
  "filmstrip",
  "unused-js",
  "dom-size",
  "full",
];
export const FLOW_SHOTS = ["flow-full"];
export const APP_SHOTS = [
  "app-mobile",
  "app-desktop",
  "app-stats",
  "app-edit-error",
];
export const REQUIRED_SHOTS = [...REPORT_SHOTS, ...FLOW_SHOTS, ...APP_SHOTS];
export const PROFILER_SCENARIOS = ["a", "b", "c"];

// ---------- paths ----------

/** Resolve an `--out` style path against the project root. */
export function outRoot(out) {
  return resolveFromRoot(out ?? DEFAULT_OUT);
}
export const pageDir = (out, page) => path.join(outRoot(out), page);
export const nDir = (out, page, n) => path.join(pageDir(out, page), `n${n}`);
export const shotsDir = (out) => path.join(outRoot(out), "screenshots");
export const shotPath = (out, page, name) =>
  path.join(shotsDir(out), `${page}-${name}.png`);
export const shotsManifestPath = (out, page) =>
  path.join(shotsDir(out), `${page}-manifest.json`);

export function relFromRoot(p) {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

export function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

// ---------- errors / CLI ----------

export class CliError extends Error {
  constructor(message, { exitCode = 1, code = "CLI_ERROR" } = {}) {
    super(message);
    this.name = "CliError";
    this.exitCode = exitCode;
    this.code = code;
  }
}

export class PreflightError extends CliError {
  constructor(message) {
    super(message, { exitCode: 1, code: "PREFLIGHT_FAILED" });
    this.name = "PreflightError";
  }
}

export class UsageError extends CliError {
  constructor(message) {
    super(message, { exitCode: 2, code: "USAGE" });
    this.name = "UsageError";
  }
}

/** `--k=v` -> flags.k = 'v'; `--k` -> flags.k = true; everything else is positional. */
export function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq === -1) flags[arg.slice(2)] = true;
      else flags[arg.slice(2, eq)] = arg.slice(eq + 1);
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

export function intFlag(
  flags,
  name,
  fallback,
  { min = 0, max = Number.MAX_SAFE_INTEGER } = {},
) {
  const raw = flags[name];
  if (raw === undefined) return fallback;
  if (raw === true || !/^\d+$/.test(String(raw)))
    throw new UsageError(
      `--${name} must be a non-negative integer, got "${raw}"`,
    );
  const value = Number(raw);
  if (value < min || value > max)
    throw new UsageError(`--${name} must be in [${min}, ${max}], got ${value}`);
  return value;
}

export function stringFlag(flags, name, fallback) {
  const raw = flags[name];
  if (raw === undefined) return fallback;
  if (raw === true || raw === "")
    throw new UsageError(`--${name} requires a value (--${name}=<value>)`);
  return String(raw);
}

export function pageArg(positional, usage) {
  const page = positional[0];
  if (!PAGES.includes(page))
    throw new UsageError(
      `Missing or invalid page "${page ?? ""}". Usage: ${usage}`,
    );
  return page;
}

/**
 * Run an async main function, translate CliError into an exit code and make sure the
 * process exits even if a stray handle (e.g. a killed browser pipe) is still open.
 */
export function runMain(main) {
  const finish = (code) => {
    process.exitCode = code;
    setTimeout(() => process.exit(code), 2000).unref();
  };
  Promise.resolve()
    .then(main)
    .then((code) => finish(typeof code === "number" ? code : 0))
    .catch((err) => {
      if (err instanceof CliError) {
        console.error(`[${err.code}] ${err.message}`);
        finish(err.exitCode);
      } else {
        console.error(err?.stack ?? String(err));
        finish(1);
      }
    });
}

// ---------- preflight ----------

const MODE_TARGETS = {
  production: {
    baseUrl: BASE_URL,
    distDir: DIST_DIR,
    port: 4173,
    hint: "npm run build && npm run preview",
  },
  profiling: {
    baseUrl: PROF_URL,
    distDir: PROF_DIST_DIR,
    port: 4174,
    hint: "npm run build:prof && npm run preview:prof",
  },
};

export function targetFor(mode) {
  const target = MODE_TARGETS[mode];
  if (!target) throw new UsageError(`Unknown mode "${mode}"`);
  return target;
}

export function pageUrl(page, n, mode = "production") {
  return `${targetFor(mode).baseUrl}/${page}.html?n=${n}`;
}

function parseTagAttributes(tag) {
  const attrs = {};
  for (const m of tag.matchAll(
    /([^\s=<>/"']+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g,
  )) {
    attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return attrs;
}

export function readMeta(html, name) {
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = parseTagAttributes(m[0]);
    if (attrs.name === name) return attrs.content ?? "";
  }
  return null;
}

const normalizeHtml = (html) => html.replace(/\r\n?/g, "\n").trim();

/**
 * Strict preflight (S1, S8, S20). Throws PreflightError (exit code 1) with the exact reason:
 *   1. Chrome exists at CHROME_PATH.
 *   2. dist/<page>.html (or dist-prof) exists, so there is a build to compare with.
 *   3. GET exactly /<page>.html?n=<n> answers 200 text/html within 10 s.
 *   4. `btvn-page` meta equals <page> (rejects the SPA fallback to index), `btvn-mode`
 *      equals the expected mode, and the HTML has no /@vite/client (dev server).
 *   5. The served HTML is byte-identical (modulo line endings) to the HTML in the dist dir
 *      that identity hashes are computed from, so a stale or foreign preview is rejected.
 * Returns { url, baseUrl, distDir, mode, html }.
 */
export async function preflight(page, n, expectedMode) {
  if (!PAGES.includes(page))
    throw new PreflightError(
      `Unknown page "${page}" (expected one of ${PAGES.join(", ")})`,
    );
  if (!Number.isInteger(n) || n < 0)
    throw new PreflightError(`n must be a non-negative integer, got ${n}`);
  const target = targetFor(expectedMode);

  if (!existsSync(CHROME_PATH)) {
    throw new PreflightError(
      `Chrome not found at "${CHROME_PATH}". Install Chrome or set CHROME_PATH.`,
    );
  }

  const distHtmlPath = path.join(target.distDir, `${page}.html`);
  if (!existsSync(distHtmlPath)) {
    throw new PreflightError(
      `Build output "${distHtmlPath}" is missing. Run: ${target.hint.split(" && ")[0]}`,
    );
  }

  const url = `${target.baseUrl}/${page}.html?n=${n}`;
  let response;
  let html;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      redirect: "manual",
      headers: { accept: "text/html" },
    });
    html = await response.text();
  } catch (err) {
    throw new PreflightError(
      `Cannot reach ${url} (${err?.cause?.code ?? err?.name ?? "error"}: ${err?.message}). Is the ${expectedMode} server running? Run: ${target.hint}`,
    );
  }
  if (response.status !== 200) {
    throw new PreflightError(
      `${url} answered HTTP ${response.status}, expected 200.`,
    );
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    throw new PreflightError(
      `${url} answered content-type "${contentType}", expected text/html.`,
    );
  }

  const metaPage = readMeta(html, "btvn-page");
  if (metaPage !== page) {
    throw new PreflightError(
      `${url} is not the "${page}" page (meta btvn-page=${JSON.stringify(metaPage)}). The server probably fell back to index.html or serves another app on this port.`,
    );
  }
  const metaMode = readMeta(html, "btvn-mode");
  if (metaMode !== expectedMode) {
    throw new PreflightError(
      `${url} reports btvn-mode=${JSON.stringify(metaMode)}, expected "${expectedMode}". Measure only the ${expectedMode} build on port ${target.port}.`,
    );
  }
  if (html.includes("/@vite/client")) {
    throw new PreflightError(
      `${url} is served by the Vite dev server (/@vite/client found). Measure only built output (S1).`,
    );
  }
  if (
    normalizeHtml(html) !== normalizeHtml(readFileSync(distHtmlPath, "utf8"))
  ) {
    throw new PreflightError(
      `${url} differs from "${distHtmlPath}". The preview is serving a different build than the files on disk: stop it, rebuild, restart the preview.`,
    );
  }

  return {
    url,
    baseUrl: target.baseUrl,
    distDir: target.distDir,
    mode: expectedMode,
    html,
  };
}
