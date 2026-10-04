import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { CliError, PAGES, ROOT } from "./env.mjs";

export class IdentityError extends CliError {
  constructor(message) {
    super(message, { exitCode: 1, code: "IDENTITY_ERROR" });
    this.name = "IdentityError";
  }
}

const toPosix = (p) => p.split(path.sep).join("/");

function normalizeBytes(buf) {
  if (buf.includes(0)) return buf; // binary: hash as is
  return Buffer.from(buf.toString("utf8").replace(/\r\n?/g, "\n"), "utf8");
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

// ---------- sourceHash ----------

/** Files that define the source of <page>: src/<page>/**, src/shared/**, <page>.html, vite.config.ts, package-lock.json. */
export function sourceFiles(page, root = ROOT) {
  if (!PAGES.includes(page)) throw new IdentityError(`Unknown page "${page}"`);
  const files = [];
  for (const dir of [path.join("src", page), path.join("src", "shared")]) {
    const abs = path.join(root, dir);
    if (!existsSync(abs))
      throw new IdentityError(
        `Source directory "${abs}" does not exist; cannot compute sourceHash(${page}).`,
      );
    files.push(...walk(abs));
  }
  for (const file of [`${page}.html`, "vite.config.ts", "package-lock.json"]) {
    const abs = path.join(root, file);
    if (!existsSync(abs))
      throw new IdentityError(
        `"${abs}" does not exist; cannot compute sourceHash(${page}).`,
      );
    files.push(abs);
  }
  return files
    .map((f) => toPosix(path.relative(root, f)))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** SHA-256 over sorted (relative path, normalized content) pairs. Line endings do not matter. */
export function sourceHash(page, root = ROOT) {
  const hash = createHash("sha256");
  for (const rel of sourceFiles(page, root)) {
    const content = normalizeBytes(readFileSync(path.join(root, rel)));
    hash.update(`${rel}\0${content.length}\0`);
    hash.update(content);
    hash.update("\0");
  }
  return hash.digest("hex");
}

// ---------- manifest closures ----------

export function readManifest(dir) {
  const file = path.join(dir, ".vite", "manifest.json");
  if (!existsSync(file))
    throw new IdentityError(
      `Vite manifest "${file}" is missing (build.manifest must be enabled; rebuild).`,
    );
  return JSON.parse(readFileSync(file, "utf8"));
}

export function findEntryKey(manifest, page) {
  const name = `${page}.html`;
  if (manifest[name]) return name;
  const key = Object.keys(manifest).find(
    (k) => manifest[k].isEntry && manifest[k].src === name,
  );
  if (!key) throw new IdentityError(`No manifest entry for ${name}.`);
  return key;
}

function emptyClosure() {
  return { keys: new Set(), js: new Set(), css: new Set(), assets: new Set() };
}

function visit(manifest, roots, { followDynamic, skipKeys }) {
  const closure = emptyClosure();
  const stack = [...roots];
  while (stack.length) {
    const key = stack.pop();
    if (closure.keys.has(key) || skipKeys?.has(key)) continue;
    const chunk = manifest[key];
    if (!chunk)
      throw new IdentityError(
        `Manifest references "${key}" which has no entry.`,
      );
    closure.keys.add(key);
    if (chunk.file) closure.js.add(chunk.file);
    for (const f of chunk.css ?? []) closure.css.add(f);
    for (const f of chunk.assets ?? []) closure.assets.add(f);
    stack.push(...(chunk.imports ?? []));
    if (followDynamic) stack.push(...(chunk.dynamicImports ?? []));
  }
  return closure;
}

/** Everything the browser must fetch to start <entryKey>: static `imports` only. */
export function staticClosure(manifest, entryKey) {
  return visit(manifest, [entryKey], { followDynamic: false });
}

/** Chunks reachable only through dynamic import(): excludes anything in the static closure. */
export function dynamicClosure(manifest, entryKey) {
  const eager = staticClosure(manifest, entryKey);
  const roots = [];
  for (const key of eager.keys)
    roots.push(...(manifest[key].dynamicImports ?? []));
  const lazy = visit(manifest, roots, {
    followDynamic: true,
    skipKeys: eager.keys,
  });
  for (const set of ["js", "css", "assets"]) {
    for (const f of eager[set]) lazy[set].delete(f);
  }
  return lazy;
}

function htmlLocalRefs(html, dir) {
  const refs = new Set();
  for (const m of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"'#?]+)/gi)) {
    const ref = m[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(ref) || ref.startsWith("//")) continue;
    if (ref.endsWith(".html")) continue;
    const rel = ref.replace(/^\/+/, "");
    const abs = path.join(dir, rel);
    if (
      existsSync(abs) &&
      statSync(abs).isFile() &&
      !path.relative(dir, abs).startsWith("..")
    )
      refs.add(toPosix(path.relative(dir, abs)));
  }
  return refs;
}

/**
 * All files that make up the delivered build of <page> in `dir` (dist, dist-prof or a snapshot):
 * the HTML, static + dynamic JS, CSS and assets from the manifest, and local files the HTML links to.
 * Returns sorted posix paths relative to `dir`. Every listed file exists.
 */
export function deliveredFiles(page, dir) {
  const htmlRel = `${page}.html`;
  const htmlAbs = path.join(dir, htmlRel);
  if (!existsSync(htmlAbs)) throw new IdentityError(`"${htmlAbs}" is missing.`);
  const manifest = readManifest(dir);
  const entryKey = findEntryKey(manifest, page);
  const eager = staticClosure(manifest, entryKey);
  const lazy = dynamicClosure(manifest, entryKey);
  const files = new Set([htmlRel]);
  for (const c of [eager, lazy])
    for (const set of [c.js, c.css, c.assets])
      for (const f of set) files.add(f);
  for (const f of htmlLocalRefs(readFileSync(htmlAbs, "utf8"), dir))
    files.add(f);
  for (const f of files) {
    if (!existsSync(path.join(dir, f)))
      throw new IdentityError(
        `Delivered file "${f}" is listed for ${page} but missing in "${dir}".`,
      );
  }
  return [...files].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** SHA-256 over sorted (path, bytes) of the delivered build. Identical for dist and for a snapshot of it. */
export function buildHash(page, dir) {
  const hash = createHash("sha256");
  for (const rel of deliveredFiles(page, dir)) {
    const content = readFileSync(path.join(dir, rel));
    hash.update(`${rel}\0${content.length}\0`);
    hash.update(content);
    hash.update("\0");
  }
  return hash.digest("hex");
}

export function identityOf(page, dir) {
  return { sourceHash: sourceHash(page), buildHash: buildHash(page, dir) };
}

// ---------- snapshot ----------

/** Copy the delivered build (+ manifest) of <page> from `dir` into `target`. Returns { files, buildHash }. */
export function snapshotBuild(page, dir, target) {
  const files = deliveredFiles(page, dir);
  const hashBefore = buildHash(page, dir);
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  for (const rel of [...files, ".vite/manifest.json"]) {
    const dest = path.join(target, rel);
    mkdirSync(path.dirname(dest), { recursive: true });
    cpSync(path.join(dir, rel), dest);
  }
  const snapshotHash = buildHash(page, target);
  if (snapshotHash !== hashBefore) {
    throw new IdentityError(
      `Snapshot hash ${snapshotHash} differs from source build hash ${hashBefore}; the build changed while copying.`,
    );
  }
  const sizes = files.map((rel) => ({
    path: rel,
    bytes: statSync(path.join(target, rel)).size,
  }));
  writeFileSync(
    path.join(target, "snapshot.json"),
    `${JSON.stringify({ page, buildHash: snapshotHash, createdAt: new Date().toISOString(), files: sizes }, null, 2)}\n`,
  );
  return { files: sizes, buildHash: snapshotHash };
}
