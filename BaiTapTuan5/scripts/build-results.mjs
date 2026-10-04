import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  DEFAULT_N,
  DIST_DIR,
  PAGES,
  ROOT,
  PROFILER_SCENARIOS,
  REQUIRED_SHOTS,
  SCALE_NS,
  intFlag,
  nDir,
  outRoot,
  pageDir,
  parseArgs,
  readJson,
  relFromRoot,
  runMain,
  shotPath,
  shotsManifestPath,
  stringFlag,
} from "./lib/env.mjs";
import { buildHash, sourceHash } from "./lib/identity.mjs";

const REQUIRED_VALID_RUNS = 5;
const METRIC_ROWS = [
  {
    key: "score",
    label: "Performance score",
    fmt: (v) => `${v}`,
    higherIsBetter: true,
  },
  { key: "FCP", label: "FCP", fmt: ms },
  { key: "LCP", label: "LCP", fmt: ms },
  { key: "TBT", label: "TBT", fmt: ms },
  { key: "CLS", label: "CLS", fmt: (v) => v.toFixed(3) },
  { key: "SI", label: "Speed Index", fmt: ms },
];

function ms(v) {
  return `${Math.round(v).toLocaleString("en-US")} ms`;
}
function kib(v) {
  return `${(v / 1024).toFixed(1)} KiB`;
}
function int(v) {
  return Math.round(v).toLocaleString("en-US");
}
const finite = (v) => typeof v === "number" && Number.isFinite(v);
const short = (h) => (typeof h === "string" ? h.slice(0, 12) : String(h));
const table = (head, rows) =>
  [
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");

function change(before, after, fmt) {
  if (!finite(before) || !finite(after)) return ["n/a", "n/a"];
  const diff = after - before;
  const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
  const pct =
    before === 0
      ? "—"
      : `${diff > 0 ? "+" : diff < 0 ? "-" : ""}${Math.abs((diff / before) * 100).toFixed(1)}%`;
  return [`${sign}${fmt(Math.abs(diff))}`, pct];
}

runMain(async () => {
  const { flags } = parseArgs(process.argv.slice(2));
  const out = stringFlag(flags, "out", undefined);
  const roots = {
    before: stringFlag(flags, "before-out", out),
    after: stringFlag(flags, "after-out", out),
  };
  const scaleOut = stringFlag(flags, "scale-out", "lighthouse/scale");
  const n = intFlag(flags, "n", DEFAULT_N, { min: 1 });

  const problems = [];
  const warnings = [];
  const problem = (msg) => problems.push(msg);
  const warn = (msg) => warnings.push(msg);

  const load = (label, file, { required = true } = {}) => {
    if (!existsSync(file)) {
      if (required) problem(`Missing artifact ${relFromRoot(file)} (${label})`);
      return null;
    }
    try {
      return readJson(file);
    } catch (err) {
      problem(`Cannot parse ${relFromRoot(file)}: ${err?.message}`);
      return null;
    }
  };
  const needFile = (label, file) => {
    if (!existsSync(file))
      problem(`Missing artifact ${relFromRoot(file)} (${label})`);
  };

  // ---------- current identity ----------
  const currentSource = {};
  const currentDist = {};
  for (const page of PAGES) {
    try {
      currentSource[page] = sourceHash(page);
    } catch (err) {
      problem(`Cannot compute sourceHash(${page}): ${err?.message}`);
    }
    try {
      currentDist[page] = buildHash(page, DIST_DIR);
    } catch (err) {
      currentDist[page] = null;
      if (page === "after")
        problem(`Cannot compute buildHash(after) from dist: ${err?.message}`);
    }
  }

  // ---------- load ----------
  const S = {}; // summary
  const FL = {}; // flow-summary
  const PR = {}; // profiler
  const A11 = {}; // a11y
  const CH = {}; // chunks
  const SH = {}; // shots manifest
  for (const page of PAGES) {
    const dir = pageDir(roots[page], page);
    S[page] = load(
      `${page} navigation summary`,
      path.join(nDir(roots[page], page, n), "summary.json"),
    );
    FL[page] = load(
      `${page} flow summary`,
      path.join(dir, "flow-summary.json"),
    );
    PR[page] = load(`${page} profiler`, path.join(dir, "profiler.json"));
    A11[page] = load(`${page} accessibility`, path.join(dir, "a11y.json"));
    CH[page] = load(`${page} chunks`, path.join(dir, "chunks.json"));
    SH[page] = load(
      `${page} screenshots manifest`,
      shotsManifestPath(roots[page], page),
    );
    needFile(
      `${page} median report`,
      path.join(nDir(roots[page], page, n), "median.report.html"),
    );
    needFile(`${page} flow report`, path.join(dir, "flow.report.html"));
  }

  // ---------- validation per page ----------
  const stale = [];
  const checkSource = (label, doc, page) => {
    if (!doc) return;
    if (!doc.sourceHash) problem(`${label}: sourceHash missing`);
    else if (currentSource[page] && doc.sourceHash !== currentSource[page]) {
      stale.push(
        `${label}: sourceHash ${short(doc.sourceHash)} != current ${short(currentSource[page])}`,
      );
    }
  };
  const checkBuild = (label, doc, page) => {
    if (!doc || !S[page]?.buildHash) return;
    if (!doc.buildHash) problem(`${label}: buildHash missing`);
    else if (doc.buildHash !== S[page].buildHash) {
      const msg = `${label}: buildHash ${short(doc.buildHash)} != measured ${short(S[page].buildHash)}`;
      // The baseline dist may legitimately be rebuilt once the after page exists; the code (sourceHash) is what must not move.
      if (page === "after")
        problem(`${msg} (STALE: results come from different builds)`);
      else
        warn(
          `${msg} (before build layout changed since baseline; same sourceHash)`,
        );
    }
  };

  for (const page of PAGES) {
    const s = S[page];
    if (s) {
      if (s.status === "failed" || s.valid < REQUIRED_VALID_RUNS) {
        problem(
          `${page} n=${n}: valid runs ${s.valid}/${s.attempted} (status ${s.status}${s.errorCodes?.length ? `, codes ${s.errorCodes.join(",")}` : ""}); ${REQUIRED_VALID_RUNS} valid runs required`,
        );
      }
      for (const key of [
        "score",
        "FCP",
        "LCP",
        "TBT",
        "CLS",
        "SI",
        "totalBytes",
        "domElements",
        "benchmarkIndex",
      ]) {
        if (!finite(s[key])) problem(`${page} summary: ${key} is not a number`);
      }
      if (!finite(s.unusedJsBytes))
        warn(
          `${page} summary: unusedJsBytes not reported by Lighthouse (audit absent or not applicable)`,
        );
      for (const key of [
        "checksum",
        "lighthouseVersion",
        "chromeVersion",
        "nodeVersion",
        "fetchTime",
        "sourceHash",
        "buildHash",
        "medianFile",
      ]) {
        if (!s[key]) problem(`${page} summary: ${key} missing`);
      }
      if (s.dataN !== undefined && s.dataN !== null && s.dataN !== n)
        problem(
          `${page} summary: page reported data-n=${s.dataN}, expected ${n}`,
        );
      checkSource(`${page}/n${n}/summary.json`, s, page);
    }

    const c = CH[page];
    if (c) {
      if (!c.ok)
        problem(`${page} chunks.json: ${c.problems?.join("; ") || "not ok"}`);
      checkSource(`${page}/chunks.json`, c, page);
      checkBuild(`${page}/chunks.json`, c, page);
      if (!finite(c.initialJsGzipBytes))
        problem(`${page} chunks.json: initialJsGzipBytes missing`);
    }

    const f = FL[page];
    if (f) {
      if (f.status !== "ok")
        problem(
          `${page} flow-summary.json: status ${f.status} (${f.problems?.join("; ") ?? ""})`,
        );
      checkSource(`${page}/flow-summary.json`, f, page);
      checkBuild(`${page}/flow-summary.json`, f, page);
      if (S[page]?.checksum && f.checksum !== S[page].checksum)
        problem(
          `${page} flow-summary.json: checksum ${f.checksum} != summary ${S[page].checksum}`,
        );
    }

    const p = PR[page];
    if (p) {
      if (p.status !== "ok")
        problem(`${page} profiler.json: status ${p.status}`);
      for (const key of PROFILER_SCENARIOS) {
        const sc = p.scenarios?.[key];
        if (!sc) problem(`${page} profiler.json: scenario (${key}) missing`);
        else if (sc.status !== "ok")
          problem(
            `${page} profiler.json: scenario (${key}) ${sc.status}: ${sc.message ?? ""}`,
          );
        else if (
          !sc.screenshot ||
          !existsSync(path.resolve(ROOT, sc.screenshot))
        ) {
          problem(
            `${page} profiler.json: scenario (${key}) screenshot ${sc.screenshot ?? "(none)"} not found`,
          );
        }
      }
      checkSource(`${page}/profiler.json`, p, page);
      if (!p.buildHash) problem(`${page}/profiler.json: buildHash missing`);
      if (S[page]?.checksum && p.checksum !== S[page].checksum)
        problem(
          `${page} profiler.json: checksum ${p.checksum} != summary ${S[page].checksum}`,
        );
    }

    const a = A11[page];
    if (a) {
      if (a.status !== "ok" || !finite(a.score))
        problem(
          `${page} a11y.json: status ${a.status} ${a.code ?? ""} ${a.message ?? ""}`,
        );
      checkSource(`${page}/a11y.json`, a, page);
      checkBuild(`${page}/a11y.json`, a, page);
    }

    const m = SH[page];
    if (m) {
      if (m.status !== "ok")
        problem(
          `${page} screenshots manifest: status ${m.status}, missing ${m.missing?.join(", ")}`,
        );
      checkSource(`${page} screenshots manifest`, m, page);
      checkBuild(`${page} screenshots manifest`, m, page);
      if (S[page] && m.reportFetchTime !== S[page].fetchTime)
        problem(
          `${page} screenshots: taken from a report with fetchTime ${m.reportFetchTime}, summary is ${S[page].fetchTime} (STALE images)`,
        );
      if (FL[page] && m.flowFetchTime !== FL[page].fetchTime)
        problem(
          `${page} screenshots: taken from a flow report with fetchTime ${m.flowFetchTime}, flow-summary is ${FL[page].fetchTime} (STALE images)`,
        );
      if (S[page]?.checksum && m.app?.checksum !== S[page].checksum)
        problem(
          `${page} screenshots: app checksum ${m.app?.checksum} != summary ${S[page].checksum}`,
        );
    }
    for (const name of REQUIRED_SHOTS) {
      const file = shotPath(roots[page], page, name);
      if (!existsSync(file))
        problem(`Missing mandatory image ${relFromRoot(file)}`);
    }
  }

  // build identity against what is on disk / snapshot
  if (
    S.after?.buildHash &&
    currentDist.after &&
    S.after.buildHash !== currentDist.after
  ) {
    stale.push(
      `after: measured buildHash ${short(S.after.buildHash)} != dist/after.html build ${short(currentDist.after)}`,
    );
  }
  const snapshotDir = path.join(
    pageDir(roots.before, "before"),
    "build-snapshot",
  );
  let snapshotHash = null;
  if (!existsSync(path.join(snapshotDir, "snapshot.json"))) {
    problem(
      `Missing artifact ${relFromRoot(snapshotDir)}/snapshot.json (npm run snapshot:before)`,
    );
  } else {
    try {
      snapshotHash = buildHash("before", snapshotDir);
      const recorded = readJson(
        path.join(snapshotDir, "snapshot.json"),
      ).buildHash;
      if (recorded !== snapshotHash)
        problem(
          `before build-snapshot was modified: recorded ${short(recorded)}, actual ${short(snapshotHash)}`,
        );
      if (S.before?.buildHash && S.before.buildHash !== snapshotHash)
        problem(
          `before build-snapshot ${short(snapshotHash)} != measured buildHash ${short(S.before.buildHash)}`,
        );
    } catch (err) {
      problem(`before build-snapshot is incomplete: ${err?.message}`);
    }
  }

  // checksum parity
  if (
    S.before?.checksum &&
    S.after?.checksum &&
    S.before.checksum !== S.after.checksum
  ) {
    problem(
      `checksum differs: before ${S.before.checksum} vs after ${S.after.checksum}`,
    );
  }

  // ---------- scale ----------
  const scale = {};
  for (const sn of SCALE_NS) {
    for (const page of PAGES) {
      const doc = load(
        `scale ${page} n=${sn}`,
        path.join(nDir(scaleOut, page, sn), "summary.json"),
      );
      scale[`${page}:${sn}`] = doc;
      if (!doc) continue;
      if (doc.sourceHash) {
        if (currentSource[page] && doc.sourceHash !== currentSource[page])
          stale.push(
            `scale ${page} n=${sn}: sourceHash ${short(doc.sourceHash)} != current ${short(currentSource[page])}`,
          );
      } else if (doc.status !== "failed") {
        problem(`scale ${page} n=${sn}: sourceHash missing`);
      }
      if (doc.status === "failed" && !doc.errorCodes?.length)
        problem(`scale ${page} n=${sn}: failed without error code`);
    }
    const b = scale[`before:${sn}`];
    const a = scale[`after:${sn}`];
    if (b?.checksum && a?.checksum && b.checksum !== a.checksum)
      problem(
        `scale n=${sn}: checksum differs: before ${b.checksum} vs after ${a.checksum}`,
      );
    for (const page of PAGES) {
      const doc = scale[`${page}:${sn}`];
      if (
        sn === n &&
        doc?.checksum &&
        S[page]?.checksum &&
        doc.checksum !== S[page].checksum
      ) {
        problem(
          `scale ${page} n=${sn}: checksum ${doc.checksum} != main summary ${S[page].checksum}`,
        );
      }
    }
  }
  if (A11.before && A11.after && A11.before.n !== A11.after.n) {
    problem(
      `Accessibility comparisons require equal n: before ${A11.before.n}, after ${A11.after.n}`,
    );
  }
  const originalA11y = PAGES.map((page) =>
    load(
      `${page} accessibility n10000`,
      path.join(pageDir(roots[page], page), "a11y-n10000.json"),
      { required: false },
    ),
  );

  for (const msg of stale) problem(`STALE: ${msg}`);

  // ---------- acceptance criteria (reported, not part of integrity exit code) ----------
  const criteria = [];
  const criterion = (label, ok, detail) => {
    criteria.push({ label, ok, detail });
    if (ok === false) warn(`Criterion not met: ${label} (${detail})`);
  };
  if (finite(S.before?.domElements))
    criterion(
      "Before DOM > 50,000 elements",
      S.before.domElements > 50000,
      int(S.before.domElements),
    );
  if (finite(S.after?.domElements))
    criterion(
      "After DOM < 1,500 elements",
      S.after.domElements < 1500,
      int(S.after.domElements),
    );
  if (finite(A11.before?.score) && finite(A11.after?.score))
    criterion(
      "Accessibility after >= before",
      A11.after.score >= A11.before.score,
      `${A11.before.score} -> ${A11.after.score} (n=${A11.before.n}, equal-size comparison)`,
    );
  const pa = (key) => [
    PR.before?.scenarios?.a?.perf?.[key],
    PR.after?.scenarios?.a?.perf?.[key],
  ];
  const [rowB, rowA] = pa("rowRender");
  if (finite(rowB) && finite(rowA))
    criterion(
      "Profiler (a): after rowRender < before",
      rowA < rowB,
      `${rowB} -> ${rowA}`,
    );
  const afterB = PR.after?.scenarios?.b?.perf;
  if (afterB)
    criterion(
      "Profiler (b): after generate = 0 and filterSort = 0",
      afterB.generate === 0 && afterB.filterSort === 0,
      `generate ${afterB.generate}, filterSort ${afterB.filterSort}`,
    );
  if (CH.before && CH.after)
    criterion(
      "Recharts eager in before, lazy only in after",
      CH.before.eagerHasRecharts === true &&
        CH.after.eagerHasRecharts === false &&
        CH.after.lazyHasRecharts === true,
      `before eager=${CH.before.eagerHasRecharts}; after eager=${CH.after.eagerHasRecharts}, lazy=${CH.after.lazyHasRecharts}`,
    );

  // ---------- results.md ----------
  const md = [];
  const valid = problems.length === 0;
  md.push(
    "# Kết quả đo Lighthouse (sinh tự động bởi `scripts/build-results.mjs`)",
    "",
  );
  md.push(
    `**Trạng thái kiểm tra: ${valid ? "HỢP LỆ" : `KHÔNG HỢP LỆ (${problems.length} vấn đề)`}**${stale.length ? " - có kết quả STALE" : ""}`,
    "",
  );
  if (problems.length) {
    md.push("## Vấn đề phát hiện", "", ...problems.map((p) => `- ${p}`), "");
  }
  if (warnings.length) {
    md.push("## Cảnh báo", "", ...warnings.map((w) => `- ${w}`), "");
  }

  const both = (fn) =>
    PAGES.map((page) => (S[page] ? fn(S[page], page) : "n/a"));

  md.push(
    "## Môi trường đo",
    "",
    "Lấy từ `summary.json` của median run, không lấy lúc sinh file.",
    "",
  );
  md.push(
    table(
      ["Mục", "Before", "After"],
      [
        ["Lighthouse", ...both((s) => s.lighthouseVersion)],
        ["Chrome", ...both((s) => s.chromeVersion)],
        ["Node", ...both((s) => s.nodeVersion)],
        [
          "benchmarkIndex",
          ...both((s) =>
            finite(s.benchmarkIndex) ? Math.round(s.benchmarkIndex) : "n/a",
          ),
        ],
        ["Form factor", ...both((s) => s.formFactor)],
        [
          "Throttling",
          ...both(
            (s) =>
              `${s.throttlingMethod} (${s.throttling ? `RTT ${s.throttling.rttMs} ms, ${s.throttling.throughputKbps} Kbps, CPU x${s.throttling.cpuSlowdownMultiplier}` : "n/a"})`,
          ),
        ],
        [
          "Số run hợp lệ / đã chạy",
          ...both((s) => `${s.valid}/${s.attempted}`),
        ],
        ["fetchTime (median)", ...both((s) => s.fetchTime)],
        [
          "Run đầu - run cuối",
          ...both((s) => `${s.firstFetchTime} - ${s.lastFetchTime}`),
        ],
        ["n / checksum dữ liệu", ...both((s) => `${s.n} / \`${s.checksum}\``)],
      ],
    ),
    "",
  );

  md.push(
    "## Bảng chính (navigation, Lighthouse Mobile, median)",
    "",
    "Ô before/after: median (min - max trong các run hợp lệ). Chênh lệch = after - before.",
    "",
  );
  const mainRows = [];
  for (const row of METRIC_ROWS) {
    const cell = (s) =>
      s && finite(s[row.key])
        ? `${row.fmt(s[row.key])} (${row.fmt(s.min[row.key])} - ${row.fmt(s.max[row.key])})`
        : "n/a";
    const [d, pct] = change(S.before?.[row.key], S.after?.[row.key], row.fmt);
    mainRows.push([row.label, cell(S.before), cell(S.after), d, pct]);
  }
  const plainRow = (label, get, fmt) => {
    const b = get(S.before, CH.before);
    const a = get(S.after, CH.after);
    const [d, pct] = change(b, a, fmt);
    mainRows.push([
      label,
      finite(b) ? fmt(b) : "n/a",
      finite(a) ? fmt(a) : "n/a",
      d,
      pct,
    ]);
  };
  plainRow(
    "Số phần tử DOM (tự đếm, `document.body`)",
    (s) => s?.domElements,
    int,
  );
  plainRow(
    "Số phần tử DOM (Lighthouse `dom-size-insight`)",
    (s) => s?.domSizeInsight?.totalElements ?? s?.domSizeInsight?.numericValue,
    int,
  );
  plainRow("JS không dùng (`unused-javascript`)", (s) => s?.unusedJsBytes, kib);
  plainRow("Tổng byte tải (`total-byte-weight`)", (s) => s?.totalBytes, kib);
  plainRow("JS ban đầu (gzip)", (s, c) => c?.initialJsGzipBytes, kib);
  plainRow("JS ban đầu (chưa nén)", (s, c) => c?.initialJsBytes, kib);
  md.push(
    table(["Chỉ số", "Before", "After", "Chênh lệch", "%"], mainRows),
    "",
  );

  md.push("### Các run navigation", "");
  const runRows = [];
  for (const page of PAGES) {
    for (const r of S[page]?.runs ?? []) {
      runRows.push([
        page,
        r.index,
        r.status,
        r.code ?? "-",
        r.metrics ? `${r.metrics.score}` : "-",
        r.metrics ? ms(r.metrics.LCP) : "-",
        r.metrics ? ms(r.metrics.TBT) : "-",
        r.index === S[page].medianRunIndex ? "median" : "",
      ]);
    }
  }
  md.push(
    table(
      ["Trang", "Run", "Trạng thái", "Mã lỗi", "Score", "LCP", "TBT", ""],
      runRows,
    ),
    "",
  );

  md.push("### Truy vết (provenance)", "");
  md.push(
    table(
      ["Mục", "Before", "After"],
      [
        ["sourceHash", ...both((s) => `\`${s.sourceHash}\``)],
        ["buildHash", ...both((s) => `\`${s.buildHash}\``)],
        ["Median run", ...both((s) => s.medianFile)],
        [
          "Build snapshot (before)",
          snapshotHash ? `\`${snapshotHash}\`` : "n/a",
          "-",
        ],
      ],
    ),
    "",
  );

  md.push(
    "## Bảng `?n=` (3 lần mỗi ô)",
    "",
    "Ô lỗi không bị chạy lại để chọn số đẹp; `Mã lỗi` là mã Lighthouse/Node thật của các run không hợp lệ.",
    "",
  );
  const scaleRows = [];
  for (const sn of SCALE_NS) {
    for (const page of PAGES) {
      const d = scale[`${page}:${sn}`];
      if (!d) {
        scaleRows.push([
          int(sn),
          page,
          "n/a",
          "thiếu",
          "-",
          "-",
          "-",
          "-",
          "-",
          "-",
        ]);
        continue;
      }
      const codeCounts = {};
      for (const r of d.runs ?? [])
        if (r.code) codeCounts[r.code] = (codeCounts[r.code] ?? 0) + 1;
      const codes =
        Object.entries(codeCounts)
          .map(([c, k]) => `${c}x${k}`)
          .join(", ") ||
        (d.errorCodes ?? []).join(", ") ||
        "-";
      const has = d.status !== "failed";
      scaleRows.push([
        int(sn),
        page,
        `${d.valid}/${d.attempted}`,
        d.status,
        has ? `${d.score}` : "-",
        has ? ms(d.FCP) : "-",
        has ? ms(d.LCP) : "-",
        has ? ms(d.TBT) : "-",
        has && finite(d.domElements) ? int(d.domElements) : "-",
        codes,
      ]);
    }
  }
  md.push(
    table(
      [
        "n",
        "Trang",
        "Hợp lệ/đã chạy",
        "Trạng thái",
        "Score",
        "FCP",
        "LCP",
        "TBT",
        "DOM",
        "Mã lỗi",
      ],
      scaleRows,
    ),
    "",
  );

  md.push(
    '## Timespan (tìm "dien thoai" rồi sắp xếp giá)',
    "",
    FL.before?.note ?? FL.after?.note ?? "",
    "",
  );
  const tsRow = (label, key, fmt) => {
    const cell = (f) =>
      f && finite(f[key]?.value)
        ? `${fmt(f[key].value)} (${f[key].scoreDisplayMode})`
        : f
          ? `n/a (${f[key]?.scoreDisplayMode ?? "n/a"})`
          : "n/a";
    const [d, pct] = change(
      FL.before?.[key]?.value,
      FL.after?.[key]?.value,
      fmt,
    );
    return [label, cell(FL.before), cell(FL.after), d, pct];
  };
  md.push(
    table(
      ["Chỉ số", "Before", "After", "Chênh lệch", "%"],
      [
        tsRow("TBT (Timespan)", "TBT", ms),
        tsRow("CLS (Timespan)", "CLS", (v) => v.toFixed(3)),
        tsRow("INP", "INP", ms),
      ],
    ),
    "",
  );

  md.push("## Profiler (React `<Profiler>`, build profiling)", "");
  for (const key of PROFILER_SCENARIOS) {
    md.push(
      `- (${key}) ${PR.before?.scenarios?.[key]?.description ?? PR.after?.scenarios?.[key]?.description ?? ""}`,
    );
  }
  md.push("", "Không có ngưỡng đạt/không đạt; đây là số đo thực tế.", "");
  const prRows = [];
  const prRow = (label, key, field, fmt = int) => {
    const b = PR.before?.scenarios?.[key]?.perf?.[field];
    const a = PR.after?.scenarios?.[key]?.perf?.[field];
    const [d, pct] = change(b, a, fmt);
    prRows.push([
      label,
      finite(b) ? fmt(b) : "n/a",
      finite(a) ? fmt(a) : "n/a",
      d,
      pct,
    ]);
  };
  const rowsInDom = (label, key, field) => {
    const b = PR.before?.scenarios?.[key]?.[field];
    const a = PR.after?.scenarios?.[key]?.[field];
    prRows.push([
      label,
      finite(b) ? int(b) : "n/a",
      finite(a) ? int(a) : "n/a",
      "-",
      "-",
    ]);
  };
  rowsInDom("(a) số dòng đang render trong DOM", "a", "renderedRowsBefore");
  prRow("(a) `rowRender` sau khi sửa 1 sản phẩm", "a", "rowRender");
  prRow("(b) `generate` khi mở/huỷ form", "b", "generate");
  prRow("(b) `filterSort` khi mở/huỷ form", "b", "filterSort");
  prRow("(c) `App` commits", "c", "appCommits");
  prRow(
    "(c) `App` actualDuration tổng",
    "c",
    "appActualMs",
    (v) => `${v.toFixed(1)} ms`,
  );
  prRow(
    "(c) `App` actualDuration lớn nhất",
    "c",
    "appMaxMs",
    (v) => `${v.toFixed(1)} ms`,
  );
  md.push(table(["Số đo", "Before", "After", "Chênh lệch", "%"], prRows), "");

  md.push("## Accessibility (Lighthouse, mobile)", "");
  const a11yCell = (a) => (a && finite(a.score) ? `${a.score}` : "n/a");
  const failedCell = (a) =>
    a
      ? a.failedAudits
          .map((f) => `${f.id}${f.items !== null ? ` (${f.items})` : ""}`)
          .join(", ") || "không"
      : "n/a";
  md.push(
    table(
      ["Mục", "Before", "After"],
      [
        [
          "n (cùng quy mô so sánh)",
          A11.before?.n ?? "n/a",
          A11.after?.n ?? "n/a",
        ],
        ["Điểm", a11yCell(A11.before), a11yCell(A11.after)],
        ["Audit chưa đạt", failedCell(A11.before), failedCell(A11.after)],
      ],
    ),
    "",
  );
  if (originalA11y.some(Boolean)) {
    md.push(
      "### Accessibility ban đầu ở n=10.000",
      "",
      table(
        ["Trang", "n", "Trạng thái", "Điểm", "Mã lỗi"],
        PAGES.map((page, index) => {
          const a = originalA11y[index];
          return [
            page,
            a?.n ?? "n/a",
            a?.status ?? "n/a",
            a11yCell(a),
            a?.code ?? "-",
          ];
        }),
      ),
      "",
      `Bảng Accessibility so sánh ở trên dùng cùng n=${A11.before?.n ?? "n/a"} trên cả hai trang, cấu hình Lighthouse mặc định; không thay gatherer hoặc bỏ audit. Bản ghi ban đầu được giữ nguyên, kể cả lỗi timeout.`,
      "",
    );
  }

  md.push("## Tiêu chí chấp nhận (thông tin)", "");
  md.push(
    table(
      ["Tiêu chí", "Kết quả", "Chi tiết"],
      criteria.map((c) => [c.label, c.ok ? "ĐẠT" : "KHÔNG ĐẠT", c.detail]),
    ),
    "",
  );

  md.push("## Ảnh minh chứng bắt buộc", "");
  md.push(
    table(
      ["Ảnh", "Before", "After"],
      REQUIRED_SHOTS.map((name) => [
        name,
        ...PAGES.map((page) =>
          existsSync(shotPath(roots[page], page, name))
            ? relFromRoot(shotPath(roots[page], page, name))
            : "**THIẾU**",
        ),
      ]),
    ),
    "",
  );

  const file = path.join(outRoot(out), "results.md");
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${md.join("\n")}\n`);

  console.log(
    `[results] wrote ${relFromRoot(file)}: ${valid ? "VALID" : `INVALID (${problems.length} problems)`}, ${warnings.length} warnings`,
  );
  for (const w of warnings) console.warn(`[results] warn: ${w}`);
  for (const p of problems) console.error(`[results] FAIL ${p}`);
  return valid ? 0 : 1;
});
