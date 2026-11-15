// End-to-end check of the spike. Needs the remote on :4001 and the host running.
// Uses your installed Google Chrome (playwright-core, no browser download).
//   HOST=http://localhost:3000 npm run check
import { chromium } from "playwright-core";

const HOST = process.env.HOST ?? "http://localhost:3000";
const failures = [];
const expect = (ok, msg) => (ok ? console.log(`  ✓ ${msg}`) : (failures.push(msg), console.log(`  ✗ ${msg}`)));

// 1. Server-only checks (raw HTML, no JS).
console.log("server HTML");
const rscHtml = await (await fetch(`${HOST}/rsc`)).text();
expect(rscHtml.includes('data-testid="server-safe"'), "/rsc: remote ServerSafe rendered inside an RSC");
const clientHtml = await (await fetch(`${HOST}/client`)).text();
expect(/data-testid="count">5</.test(clientHtml), "/client: remote Counter SSR'd with start=5");
const broken = await fetch(`${HOST}/broken`);
expect(broken.status === 500, `/broken: hook-using remote in RSC fails (got ${broken.status})`);

// 2. Browser: hydration, interactivity, request count, client-side navigation.
console.log("browser");
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const remoteReqs = [];
page.on("request", (r) => r.url().includes(":4001") && remoteReqs.push(r.url()));

await page.goto(`${HOST}/client`, { waitUntil: "load" });
await page.waitForResponse((r) => r.url().includes("src_Counter_jsx"), { timeout: 15_000 }).catch(() => {});
await page.waitForTimeout(500); // let hydration commit
await page.click("text=increment");
await page.click("text=increment");
const count = await page.textContent('[data-testid="count"]');
expect(count === "7", `/client: hydrated and interactive (5 + 2 clicks = ${count})`);
expect(remoteReqs.length === 2, `/client: exactly 2 remote requests, no load loop (got ${remoteReqs.length})`);

remoteReqs.length = 0;
await page.click('a[href="/rsc"]');
await page.waitForSelector('[data-testid="server-safe"]');
expect(remoteReqs.length === 0, `client nav to /rsc loads no remote JS (got ${remoteReqs.length})`);
expect(errors.length === 0, `no uncaught page errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
await browser.close();

console.log(failures.length ? `\n${failures.length} check(s) failed` : "\nall checks passed");
process.exit(failures.length ? 1 : 0);
