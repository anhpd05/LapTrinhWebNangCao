export const APPLIED_TIMEOUT_MS = 60_000;

/** Two animation frames: the browser has painted what React committed. */
export function nextPaint(page) {
  return page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

export function readApplied(page) {
  return page.evaluate(() => {
    const el = document.querySelector("#result-count");
    const main = document.querySelector("main#app");
    return {
      resultCount: el ? { ...el.dataset } : null,
      main: main ? { ...main.dataset } : null,
      rows: document.querySelectorAll("#product-table [data-row-id]").length,
    };
  });
}

function describeState(state) {
  return JSON.stringify(state);
}

async function waitFor(page, label, expectation, predicate, timeout) {
  try {
    await page.waitForFunction(
      predicate,
      { timeout, polling: 100 },
      expectation,
    );
  } catch (err) {
    if (err?.name !== "TimeoutError") throw err;
    let current;
    try {
      current = describeState(await readApplied(page));
    } catch (inner) {
      current = `unreadable (${inner?.message})`;
    }
    throw new Error(
      `${label} timed out after ${timeout} ms. Expected ${describeState(expectation)}; current ${current}`,
    );
  }
  await nextPaint(page);
}

/**
 * Wait until the page's initial list is committed: `main#app[data-checksum]` is set and
 * `#result-count` shows every product (`data-count == main data-n`) with a revision.
 */
export async function waitInitial(page, { timeout = APPLIED_TIMEOUT_MS } = {}) {
  await waitFor(
    page,
    "waitInitial",
    {},
    () => {
      const main = document.querySelector("main#app");
      const el = document.querySelector("#result-count");
      if (!main || !el) return false;
      if (!main.dataset.checksum || main.dataset.n === undefined) return false;
      const d = el.dataset;
      return d.revision !== undefined && d.count === main.dataset.n;
    },
    timeout,
  );
  return page.evaluate(() => {
    const d = document.querySelector("main#app").dataset;
    return {
      page: d.page,
      buildMode: d.buildMode,
      n: Number(d.n),
      checksum: d.checksum,
    };
  });
}

/**
 * Wait for the applied state. Only the provided keys are compared:
 *   query, category, sort : must equal #result-count data-query / data-category / data-sort
 *   count                 : data-count must equal this number
 *   minRevision           : data-revision must be >= this number
 * When `sort` is price-/name- ordered, the first rows of #product-table must really be ordered.
 */
export async function waitApplied(
  page,
  {
    query,
    category,
    sort,
    count,
    minRevision,
    timeout = APPLIED_TIMEOUT_MS,
  } = {},
) {
  const expectation = { query, category, sort, count, minRevision };
  await waitFor(
    page,
    "waitApplied",
    expectation,
    (exp) => {
      const el = document.querySelector("#result-count");
      if (!el) return false;
      const d = el.dataset;
      if (exp.query !== undefined && d.query !== exp.query) return false;
      if (exp.category !== undefined && d.category !== exp.category)
        return false;
      if (exp.sort !== undefined && d.sort !== exp.sort) return false;
      if (exp.count !== undefined && d.count !== String(exp.count))
        return false;
      if (
        exp.minRevision !== undefined &&
        !(Number(d.revision) >= exp.minRevision)
      )
        return false;
      const sort = exp.sort;
      if (sort && sort !== "none") {
        const rows = [
          ...document.querySelectorAll("#product-table [data-row-id]"),
        ].slice(0, 10);
        const collator = new Intl.Collator("vi");
        for (let i = 1; i < rows.length; i++) {
          const a = rows[i - 1].dataset;
          const b = rows[i].dataset;
          let cmp;
          if (sort.startsWith("price")) cmp = Number(a.price) - Number(b.price);
          else cmp = collator.compare(a.name ?? "", b.name ?? "");
          if (sort.endsWith("-desc")) cmp = -cmp;
          if (cmp > 0) return false;
        }
      }
      return true;
    },
    timeout,
  );
}

/** Wait until `selector` is absent (e.g. the edit dialog unmounted after save / cancel). */
export async function waitGone(
  page,
  selector,
  { timeout = APPLIED_TIMEOUT_MS } = {},
) {
  await waitFor(
    page,
    `waitGone(${selector})`,
    { selector },
    (exp) => !document.querySelector(exp.selector),
    timeout,
  );
}

/** Wait until `selector` exists and has a non-empty box. */
export async function waitVisible(
  page,
  selector,
  { timeout = APPLIED_TIMEOUT_MS } = {},
) {
  await waitFor(
    page,
    `waitVisible(${selector})`,
    { selector },
    (exp) => {
      const el = document.querySelector(exp.selector);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    },
    timeout,
  );
}
