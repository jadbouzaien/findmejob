import { sql } from "./db";

export interface JobListItem {
  id: number;
  source: string;
  url: string;
  title: string;
  company: string | null;
  location: string | null;
  work_mode: string | null;
  zone: string | null;
  salary_min_eur: number | null;
  salary_max_eur: number | null;
  posted_at: string | null;
  first_seen_at: string;
  also_on: string[];
  /** score final = fit + fraîcheur */
  score: number;
  fit_score: number;
  fresh_adj: number;
  track: string | null;
  cv: string | null;
  priority: string | null;
  excluded: boolean;
  exclusion_reason: string | null;
  score_details: {
    titlePts: number;
    skillsPts: number;
    matchedSkills: string[];
    locationPts: number;
    locationNote: string;
    salaryPts: number;
    salaryNote: string;
    penalties: Array<{ label: string; pts: number }>;
    experienceYears: number | null;
    partialDescription: boolean;
  } | null;
  status: string;
}

export interface SourceHealth {
  source: string;
  last_ok_at: string | null;
  last_run_at: string | null;
  last_error: string | null;
  last_count: number | null;
}

export async function listJobs(): Promise<JobListItem[]> {
  const rows = await sql<JobListItem[]>`
    select id, source, url, title, company, location, work_mode, zone, salary_min_eur, salary_max_eur,
           posted_at, first_seen_at, also_on, final_score as score, score as fit_score, fresh_adj,
           track, cv, priority, excluded, exclusion_reason, score_details, status
    from jobs
    where duplicate_of is null
      and status <> 'deleted'
      and final_score >= 45
      and coalesce(posted_at, first_seen_at) > now() - interval '90 days'
    order by final_score desc, first_seen_at desc
    limit 2000`;
  return JSON.parse(JSON.stringify(rows));
}

export async function sourceHealth(): Promise<SourceHealth[]> {
  const rows = await sql<SourceHealth[]>`select source, last_ok_at, last_run_at, last_error, last_count from source_runs order by source`;
  return JSON.parse(JSON.stringify(rows));
}
