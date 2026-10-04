import * as chromeLauncher from "chrome-launcher";
import puppeteer from "puppeteer-core";
import { CHROME_PATH } from "./env.mjs";

const cleanups = new Set();
let signalsInstalled = false;

function installSignalHandlers() {
  if (signalsInstalled) return;
  signalsInstalled = true;
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, async () => {
      await Promise.allSettled([...cleanups].map((fn) => fn()));
      process.exit(130);
    });
  }
}

function track(fn) {
  installSignalHandlers();
  cleanups.add(fn);
  return () => cleanups.delete(fn);
}

/** chrome-launcher instance for Lighthouse navigation runs. Only kills the PID it started. */
export async function launchChrome() {
  const chrome = await chromeLauncher.launch({
    chromePath: CHROME_PATH,
    chromeFlags: [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
    ],
    logLevel: "silent",
  });
  const untrack = track(() => killChrome(chrome));
  chrome.__untrack = untrack;
  return chrome;
}

export async function killChrome(chrome) {
  if (!chrome) return;
  chrome.__untrack?.();
  try {
    await Promise.resolve(chrome.kill());
  } catch (err) {
    console.warn(
      `[warn] failed to kill Chrome pid ${chrome.pid}: ${err?.message ?? err}`,
    );
  }
}

/** puppeteer-core browser on the real Chrome install. */
export async function launchBrowser() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    protocolTimeout: 600_000,
    args: ["--no-first-run", "--no-default-browser-check", "--disable-gpu"],
  });
  const untrack = track(() => browser.close());
  browser.__untrack = untrack;
  return browser;
}

export async function closeBrowser(browser) {
  if (!browser) return;
  browser.__untrack?.();
  try {
    await browser.close();
  } catch (err) {
    console.warn(`[warn] failed to close browser: ${err?.message ?? err}`);
    try {
      browser.process()?.kill("SIGKILL");
    } catch {
      // nothing more to do
    }
  }
}

export const MOBILE_VIEWPORT = {
  width: 412,
  height: 823,
  deviceScaleFactor: 1,
};
export const DESKTOP_VIEWPORT = {
  width: 1280,
  height: 800,
  deviceScaleFactor: 1,
};

/** Chrome major.minor from a user agent string, or null. */
export function chromeVersionFromUA(userAgent) {
  const m = /Chrome\/([\d.]+)/.exec(userAgent ?? "");
  return m ? m[1] : null;
}
