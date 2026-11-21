/**
 * LinkedIn via les pages publiques "jobs-guest" (sans connexion → aucun risque pour ton compte).
 * Rythme volontairement prudent : pauses entre requêtes, arrêt du cycle si LinkedIn renvoie 429.
 *
 * f_WT : 1 = sur site, 2 = remote, 3 = hybride
 * f_TPR : fenêtre de publication en secondes (r3600 = dernière heure)
 */
import * as cheerio from "cheerio";
import type { RawJob, Source, SourceContext, WorkMode } from "../lib/types";
import { getText, jitter, HttpError } from "../lib/text";
import { isTitleRelevant } from "../scoring/score";

interface Query {
  keywords: string;
  location: string;
  wt?: string;
  distance?: number;
}

// LinkedIn accepte les opérateurs booléens : moins de requêtes = moins de risque de blocage (429)
const OR = (...k: string[]) => k.map((x) => (x.includes(" ") ? `"${x}"` : x)).join(" OR ");

const QUERIES: Query[] = [
  {
    keywords: OR("développeur", "developer", "fullstack", "devops", "chef de projet", "product owner", "intelligence artificielle", "automatisation", "intégration", "no-code"),
    location: "Marseille, Provence-Alpes-Côte d'Azur, France",
    distance: 25,
  },
  ...["Toulon", "Montpellier"].map((city) => ({
    keywords: OR("développeur", "fullstack", "devops", "chef de projet", "product owner", "IA"),
    location: `${city}, France`,
    wt: "2,3",
    distance: 15,
  })),
  { keywords: OR("fullstack", "node.js", "typescript", "devops", "AI engineer", "IA générative"), location: "France", wt: "2" },
  { keywords: OR("chef de projet", "product owner", "solutions engineer", "no-code", "automatisation", "déploiement"), location: "France", wt: "2" },
  {
    keywords: OR("full stack typescript", "AI automation", "forward deployed engineer", "solutions engineer", "AI integration", "devops"),
    location: "European Union",
    wt: "2",
  },
];

function searchUrl(q: Query, windowSec: number, start = 0) {
  const p = new URLSearchParams({
    keywords: q.keywords,
    location: q.location,
    f_TPR: `r${windowSec}`,
    sortBy: "DD",
    start: String(start),
  });
  if (q.wt) p.set("f_WT", q.wt);
  if (q.distance) p.set("distance", String(q.distance));
  return `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${p}`;
}

interface Card {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  url: string;
  postedAt: Date | null;
  wt?: string;
}

function parseCards(html: string, wt?: string): Card[] {
  const $ = cheerio.load(html);
  const cards: Card[] = [];
  $("div.base-card, div.job-search-card").each((_, el) => {
    const $el = $(el);
    const urn = $el.attr("data-entity-urn") ?? "";
    const id = urn.split(":").pop();
    if (!id) return;
    const title = $el.find(".base-search-card__title").text().trim();
    const href = $el.find("a.base-card__full-link").attr("href") ?? `https://www.linkedin.com/jobs/view/${id}`;
    const time = $el.find("time").attr("datetime");
    cards.push({
      id,
      title,
      company: $el.find(".base-search-card__subtitle").text().trim() || null,
      location: $el.find(".job-search-card__location").text().trim() || null,
      url: href.split("?")[0],
      postedAt: time ? new Date(time) : null,
      wt,
    });
  });
  return cards;
}

async function fetchDetail(id: string): Promise<{ description: string | null; criteria: string }> {
  const html = await liGet(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`);
  const $ = cheerio.load(html);
  const $desc = $(".show-more-less-html__markup").first().length
    ? $(".show-more-less-html__markup").first()
    : $(".description__text").first();
  $desc.find("br").replaceWith("\n");
  $desc.find("li, p").append("\n");
  const criteria = $(".description__job-criteria-item")
    .map((_, el) => `${$(el).find("h3").text().trim()}: ${$(el).find("span").text().trim()}`)
    .get()
    .join("\n");
  return { description: $desc.text().replace(/[ \t]+/g, " ").trim() || null, criteria };
}

// "2,3" (remote ou hybride) : les deux te conviennent pour Toulon/Montpellier → on compte "hybride"
const wtToMode = (wt?: string): WorkMode => (wt === "2" ? "remote" : wt === "2,3" ? "hybrid" : "unknown");

let backoffUntil = 0;

/** LinkedIn renvoie des 429 aléatoires : on réessaie avec attente croissante avant d'abandonner */
async function liGet(url: string): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await getText(url, { headers: { Accept: "text/html,application/xhtml+xml" } });
    } catch (e) {
      if (!(e instanceof HttpError && e.status === 429) || attempt >= 3) throw e;
      await jitter(8000 * (attempt + 1), 15000 * (attempt + 1));
    }
  }
}

export const linkedin: Source = {
  id: "linkedin",
  label: "LinkedIn",
  intervalMin: 30,
  enabled: () => true,
  async fetch(ctx: SourceContext) {
    if (Date.now() < backoffUntil) {
      ctx.log("  ⏸ LinkedIn en pause (429 récent)");
      return [];
    }
    // 1er passage : dernières 24h ; ensuite : 2h (recouvrement volontaire, les doublons sont ignorés)
    const windowSec = ctx.seeding ? 86400 : 7200;
    const cards = new Map<string, Card>();
    try {
      const maxPages = ctx.seeding ? 4 : 2;
      for (const q of QUERIES) {
        for (let page = 0; page < maxPages; page++) {
          const html = await liGet(searchUrl(q, windowSec, page * 10));
          const found = parseCards(html, q.wt);
          for (const c of found) if (!cards.has(c.id)) cards.set(c.id, c);
          await jitter(3000, 6000);
          if (found.length < 10) break;
        }
      }
    } catch (e) {
      if (e instanceof HttpError && e.status === 429) {
        backoffUntil = Date.now() + 20 * 60_000;
        ctx.log("  ⚠️ LinkedIn 429 → pause de 20 min (les offres déjà listées sont gardées)");
      } else throw e;
      // Rien récupéré : on lève l'erreur pour que l'initialisation soit retentée au prochain cycle
      if (cards.size === 0) throw e;
    }

    const out: RawJob[] = [];
    for (const c of cards.values()) {
      if (!c.title || !isTitleRelevant(c.title)) continue;
      let description: string | null = null;
      if (!(await ctx.isKnown("linkedin", c.id)) && Date.now() >= backoffUntil) {
        try {
          const d = await fetchDetail(c.id);
          description = [d.description, d.criteria].filter(Boolean).join("\n\n");
        } catch (e) {
          if (e instanceof HttpError && e.status === 429) {
            backoffUntil = Date.now() + 30 * 60_000;
            ctx.log("  ⚠️ LinkedIn 429 sur le détail → descriptions suspendues 30 min");
          }
        }
        await jitter(2500, 5000);
      }
      out.push({
        source: "linkedin",
        externalId: c.id,
        url: c.url,
        title: c.title,
        company: c.company,
        location: c.location,
        workMode: wtToMode(c.wt),
        description,
        postedAt: c.postedAt,
      });
    }
    return out;
  },
};
