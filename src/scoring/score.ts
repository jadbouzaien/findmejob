/**
 * Scoring déterministe (sans LLM), sur 100 :
 *   Titre        45  (titre très aligné 45 / compatible 25)
 *   Compétences  25  (somme des poids des compétences trouvées, plafonnée)
 *   Localisation 20  (Bouches-du-Rhône, hybride Toulon/Montpellier, remote Europe/monde)
 *   Salaire      10  (inconnu 5, ≥ plancher 7, ≥ bon salaire 10)
 *   − pénalités (stack non maîtrisée, niveau direction, expérience demandée, langue…)
 * Chaque offre est scorée pour chaque catégorie ; on garde la meilleure.
 */
import {
  TRACKS,
  LOCATIONS,
  REMOTE_OK_REGIONS,
  REMOTE_RESTRICTED,
  SALARY,
  GLOBAL_PENALTIES,
  HARD_EXCLUDE_TITLE,
  EXPERIENCE,
  SENIOR_TITLE,
  VERY_SENIOR_TITLE,
  LEAD_EXPERIENCE,
  VENDOR_ECOSYSTEMS,
  VENDOR_MENTION_PTS,
  EDUCATION,
  FRESHNESS,
  PRIORITY,
  type TrackId,
} from "../../config/profile";
import type { RawJob, WorkMode, Zone, SalaryPeriod } from "../lib/types";
import { stripAccents } from "../lib/text";

export interface ScoreDetails {
  titlePts: number;
  skillsPts: number;
  matchedSkills: string[];
  locationPts: number;
  locationNote: string;
  salaryPts: number;
  salaryNote: string;
  penalties: Array<{ label: string; pts: number }>;
  experienceYears: number | null;
  alternatives: Array<{ track: TrackId; score: number }>;
  partialDescription: boolean;
}

export interface ScoreResult {
  score: number;
  track: TrackId | null;
  trackLabel: string | null;
  cv: string | null;
  priority: "P1" | "P2" | "P3" | null;
  excluded: boolean;
  exclusionReason: string | null;
  workMode: WorkMode;
  zone: Zone;
  salaryMinEur: number | null;
  salaryMaxEur: number | null;
  details: ScoreDetails;
}

const anyRe = (list: readonly string[]) =>
  new RegExp(list.map((x) => `(?:^|[^a-z\u00e0-\u00ff])(?:${x})(?:[^a-z\u00e0-\u00ff]|$)`).join("|"), "i");
const STRICT_REMOTE_OK = /(worldwide|anywhere|global|europe|european|emea|\beu\b|france|\bcet\b|international)/i;
const HOME_RE = anyRe(LOCATIONS.home);
const NEAR_RE = anyRe(LOCATIONS.near);
const FRANCE_RE =
  /france|paris|lyon|lille|bordeaux|nantes|toulouse|nice|sophia|rennes|strasbourg|grenoble|[iî]le[- ]de[- ]france|hauts[- ]de[- ]seine|^\d{2} ?- |\b(75|92|93|94|69|33|31|44|59|06)\d{3}\b|provence|occitanie|auvergne|bretagne|normandie|nouvelle[- ]aquitaine/i;
const FOREIGN_RE =
  /united states|usa|\bus\b|u\.s\.|canada|united kingdom|\buk\b|england|london|germany|deutschland|berlin|munich|spain|madrid|barcelona|netherlands|amsterdam|ireland|dublin|poland|portugal|lisbon|india|bangalore|brazil|mexico|australia|japan|tokyo|singapore|sweden|stockholm|italy|milan|switzerland|zurich|belgium|brussels|austria|denmark|norway|finland|israel|tel aviv|korea|china|philippines|argentina|colombia|new york|san francisco|seattle|austin|boston|chicago|los angeles|denver|toronto|vancouver|\b(ca|ny|wa|tx|ma|co|il|ga|fl)\b(,|$)/i;

/** Région étrangère citée dans le TITRE ("TCSM - Americas", "Federal Solutions Architect"…) */
const TITLE_FOREIGN_REGION =
  /(^|[^a-z])(americas|amer|namer|north america|us|usa|united states|canada|latam|apac|anz|uk|united kingdom|japan|india|australia|singapore|brazil|mexico|germany|dach|nordics|benelux|spain|italy|federal|fedramp|public sector|us gov(ernment)?)([^a-z]|$)/i;

const REMOTE_RE =
  /\b(full[- ]?remote|fully remote|100 ?% (remote|t[ée]l[ée]travail)|remote[- ]first|work from anywhere|t[ée]l[ée]travail (total|complet|int[ée]gral|100)|en remote|remote)\b/i;
const HYBRID_RE =
  /\b(hybrid|hybride|t[ée]l[ée]travail partiel|\d ?jours? (de )?t[ée]l[ée]travail|t[ée]l[ée]travail \d ?jours?|remote partiel|flex office|partial remote)\b/i;

/** Présence obligatoire au bureau mentionnée dans la description */
const N = "(\\d|one|two|three|un|une|deux|trois)";
/** Remote partiel / présence au bureau imposée → hybride */
const OFFICE_DAYS_RE = new RegExp(
  [
    `\\b${N} ?(à ${N} )?jours? (par semaine |\\/ ?semaine )?(sur site|au bureau|en pr[ée]sentiel|dans nos locaux)`,
    `\\b${N} ?days? (a|per|each) week (in|at|from) (the |our )?office`,
    `\\b${N} (remote|wfh|home ?office) days?`,
    `\\b${N} days? (of )?(remote|wfh|work from home|home ?office)( work)?( per| a| each)? ?(week)?`,
    `\\b${N} ?jours? (de )?t[ée]l[ée]travail`,
    `\\bt[ée]l[ée]travail ?:? ?(de )?${N}( ?(à|-|ou) ?${N})? ?jours?`,
    `\\b${N} days? (at|in) (the |our )?office`,
    `\\bbased ${N} days? (at|in)`,
    `\\bt[ée]l[ée]travail (partiel|${N} ?jours?)`,
    `\\boffice[- ]first\\b`,
    // remote "accepté" mais pas la règle
    `\\bremote[- ]friendly\\b`,
    `\\b${N} (months?|weeks?|mois|semaines?) (per|a|par|each|chaque) (year|an|ann[ée]e)`,
    `\\bsome (positions|roles|jobs) (can|may) (even )?be (fully )?remote`,
    `\\bcertains postes (peuvent|sont) (m[eê]me )?(être )?(en )?(full|100 ?%)? ?(remote|t[ée]l[ée]travail)`,
    `\\bhybride\\b`,
    `\\bhybrid (work|model|role|position|setup|policy|organisation|organization)\\b`,
  ].join("|"),
  "i",
);
/** Présence au bureau à 100 % → sur site */
const ONSITE_STRONG_RE =
  /\b(100 ?% (on[- ]?site|in[- ]office|pr[ée]sentiel|sur site)|full[- ]time (in|on)[- ]?(the )?(office|site)|fully (on[- ]?site|in[- ]office)|(this|the) (role|position|job) is (fully )?(on[- ]?site|in[- ]office|in[- ]person)|no remote|pas de t[ée]l[ée]travail|poste en pr[ée]sentiel)\b/i;

export function detectWorkMode(raw: RawJob): WorkMode {
  const descHead = (raw.description ?? "").slice(0, 10000);
  // Offre déclarée "remote" (filtre LinkedIn, ATS…) mais la description impose du bureau → on corrige
  if (raw.workMode === "remote") {
    if (ONSITE_STRONG_RE.test(descHead)) return "onsite";
    if (OFFICE_DAYS_RE.test(descHead)) return "hybrid";
  }
  if (raw.workMode && raw.workMode !== "unknown") return raw.workMode;
  const head = `${raw.title} ${raw.location ?? ""}`;
  if (HYBRID_RE.test(head)) return "hybrid";
  if (REMOTE_RE.test(head)) return "remote";
  const desc = (raw.description ?? "").slice(0, 6000);
  if (ONSITE_STRONG_RE.test(desc)) return "onsite";
  if (HYBRID_RE.test(desc) || OFFICE_DAYS_RE.test(desc)) return "hybrid";
  if (/\b(full[- ]?remote|fully remote|100 ?% (remote|t[ée]l[ée]travail)|t[ée]l[ée]travail (total|complet|int[ée]gral))\b/i.test(desc))
    return "remote";
  return "unknown";
}

export function detectZone(location: string | null): Zone {
  if (!location || !location.trim()) return "unknown";
  if (HOME_RE.test(location)) return "home";
  if (NEAR_RE.test(location)) return "near";
  if (FRANCE_RE.test(location)) return "france";
  if (FOREIGN_RE.test(location)) return "foreign";
  if (/^(remote|anywhere|worldwide|europe|emea|hybrid|hybride|t[ée]l[ée]travail)\b/i.test(location.trim())) return "unknown";
  return "foreign";
}

function scoreLocation(raw: RawJob, mode: WorkMode, zone: Zone): { pts: number; note: string; exclude?: string } {
  const loc = raw.location ?? "";
  const desc = (raw.description ?? "").slice(0, 8000);

  if (zone === "home") return { pts: 20, note: `Bouches-du-Rhône (${modeLabel(mode)})` };

  if (zone === "near") {
    if (mode === "hybrid" || mode === "remote") return { pts: 17, note: `Proche, ${modeLabel(mode)}` };
    return { pts: 8, note: "Proche mais sur site (pas d'hybride mentionné)" };
  }

  if (mode === "remote") {
    if (REMOTE_RESTRICTED.test(loc)) return { pts: 0, note: "", exclude: `Remote réservé à une autre zone (${loc})` };
    const titleRegion = raw.title.match(TITLE_FOREIGN_REGION);
    if (titleRegion && !STRICT_REMOTE_OK.test(raw.title))
      return { pts: 0, note: "", exclude: `Poste rattaché à une autre zone (${titleRegion[0].trim()})` };
    const locOk = zone === "france" || STRICT_REMOTE_OK.test(loc) || (zone !== "foreign" && REMOTE_OK_REGIONS.test(loc));
    if (!locOk && REMOTE_RESTRICTED.test(`${loc} ${desc}`)) return { pts: 0, note: "", exclude: "Remote réservé à un autre pays" };
    if (!locOk && zone === "foreign") return { pts: 0, note: "", exclude: `Remote limité à : ${loc}` };
    // LinkedIn classe "remote" via son filtre, souvent à tort : on exige une mention du remote dans l'annonce
    if (raw.source === "linkedin" && !/(remote|t[ée]l[ée]travail|[àa] distance|home ?office|work from (home|anywhere))/i.test(desc))
      return { pts: 12, note: "Remote selon LinkedIn, non confirmé dans l'annonce" };
    if (locOk) return { pts: 20, note: zone === "france" ? "Remote France" : `Remote (${loc || "monde"})` };
    return { pts: 12, note: "Remote, zone non précisée" };
  }

  if (zone === "france") return { pts: 0, note: "", exclude: `Sur site / hybride hors zone (${loc})` };
  if (zone === "foreign") return { pts: 0, note: "", exclude: `Étranger sur site (${loc})` };
  return { pts: 6, note: "Localisation inconnue" };
}

function modeLabel(m: WorkMode) {
  return { onsite: "sur site", hybrid: "hybride", remote: "remote", unknown: "mode non précisé" }[m];
}

// ───────────────────────── Salaire ─────────────────────────

const CURRENCY_TO_EUR: Record<string, number> = {
  EUR: 1,
  USD: SALARY.usdToEur,
  GBP: SALARY.gbpToEur,
  CHF: SALARY.chfToEur,
  CAD: 0.67,
};

function currencyCode(sym: string | null | undefined): string {
  if (!sym) return "EUR";
  const s = sym.toLowerCase();
  if (s.includes("$") || s.includes("usd")) return "USD";
  if (s.includes("£") || s.includes("gbp")) return "GBP";
  if (s.includes("chf")) return "CHF";
  if (s.includes("cad")) return "CAD";
  return "EUR";
}

function toAnnual(amount: number, period: SalaryPeriod): number {
  switch (period) {
    case "hour":
      return amount * 1600;
    case "day":
      return amount * 218;
    case "month":
      return amount * 12;
    default:
      return amount;
  }
}

/** Période explicite dans le contexte, sinon "year" si le montant est plausible en annuel, sinon null (montant ignoré) */
function guessPeriod(context: string, amount: number): SalaryPeriod | null {
  if (/(\/ ?h(ou)?r?\b|per hour|hourly|de l'heure|horaire|\/heure)/i.test(context)) return "hour";
  if (/(\/ ?day|per day|daily|par jour|\/jour|tjm|journalier)/i.test(context)) return "day";
  if (/(\/ ?mo(nth)?\b|per month|monthly|par mois|mensuel|\/mois)/i.test(context)) return "month";
  return amount >= 12000 ? "year" : null;
}

const MONEY_RE =
  /(?:(€|\$|£|usd|eur|gbp|chf|cad)\s?(\d{1,3}(?:[ ,. ]\d{3})+|\d+(?:[.,]\d+)?)(\s?k\b)?|(\d{1,3}(?:[ ,. ]\d{3})+|\d+(?:[.,]\d+)?)(\s?k)?\s?(k€|€|eur(?:os)?\b|usd\b|\$|£|gbp\b|chf\b))/gi;

function parseAmount(num: string, k: boolean): number {
  let n: number;
  if (/^\d+[.,]\d{1,2}$/.test(num)) n = parseFloat(num.replace(",", "."));
  else n = parseFloat(num.replace(/[ ,. ]/g, ""));
  return k ? n * 1000 : n;
}

/** Extrait une fourchette salariale annuelle en € depuis du texte libre */
const K_RANGE_RE = /(€|\$|£)?\s?(\d{2,3})\s?(?:k€?)?\s?(?:-|–|à|to)\s?(€|\$|£)?\s?(\d{2,3})\s?k\b\s?(€|eur|euros|\$|usd|£|gbp)?/i;
const NOT_SALARY_AFTER = /^\s?(m|mm|b|bn|million|billion|milliards?|millions?|users|clients|customers|employees)\b/i;

/** Extrait une fourchette salariale annuelle en € depuis du texte libre */
export function parseSalaryText(text: string | null | undefined): { min: number; max: number } | null {
  if (!text) return null;

  // "42-50k€", "$120k - $150k", "45 à 55K"
  const kr = text.match(K_RANGE_RE);
  if (kr) {
    const rate = CURRENCY_TO_EUR[currencyCode(kr[1] ?? kr[3] ?? kr[5])] ?? 1;
    const a = parseInt(kr[2], 10) * 1000 * rate;
    const b = parseInt(kr[4], 10) * 1000 * rate;
    if (a >= 15_000 && b <= 500_000 && a <= b) return { min: Math.round(a), max: Math.round(b) };
  }

  const found: Array<{ eur: number; idx: number }> = [];
  for (const m of text.matchAll(MONEY_RE)) {
    const idx = m.index ?? 0;
    if (NOT_SALARY_AFTER.test(text.slice(idx + m[0].length, idx + m[0].length + 12))) continue;
    const sym = m[1] ?? m[6];
    const num = m[2] ?? m[4];
    const isK = Boolean(m[3] ?? m[5]) || /k€/i.test(sym ?? "");
    if (!num) continue;
    const amount = parseAmount(num, isK);
    const ctx = text.slice(Math.max(0, idx - 40), idx + m[0].length + 40);
    const period = guessPeriod(ctx, amount);
    if (!period) continue;
    const annual = toAnnual(amount, period) * (CURRENCY_TO_EUR[currencyCode(sym)] ?? 1);
    if (annual >= 15_000 && annual <= 500_000) found.push({ eur: Math.round(annual), idx });
  }
  if (!found.length) return null;
  const first = found[0];
  const second = found.find((f) => f !== first && f.idx - first.idx < 60);
  const vals = second ? [first.eur, second.eur] : [first.eur];
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

function resolveSalary(raw: RawJob): { min: number; max: number } | null {
  if (raw.salaryMin || raw.salaryMax) {
    const cur = CURRENCY_TO_EUR[(raw.salaryCurrency ?? "EUR").toUpperCase()] ?? 1;
    const lo = raw.salaryMin || raw.salaryMax!;
    const hi = raw.salaryMax || raw.salaryMin!;
    const period = raw.salaryPeriod ?? guessPeriod("", lo) ?? "year";
    const min = Math.round(toAnnual(lo, period) * cur);
    const max = Math.round(toAnnual(hi, period) * cur);
    if (max >= 15_000) return { min, max };
  }
  return parseSalaryText(raw.salaryText) ?? parseSalaryText((raw.description ?? "").slice(0, 15000));
}

function scoreSalary(sal: { min: number; max: number } | null): { pts: number; note: string; exclude?: string } {
  if (!sal) return { pts: 5, note: "Salaire non communiqué" };
  const k = (n: number) => `${Math.round(n / 1000)}k€`;
  const range = sal.min === sal.max ? k(sal.max) : `${k(sal.min)}–${k(sal.max)}`;
  if (sal.max < SALARY.minEur) return { pts: 0, note: range, exclude: `Salaire sous le plancher (${range})` };
  if (sal.max >= SALARY.goodEur) return { pts: 10, note: range };
  return { pts: 7, note: sal.min < SALARY.minEur ? `${range} (bas de fourchette < ${Math.round(SALARY.minEur / 1000)}k)` : range };
}

// ───────────────────────── Expérience ─────────────────────────

const EXP_RE =
  /(?:minimum|at least|au moins|min\.?)?\s*(\d{1,2})\s*(?:\+|-\s*\d{1,2}|à\s*\d{1,2}|to\s*\d{1,2})?\s*\+?\s*(?:years?|yrs|ans|ann[ée]es)\b[^.\n]{0,40}?(?:exp[ée]rience|experience|exp\b|in |of |d'|de |dans|en )/gi;

export function requiredYears(text: string): number | null {
  let best: number | null = null;
  for (const m of text.matchAll(EXP_RE)) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 20) best = best === null ? n : Math.max(best, n);
  }
  return best;
}

// ───────────────────────── Langue de l'offre ─────────────────────────

const EN_WORDS = /\b(the|and|you|with|our|we|will|for|experience|team|are|your)\b/gi;
const FR_WORDS = /\b(le|la|les|et|vous|avec|nous|des|une|pour|équipe|expérience|est|sur)\b/gi;

export function offerLanguage(raw: RawJob): "fr" | "en" {
  const text = `${raw.title} ${(raw.description ?? "").slice(0, 3000)}`;
  const en = text.match(EN_WORDS)?.length ?? 0;
  const fr = text.match(FR_WORDS)?.length ?? 0;
  if (en === 0 && fr === 0) return /\b(h\/f|f\/h)\b|[éèàç]/i.test(raw.title) ? "fr" : "en";
  return en > fr ? "en" : "fr";
}

function pickCv(track: (typeof TRACKS)[number], title: string, lang: "fr" | "en"): string {
  const rule = track.cvByTitle?.find(([re]) => re.test(title));
  if (rule) return lang === "en" ? rule[2] : rule[1];
  return lang === "en" ? track.cvEn : track.cv;
}

// ───────────────────────── Diplôme ─────────────────────────

const DEGREE_RE =
  /(bac ?\+ ?5|\bmaster ?(2|ii)\b|\bm2\b|(?<!scrum )\bmaster(?:'?s)?(?! data)\b|\bmsc\b|\bms degree|[ée]cole d['’]ing[ée]nieurs?|dipl[oô]m[ée]e?s? d['’]ing[ée]nieur|grande [ée]cole|engineering degree)/gi;
const DEGREE_CONTEXT = /(formation|dipl[oô]m|degree|bac|[ée]tudes|education|universit|[ée]cole|cursus|graduate)/i;
const DEGREE_OK_RANGE = /bac ?\+ ?[234] ?(à|a|-|–|\/|ou|or|to) ?(bac ?\+ ?)?[345]|bac ?\+ ?[234] (minimum|min\b)|bachelor/i;
const DEGREE_EQUIV = /(ou [ée]quivalent|or equivalent|ou exp[ée]rience [ée]quivalente|equivalent (practical |professional |work )?experience)/i;
const DEGREE_SOFT = /(id[ée]alement|souhait[ée]|appr[ée]ci[ée]|un plus|serait un plus|preferred|ideally|a plus|nice to have|bonus|de pr[ée]f[ée]rence)/i;

function lastIndexOfAny(text: string, chars: string, before: number) {
  for (let i = before - 1; i >= 0; i--) if (chars.includes(text[i])) return i;
  return -1;
}
function firstIndexOfAny(text: string, chars: string, from: number) {
  for (let i = from; i < text.length; i++) if (chars.includes(text[i])) return i;
  return text.length;
}

/** Pénalité si l'offre demande un niveau au-dessus du tien (Bac+5, Master, ingénieur) */
export function educationPenalty(text: string): { label: string; pts: number } | null {
  let worst: { label: string; pts: number } | null = null;
  for (const m of text.matchAll(DEGREE_RE)) {
    const idx = m.index ?? 0;
    const ctx = text.slice(Math.max(0, idx - 90), idx + m[0].length + 90);
    if (/^master/i.test(m[0]) && !DEGREE_CONTEXT.test(ctx)) continue; // "master the craft", etc.
    if (DEGREE_OK_RANGE.test(ctx)) continue; // "Bac+3 à Bac+5" → ton niveau est accepté
    // "idéalement" ne compte que dans le même segment (entre virgules) :
    // "De formation Bac+5, idéalement école d'ingé" → le Bac+5 reste demandé
    const end = idx + m[0].length;
    const clause = text.slice(lastIndexOfAny(text, ",;.\n", idx) + 1, firstIndexOfAny(text, ",;.\n", end));
    const sentence = text.slice(lastIndexOfAny(text, ".\n", idx) + 1, firstIndexOfAny(text, ".\n", end));
    const p = DEGREE_EQUIV.test(sentence)
      ? { label: "Bac+5 demandé (équivalence possible)", pts: EDUCATION.equivalent }
      : DEGREE_SOFT.test(clause)
        ? { label: "Bac+5 / ingénieur souhaité", pts: EDUCATION.preferred }
        : { label: "Bac+5 / ingénieur demandé", pts: EDUCATION.required };
    if (!worst || p.pts > worst.pts) worst = p;
  }
  return worst;
}

// ───────────────────────── Fraîcheur & priorité ─────────────────────────

/** Bonus/malus selon l'âge de l'offre */
export function freshnessAdjust(publishedAt: Date | string | null | undefined, now = Date.now()): number {
  if (!publishedAt) return 0;
  const ageH = Math.max(0, (now - new Date(publishedAt).getTime()) / 3600_000);
  for (const [maxH, pts] of FRESHNESS) if (ageH < maxH) return pts;
  return 0;
}

export function priorityFor(score: number, excluded: boolean): "P1" | "P2" | "P3" | null {
  if (excluded) return null;
  return score >= PRIORITY.P1 ? "P1" : score >= PRIORITY.P2 ? "P2" : score >= PRIORITY.P3 ? "P3" : null;
}

export const finalScore = (fit: number, adj: number) => Math.max(0, Math.min(100, fit + adj));

// ───────────────────────── Score principal ─────────────────────────

export function isTitleRelevant(title: string): boolean {
  if (HARD_EXCLUDE_TITLE.some(([re]) => re.test(title))) return false;
  return TRACKS.some((t) => t.strongTitle.some((re) => re.test(title)) || t.weakTitle.some((re) => re.test(title)));
}

/** Expérience de lead exigée vs la tienne (LEAD_EXPERIENCE.myYears) */
export function leadRequirement(text: string): { kind: "exclude"; reason: string } | { kind: "mention" } | null {
  // "souhaité / a plus / nice to have" autour de l'exigence → simple pénalité, pas d'exclusion
  const SOFT = /\b(plus|bonus|nice[- ]to[- ]have|preferred|ideally|id[ée]alement|souhait[ée]e?s?|appr[ée]ci[ée]e?s?|serait un atout|un atout|not required|optional)\b/i;
  const required: number[] = [];
  let soft = false;
  for (const m of text.matchAll(new RegExp(LEAD_EXPERIENCE.yearsRe, "gi"))) {
    const n = Number(m[1]);
    if (!(n > LEAD_EXPERIENCE.myYears && n < 20)) continue;
    const around = text.slice(Math.max(0, m.index! - 160), m.index! + m[0].length + 60);
    if (SOFT.test(around)) soft = true;
    else required.push(n);
  }
  const max = required.length ? Math.max(...required) : null;
  if (max !== null)
    return { kind: "exclude", reason: `${max} ans d'expérience de lead/management exigés (toi : ~${LEAD_EXPERIENCE.myYears})` };
  if (LEAD_EXPERIENCE.strongRe.test(text)) return { kind: "exclude", reason: "Expérience de lead confirmée exigée (toi : ~1 an)" };
  if (soft || LEAD_EXPERIENCE.mentionRe.test(text)) return { kind: "mention" };
  return null;
}

export function scoreJob(raw: RawJob): ScoreResult {
  const title = raw.title;
  const description = raw.description ?? "";
  const fullText = `${title}\n${description}`;
  const fullTextNoAccent = stripAccents(fullText);
  const partialDescription = description.length < 300;

  const mode = detectWorkMode(raw);
  const zone = detectZone(raw.location);
  const loc = scoreLocation(raw, mode, zone);
  const salary = resolveSalary(raw);
  const sal = scoreSalary(salary);

  const penalties: Array<{ label: string; pts: number }> = [];
  for (const p of GLOBAL_PENALTIES) {
    const target = p.scope === "title" ? title : fullText;
    if (p.re.test(target)) penalties.push({ label: p.label, pts: p.pts });
  }

  const years = requiredYears(fullText);
  const isSeniorTitle = SENIOR_TITLE.test(title);

  const vendor = description.match(VENDOR_ECOSYSTEMS);
  if (vendor && !VENDOR_ECOSYSTEMS.test(title)) penalties.push({ label: `${vendor[2]} mentionné (non maîtrisé)`, pts: VENDOR_MENTION_PTS });

  const lead = leadRequirement(fullText);
  if (lead?.kind === "mention") penalties.push({ label: "Expérience de management mentionnée", pts: LEAD_EXPERIENCE.mentionPts });

  const edu = educationPenalty(fullText);
  if (edu) penalties.push(edu);

  const globalPenalty = penalties.reduce((s, p) => s + p.pts, 0);

  const perTrack = TRACKS.map((t) => {
    const titlePts = t.strongTitle.some((re) => re.test(title)) ? 45 : t.weakTitle.some((re) => re.test(title)) ? 25 : 0;
    const matched: string[] = [];
    let skillSum = 0;
    for (const [re, weight] of t.skills) {
      const m = fullText.match(re) ?? fullTextNoAccent.match(re);
      if (m) {
        skillSum += weight;
        matched.push(m[2] ?? m[0].trim());
      }
    }
    let skillsPts = Math.min(25, skillSum);
    if (partialDescription) skillsPts = Math.max(skillsPts, 12);

    const trackPenalties: Array<{ label: string; pts: number }> = [];
    for (const [re, pts, label] of t.penalties ?? []) {
      if (re.test(title)) trackPenalties.push({ label, pts });
      else if (re.test(description)) trackPenalties.push({ label: `${label} (mentionné)`, pts: Math.round(pts / 2) });
    }
    // Séniorité évaluée par rapport à TON expérience dans ce métier précis
    if (isSeniorTitle && t.seniority.seniorTitle > 0)
      trackPenalties.push({ label: `Poste senior (${t.seniority.years} an${t.seniority.years > 1 ? "s" : ""} d'exp. dans ce métier)`, pts: t.seniority.seniorTitle });
    if (years !== null && years > t.seniority.years) {
      const gap = years - t.seniority.years;
      trackPenalties.push({
        label: `${years} ans d'exp. demandés (toi : ~${t.seniority.years} dans ce métier)`,
        pts: gap > EXPERIENCE.bigGap ? EXPERIENCE.severe : EXPERIENCE.moderate,
      });
    }
    const tp = trackPenalties.reduce((s, p) => s + p.pts, 0);
    let score = titlePts + skillsPts + loc.pts + sal.pts - globalPenalty - tp;
    if (titlePts === 0) score = Math.min(score, 30);
    score = Math.max(0, Math.min(100, score));
    return { track: t, titlePts, skillsPts, matched, trackPenalties, score };
  }).sort((a, b) => b.score - a.score);

  const best = perTrack[0];
  let exclusionReason: string | null = null;
  const hard = HARD_EXCLUDE_TITLE.find(([re]) => re.test(title));
  if (hard) exclusionReason = hard[0] === VENDOR_ECOSYSTEMS ? `${hard[1]} (${title.match(VENDOR_ECOSYSTEMS)?.[2]})` : hard[1];
  else if (
    best.titlePts > 0 &&
    best.track.seniority.excludeSeniorIf?.test(title) &&
    (isSeniorTitle || VERY_SENIOR_TITLE.test(title))
  )
    exclusionReason = `Poste senior en ${best.track.label} : pas ton profil`;
  else if (lead?.kind === "exclude") exclusionReason = lead.reason;
  else if (loc.exclude) exclusionReason = loc.exclude;
  else if (sal.exclude) exclusionReason = sal.exclude;

  const score = best.score;
  const excluded = exclusionReason !== null;
  const priority = excluded
    ? null
    : score >= PRIORITY.P1
      ? "P1"
      : score >= PRIORITY.P2
        ? "P2"
        : score >= PRIORITY.P3
          ? "P3"
          : null;

  return {
    score,
    track: best.titlePts > 0 ? best.track.id : null,
    trackLabel: best.titlePts > 0 ? best.track.label : null,
    cv: best.titlePts > 0 ? pickCv(best.track, title, offerLanguage(raw)) : null,
    priority,
    excluded,
    exclusionReason,
    workMode: mode,
    zone,
    salaryMinEur: salary?.min ?? null,
    salaryMaxEur: salary?.max ?? null,
    details: {
      titlePts: best.titlePts,
      skillsPts: best.skillsPts,
      matchedSkills: best.matched,
      locationPts: loc.pts,
      locationNote: loc.note || loc.exclude || "",
      salaryPts: sal.pts,
      salaryNote: sal.note,
      penalties: [...penalties, ...best.trackPenalties],
      experienceYears: years,
      alternatives: perTrack.slice(1, 3).filter((p) => p.titlePts > 0).map((p) => ({ track: p.track.id, score: p.score })),
      partialDescription,
    },
  };
}
