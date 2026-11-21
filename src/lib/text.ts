import * as cheerio from "cheerio";

const ENTITY_RE = /&(lt|gt|amp|quot|#39|nbsp);/g;
const ENTITIES: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: '"', "#39": "'", nbsp: " " };

export function decodeEntities(s: string) {
  return s.replace(ENTITY_RE, (_, e) => ENTITIES[e] ?? _);
}

/** HTML (éventuellement échappé une fois) → texte lisible */
export function htmlToText(html: string | null | undefined): string | null {
  if (!html) return null;
  let src = html;
  if (/&lt;\w/.test(src)) src = decodeEntities(src);
  const $ = cheerio.load(src);
  $("br").replaceWith("\n");
  $("p, li, div, h1, h2, h3, h4, tr").each((_, el) => {
    $(el).append("\n");
  });
  return $.root()
    .text()
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*/g, "\n\n")
    .trim();
}

export function stripAccents(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Clé de dédoublonnage : entreprise + titre normalisés */
export function dedupKey(company: string | null, title: string) {
  const norm = (s: string) =>
    stripAccents(s.toLowerCase())
      .replace(/\((h|f|m|w|d)[/ ,]*(h|f|m|w|d)?[/ ,]*(h|f|m|w|d)?\)/g, " ")
      .replace(/\b(h\/f|f\/h|m\/f|f\/m|m\/w\/d|cdi|cdd|freelance|remote|hybride?|teletravail)\b/g, " ")
      .replace(/\b(sas|sa|inc|ltd|gmbh|llc|group|groupe)\b/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  return `${norm(company ?? "")}|${norm(title)}`;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const jitter = (min: number, max: number) => sleep(min + Math.random() * (max - min));

export const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

export async function getJson<T = unknown>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "User-Agent": BROWSER_UA, Accept: "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new HttpError(res.status, `${res.status} ${res.statusText} — ${url}`);
  return (await res.json()) as T;
}

export async function getText(url: string, init: RequestInit = {}): Promise<string> {
  const res = await fetch(url, {
    ...init,
    headers: { "User-Agent": BROWSER_UA, "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new HttpError(res.status, `${res.status} ${res.statusText} — ${url}`);
  return res.text();
}

export class HttpError extends Error {
  constructor(public status: number, msg: string) {
    super(msg);
  }
}

/** Exécute fn sur items avec une concurrence limitée */
export async function pool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}
