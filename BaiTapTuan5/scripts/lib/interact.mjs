import { nextPaint, waitGone, waitVisible } from "./waits.mjs";

export async function firstRowId(page) {
  const id = await page.evaluate(
    () =>
      document.querySelector("#product-table [data-row-id]")?.dataset.rowId ??
      null,
  );
  if (id === null)
    throw new Error(
      "No [data-row-id] row found in #product-table (is n = 0?).",
    );
  return id;
}

/** Click "edit" on a row (default: first rendered row) and wait for the dialog. Returns the row id. */
export async function openEdit(page, rowId) {
  const id = rowId ?? (await firstRowId(page));
  await page.click(
    `#product-table [data-row-id="${id}"] button[data-action="edit"]`,
  );
  await waitVisible(page, "#edit-form");
  return id;
}

/** Replace the content of an input by keyboard (works for controlled React inputs) and verify it. */
export async function setField(page, selector, value) {
  const text = String(value);
  await page.focus(selector);
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyA");
  await page.keyboard.up("Control");
  if (text === "") await page.keyboard.press("Backspace");
  else await page.keyboard.type(text);
  const actual = await page.$eval(selector, (el) => el.value);
  if (actual !== text)
    throw new Error(
      `Input ${selector} holds ${JSON.stringify(actual)} after typing ${JSON.stringify(text)}.`,
    );
}

export function readField(page, selector) {
  return page.$eval(selector, (el) => el.value);
}

export function submitEdit(page) {
  return page.click('#edit-form button[type="submit"]');
}

/** Cancel the dialog and wait until it is unmounted. */
export async function cancelEdit(page) {
  await page.click('#edit-form button[data-action="cancel"]');
  await waitGone(page, "#edit-form");
  await nextPaint(page);
}

/**
 * After an invalid submit: the dialog must still be open and `field` (e.g. "price") must be
 * aria-invalid and describe itself with a non-empty message. Returns that message.
 */
export async function readFieldError(page, field) {
  return page.evaluate((name) => {
    if (!document.querySelector("#edit-form")) return { open: false };
    const input = document.querySelector(`#edit-${name}`);
    if (!input) return { open: true, invalid: false, message: "" };
    const describedBy = input.getAttribute("aria-describedby");
    const message = describedBy
      ? (document.getElementById(describedBy)?.textContent ?? "").trim()
      : "";
    return {
      open: true,
      invalid: input.getAttribute("aria-invalid") === "true",
      describedBy,
      message,
    };
  }, field);
}

export async function selectTab(page, tab) {
  await page.click(`#tab-${tab}`);
  await nextPaint(page);
}
