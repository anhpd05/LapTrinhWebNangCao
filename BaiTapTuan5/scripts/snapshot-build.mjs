import { existsSync } from "node:fs";
import path from "node:path";
import {
  CliError,
  DEFAULT_N,
  DIST_DIR,
  intFlag,
  nDir,
  pageArg,
  pageDir,
  parseArgs,
  readJson,
  relFromRoot,
  runMain,
  stringFlag,
} from "./lib/env.mjs";
import { buildHash, snapshotBuild } from "./lib/identity.mjs";

const USAGE =
  "node scripts/snapshot-build.mjs <before|after> [--n=10000] [--out=lighthouse] [--force]";

runMain(async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const page = pageArg(positional, USAGE);
  const n = intFlag(flags, "n", DEFAULT_N, { min: 0 });
  const out = stringFlag(flags, "out", undefined);
  const force = flags.force === true;

  const current = buildHash(page, DIST_DIR);
  const summaryFile = path.join(nDir(out, page, n), "summary.json");
  if (existsSync(summaryFile)) {
    const measured = readJson(summaryFile).buildHash;
    if (measured !== current && !force) {
      throw new CliError(
        `dist/${page}.html build ${current} differs from the measured build ${measured} in ${relFromRoot(summaryFile)}. Rebuild would invalidate the baseline; do not snapshot a different build.`,
        { code: "BUILD_MISMATCH" },
      );
    }
  } else if (!force) {
    throw new CliError(
      `${relFromRoot(summaryFile)} does not exist: measure first (npm run measure:${page}) or pass --force.`,
      { code: "NOT_MEASURED" },
    );
  }

  const target = path.join(pageDir(out, page), "build-snapshot");
  const result = snapshotBuild(page, DIST_DIR, target);
  console.log(
    `[snapshot] ${page}: ${result.files.length} files, buildHash ${result.buildHash} -> ${relFromRoot(target)}`,
  );
  return 0;
});
