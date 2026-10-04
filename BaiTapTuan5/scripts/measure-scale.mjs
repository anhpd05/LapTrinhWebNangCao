import {
  describeSummary,
  measureNavigation,
  writeCellFailure,
} from "./lib/navigation.mjs";
import {
  PAGES,
  SCALE_NS,
  UsageError,
  intFlag,
  outRoot,
  parseArgs,
  preflight,
  relFromRoot,
  runMain,
  stringFlag,
} from "./lib/env.mjs";

function parseNs(raw) {
  if (raw === undefined) return SCALE_NS;
  const ns = String(raw)
    .split(",")
    .map((s) => s.trim());
  if (!ns.length || ns.some((s) => !/^\d+$/.test(s)))
    throw new UsageError(
      `--ns must be a comma separated list of integers, got "${raw}"`,
    );
  return ns.map(Number);
}

runMain(async () => {
  const { flags } = parseArgs(process.argv.slice(2));
  const runs = intFlag(flags, "runs", 3, { min: 1, max: 50 });
  const out = stringFlag(flags, "out", "lighthouse/scale");
  const ns = parseNs(flags.ns);

  // Environment gate: if the first cell cannot even pass preflight, every cell would fail identically.
  for (const page of PAGES) await preflight(page, ns[0], "production");

  const cells = [];
  for (const n of ns) {
    for (const page of PAGES) {
      let summary;
      let file;
      try {
        const result = await measureNavigation({ page, n, runs, out });
        summary = result.summary;
        file = result.summaryFile;
      } catch (err) {
        const kind = err?.code ?? "UNEXPECTED";
        console.error(
          `[scale] ${page} n=${n}: ${kind}: ${err?.message ?? err}`,
        );
        summary = writeCellFailure({ page, n, out, attempted: runs, err });
      }
      cells.push({
        page,
        n,
        status: summary.status,
        valid: summary.valid,
        attempted: summary.attempted,
        codes: summary.errorCodes ?? [],
      });
      console.log(describeSummary(summary, file));
    }
  }

  console.log("\n[scale] cell        status   valid  codes");
  for (const c of cells) {
    console.log(
      `[scale] ${c.page.padEnd(6)} ${String(c.n).padStart(6)}  ${c.status.padEnd(8)} ${c.valid}/${c.attempted}  ${c.codes.join(",") || "-"}`,
    );
  }
  console.log(`[scale] results in ${relFromRoot(outRoot(out))}`);
  return 0;
});
