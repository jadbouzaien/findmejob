// Gabarit HTML commun à tous les CV (même style que les CV DevOps / Déploiement)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const photo = readFileSync(join(here, "photo.jpg")).toString("base64");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// **gras** dans les puces
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

export function render(cv) {
  const L = cv.labels;
  return `<!doctype html>
<html lang="${cv.lang}"><head><meta charset="utf-8"><title>${esc(cv.name)} — ${esc(cv.title)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 210mm; height: 297mm; padding: 8mm 10mm 6mm; font-family: "Inter", "Helvetica Neue", Arial, sans-serif; color: #2b3440; font-size: 8.2pt; line-height: 1.3; }
  header { display: grid; grid-template-columns: 26mm 1fr 26mm; align-items: center; }
  header img { width: 26mm; height: 26mm; object-fit: cover; border-radius: 3mm; }
  .id { text-align: center; }
  h1 { font-size: 20pt; color: #2c3e50; letter-spacing: -0.01em; font-weight: 700; }
  .title { font-size: 12pt; color: #2c3e50; font-weight: 600; margin-top: 1mm; }
  .tagline { color: #6b7684; font-size: 8.8pt; margin-top: 1mm; }
  .contact { text-align: center; font-size: 8.4pt; margin: 2.5mm 0 2mm; color: #2b3440; }
  hr { border: 0; border-top: 2px solid #2f4356; margin-bottom: 2.5mm; }
  .profile { background: #f2f4f7; border-radius: 2mm; padding: 2mm 3mm; font-size: 8.4pt; margin-bottom: 2.5mm; }
  .profile b { color: #2c3e50; }
  .cols { display: grid; grid-template-columns: 1fr 70mm; gap: 4.5mm; }
  h2 { background: #2f4356; color: #fff; font-size: 9pt; letter-spacing: 0.06em; padding: 1.2mm 3mm; margin-bottom: 1.6mm; text-transform: uppercase; }
  .job { padding-bottom: 1.3mm; margin-bottom: 1.3mm; border-bottom: 1px solid #e3e7ec; }
  .job:last-child { border-bottom: 0; }
  .job .role { font-weight: 700; font-size: 8.9pt; color: #2c3e50; }
  .job .co { color: #e5533d; font-weight: 600; }
  .job .dates { color: #8a93a0; font-style: italic; font-size: 7.8pt; }
  .job ul { margin: 0.5mm 0 0 3.4mm; }
  .job li { margin-bottom: 0.15mm; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.6mm; margin-bottom: 2.4mm; }
  .box { background: #f2f4f7; border-radius: 1.5mm; padding: 1.6mm 2.2mm; }
  .box.full { grid-column: 1 / -1; }
  .box b { display: block; color: #2c3e50; font-size: 8.8pt; margin-bottom: 0.6mm; }
  .box span { font-size: 7.9pt; color: #4a5562; }
  .proj { margin-bottom: 1.3mm; padding-bottom: 1.2mm; border-bottom: 1px solid #e3e7ec; }
  .proj:last-child { border-bottom: 0; }
  .proj b { color: #2c3e50; display: block; }
  .proj span { font-size: 7.9pt; color: #4a5562; }
  .edu { margin-bottom: 2mm; }
  .edu b { color: #2c3e50; display: block; }
  .edu .school { color: #e5533d; }
  .edu .yrs { color: #8a93a0; }
  .certs { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5mm; margin-bottom: 2mm; }
  .certs div { background: #f2f4f7; border-radius: 1.5mm; padding: 1.5mm; text-align: center; font-size: 8.2pt; }
  .langs div { font-size: 8.4pt; }
  section { margin-bottom: 2.4mm; }
</style></head>
<body>
  <header>
    <img src="data:image/jpeg;base64,${photo}" alt="">
    <div class="id">
      <h1>${esc(cv.name)}</h1>
      <div class="title">${esc(cv.title)}</div>
      <div class="tagline">${esc(cv.tagline)}</div>
    </div>
    <div></div>
  </header>
  <div class="contact">${cv.contact.map(esc).join(" &nbsp;·&nbsp; ")}</div>
  <hr>
  <div class="profile"><b>${esc(L.profile)} :</b> ${rich(cv.profile)}</div>
  <div class="cols">
    <div>
      <h2>${esc(L.experience)}</h2>
      ${cv.experience
        .map(
          (j) => `<div class="job">
        <div class="role">${esc(j.role)}</div>
        <div class="co">${esc(j.company)}</div>
        <div class="dates">${esc(j.dates)}</div>
        <ul>${j.bullets.map((b) => `<li>${rich(b)}</li>`).join("")}</ul>
      </div>`,
        )
        .join("")}
    </div>
    <div>
      <h2>${esc(L.skills)}</h2>
      <div class="grid">
        ${cv.skills.map((s) => `<div class="box${s.full ? " full" : ""}"><b>${esc(s.title)}</b><span>${esc(s.items)}</span></div>`).join("")}
      </div>
      ${cv.projects?.length ? `<section>
        <h2>${esc(L.projects)}</h2>
        ${cv.projects.map((p) => `<div class="proj"><b>${esc(p.name)}</b><span>${esc(p.desc)}</span></div>`).join("")}
      </section>` : ""}
      <section>
        <h2>${esc(L.education)}</h2>
        ${cv.education.map((e) => `<div class="edu"><b>${esc(e.degree)}</b><span class="school">${esc(e.school)}</span> <span class="yrs">· ${esc(e.years)}</span></div>`).join("")}
      </section>
      <section>
        <h2>${esc(L.certs)}</h2>
        <div class="certs">${cv.certs.map((c) => `<div>${esc(c)}</div>`).join("")}</div>
        <div class="langs">${cv.languages.map(([k, v]) => `<div><b>${esc(k)} :</b> ${esc(v)}</div>`).join("")}</div>
      </section>
    </div>
  </div>
</body></html>`;
}
