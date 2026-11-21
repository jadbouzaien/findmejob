/**
 * Pages carrières des entreprises (Greenhouse / Lever / Ashby).
 * API publiques, sans clé : c'est la source la plus fraîche (les offres y sont publiées en premier).
 */
import { COMPANIES, type AtsCompany } from "../../config/companies";
import type { RawJob, Source, SourceContext, WorkMode, SalaryPeriod } from "../lib/types";
import { getJson, htmlToText, pool } from "../lib/text";
import { isTitleRelevant } from "../scoring/score";

const byAts = (ats: AtsCompany["ats"]) => COMPANIES.filter((c) => c.ats === ats);

async function eachCompany(ats: AtsCompany["ats"], ctx: SourceContext, fn: (c: AtsCompany) => Promise<RawJob[]>) {
  const results = await pool(byAts(ats), 4, async (c) => {
    try {
      return await fn(c);
    } catch (e) {
      ctx.log(`  ⚠️ ${ats}/${c.slug}: ${(e as Error).message}`);
      return [];
    }
  });
  return results.flat();
}

// ───────────── Greenhouse ─────────────
interface GhJob {
  id: number;
  title: string;
  absolute_url: string;
  location?: { name?: string };
  first_published?: string;
  updated_at?: string;
  content?: string;
  company_name?: string;
}

export const greenhouse: Source = {
  id: "greenhouse",
  label: "Greenhouse",
  intervalMin: 10,
  enabled: () => byAts("greenhouse").length > 0,
  async fetch(ctx) {
    return eachCompany("greenhouse", ctx, async (c) => {
      const { jobs } = await getJson<{ jobs: GhJob[] }>(`https://boards-api.greenhouse.io/v1/boards/${c.slug}/jobs`);
      const relevant = jobs.filter((j) => isTitleRelevant(j.title));
      const out: RawJob[] = [];
      for (const j of relevant) {
        const externalId = `${c.slug}:${j.id}`;
        let description: string | null = null;
        // Le détail (description) n'est téléchargé que pour les nouvelles offres pertinentes
        if (!(await ctx.isKnown("greenhouse", externalId))) {
          try {
            const full = await getJson<GhJob>(`https://boards-api.greenhouse.io/v1/boards/${c.slug}/jobs/${j.id}`);
            description = htmlToText(full.content);
          } catch {
            /* description manquante : on score sur le titre */
          }
        }
        const loc = j.location?.name ?? null;
        out.push({
          source: "greenhouse",
          externalId,
          url: j.absolute_url,
          title: j.title,
          company: c.name,
          location: loc,
          workMode: /remote/i.test(loc ?? "") ? "remote" : /hybrid/i.test(loc ?? "") ? "hybrid" : "unknown",
          description,
          postedAt: j.first_published ? new Date(j.first_published) : j.updated_at ? new Date(j.updated_at) : null,
        });
      }
      return out;
    });
  },
};

// ───────────── Lever ─────────────
interface LeverJob {
  id: string;
  text: string;
  hostedUrl: string;
  createdAt?: number;
  workplaceType?: string;
  categories?: { location?: string; allLocations?: string[]; commitment?: string };
  descriptionPlain?: string;
  lists?: Array<{ text: string; content: string }>;
  additionalPlain?: string;
  salaryRange?: { min?: number; max?: number; currency?: string; interval?: string };
}

const leverMode = (w?: string): WorkMode =>
  w === "remote" ? "remote" : w === "hybrid" ? "hybrid" : w === "on-site" ? "onsite" : "unknown";
const leverPeriod = (i?: string): SalaryPeriod =>
  i?.includes("hour") ? "hour" : i?.includes("month") ? "month" : i?.includes("day") ? "day" : "year";

export const lever: Source = {
  id: "lever",
  label: "Lever",
  intervalMin: 10,
  enabled: () => byAts("lever").length > 0,
  async fetch(ctx) {
    return eachCompany("lever", ctx, async (c) => {
      const jobs = await getJson<LeverJob[]>(`https://api.lever.co/v0/postings/${c.slug}?mode=json`);
      return jobs
        .filter((j) => isTitleRelevant(j.text))
        .map((j) => {
          const lists = (j.lists ?? []).map((l) => `${l.text}\n${htmlToText(l.content) ?? ""}`).join("\n\n");
          return {
            source: "lever",
            externalId: `${c.slug}:${j.id}`,
            url: j.hostedUrl,
            title: j.text,
            company: c.name,
            location: (j.categories?.allLocations?.join(" / ") || j.categories?.location) ?? null,
            workMode: leverMode(j.workplaceType),
            description: [j.descriptionPlain, lists, j.additionalPlain].filter(Boolean).join("\n\n"),
            salaryMin: j.salaryRange?.min ?? null,
            salaryMax: j.salaryRange?.max ?? null,
            salaryCurrency: j.salaryRange?.currency ?? null,
            salaryPeriod: j.salaryRange ? leverPeriod(j.salaryRange.interval) : null,
            postedAt: j.createdAt ? new Date(j.createdAt) : null,
          } satisfies RawJob;
        });
    });
  },
};

// ───────────── Ashby ─────────────
interface AshbyJob {
  id: string;
  title: string;
  location?: string;
  secondaryLocations?: Array<{ location?: string }>;
  isRemote?: boolean;
  workplaceType?: string;
  publishedAt?: string;
  jobUrl: string;
  descriptionPlain?: string;
  compensation?: {
    compensationTierSummary?: string | null;
    summaryComponents?: Array<{
      compensationType?: string;
      interval?: string;
      currencyCode?: string;
      minValue?: number | null;
      maxValue?: number | null;
    }>;
  };
}

export const ashby: Source = {
  id: "ashby",
  label: "Ashby",
  intervalMin: 10,
  enabled: () => byAts("ashby").length > 0,
  async fetch(ctx) {
    return eachCompany("ashby", ctx, async (c) => {
      const { jobs } = await getJson<{ jobs: AshbyJob[] }>(
        `https://api.ashbyhq.com/posting-api/job-board/${c.slug}?includeCompensation=true`,
      );
      return jobs
        .filter((j) => isTitleRelevant(j.title))
        .map((j) => {
          const salary = j.compensation?.summaryComponents?.find((s) => s.compensationType === "Salary");
          const locs = [j.location, ...(j.secondaryLocations ?? []).map((s) => s.location)].filter(Boolean);
          const wt = (j.workplaceType ?? "").toLowerCase();
          return {
            source: "ashby",
            externalId: `${c.slug}:${j.id}`,
            url: j.jobUrl,
            title: j.title,
            company: c.name,
            location: locs.join(" / ") || null,
            workMode: wt === "remote" ? "remote" : wt === "hybrid" ? "hybrid" : wt === "onsite" ? "onsite" : j.isRemote ? "remote" : "unknown",
            description: j.descriptionPlain ?? null,
            salaryMin: salary?.minValue ?? null,
            salaryMax: salary?.maxValue ?? null,
            salaryCurrency: salary?.currencyCode ?? null,
            salaryPeriod: salary?.interval?.includes("HOUR") ? "hour" : salary?.interval?.includes("MONTH") ? "month" : "year",
            salaryText: j.compensation?.compensationTierSummary ?? null,
            postedAt: j.publishedAt ? new Date(j.publishedAt) : null,
          } satisfies RawJob;
        });
    });
  },
};
