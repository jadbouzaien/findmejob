// Génère les CV en HTML puis PDF (Chrome headless).  Usage : npm run cv
import { writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { render } from "./template.mjs";
import { ALL } from "./data.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "..");
const htmlDir = join(here, "html");
mkdirSync(htmlDir, { recursive: true });

const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

for (const cv of ALL) {
  const html = join(htmlDir, `${cv.file}.html`);
  const pdf = join(out, `${cv.file}.pdf`);
  writeFileSync(html, render(cv));
  execFileSync(CHROME, ["--headless", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${pdf}`, `file://${html}`], {
    stdio: "ignore",
  });
  console.log(`✓ ${cv.file}.pdf`);
}
