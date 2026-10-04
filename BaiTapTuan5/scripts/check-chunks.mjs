import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import {
  DIST_DIR,
  pageArg,
  pageDir,
  parseArgs,
  relFromRoot,
  runMain,
  stringFlag,
} from "./lib/env.mjs";
import {
  buildHash,
  dynamicClosure,
  findEntryKey,
  readManifest,
  sourceHash,
  staticClosure,
} from "./lib/identity.mjs";

const USAGE = "node scripts/check-chunks.mjs <before|after> [--out=lighthouse]";
// CSS class Recharts renders on its chart wrapper; it survives minification (string literal).
const MARKER = "recharts-wrapper";

function describe(files) {
  return [...files].sort().map((file) => {
    const buf = readFileSync(path.join(DIST_DIR, file));
    return {
      file,
      bytes: buf.length,
      gzipBytes: gzipSync(buf).length,
      hasRecharts: buf.includes(MARKER),
    };
  });
}

const sum = (items, key) => items.reduce((total, item) => total + item[key], 0);

runMain(async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const page = pageArg(positional, USAGE);
  const out = stringFlag(flags, "out", undefined);

  const manifest = readManifest(DIST_DIR);
  const entryKey = findEntryKey(manifest, page);
  const eager = staticClosure(manifest, entryKey);
  const lazy = dynamicClosure(manifest, entryKey);

  const eagerJs = describe(eager.js);
  const lazyJs = describe(lazy.js);
  const eagerCss = describe(eager.css);
  const eagerHasRecharts = eagerJs.some((f) => f.hasRecharts);
  const lazyHasRecharts = lazyJs.some((f) => f.hasRecharts);

  const problems = [];
  if (page === "before") {
    if (!eagerHasRecharts)
      problems.push(
        `before: "${MARKER}" not found in the static closure; Recharts must be eager in the baseline.`,
      );
  } else {
    if (eagerHasRecharts) {
      problems.push(
        `after: "${MARKER}" found in the static closure (${eagerJs
          .filter((f) => f.hasRecharts)
          .map((f) => f.file)
          .join(", ")}); Recharts must not be eager.`,
      );
    }
    if (!lazyHasRecharts)
      problems.push(
        `after: "${MARKER}" not found in the dynamic closure; Recharts must be lazy-loaded.`,
      );
  }

  const result = {
    page,
    marker: MARKER,
    entryKey,
    eagerHasRecharts,
    lazyHasRecharts,
    initialJsBytes: sum(eagerJs, "bytes"),
    initialJsGzipBytes: sum(eagerJs, "gzipBytes"),
    initialCssBytes: sum(eagerCss, "bytes"),
    eagerJs,
    lazyJs,
    eagerCss,
    ok: problems.length === 0,
    problems,
    sourceHash: sourceHash(page),
    buildHash: buildHash(page, DIST_DIR),
    nodeVersion: process.version,
    generatedAt: new Date().toISOString(),
  };

  const dir = pageDir(out, page);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "chunks.json");
  writeFileSync(file, `${JSON.stringify(result, null, 2)}\n`);

  console.log(
    `[chunks] ${page}: eagerHasRecharts=${eagerHasRecharts} lazyHasRecharts=${lazyHasRecharts} initialJs=${result.initialJsBytes} B (gzip ${result.initialJsGzipBytes} B)`,
  );
  console.log(`[chunks] wrote ${relFromRoot(file)}`);
  if (problems.length) {
    for (const p of problems) console.error(`[chunks] FAIL ${p}`);
    return 1;
  }
  return 0;
});
