import { sql } from "../lib/db";
import { FRESHNESS, PRIORITY } from "../../config/profile";

/**
 * Recalcule fraîcheur, score final et priorité de toutes les offres en une requête.
 * Les seuils viennent de config/profile.ts (valeurs numériques de confiance → SQL généré).
 */
export async function refreshFreshness() {
  const age = "extract(epoch from (now() - coalesce(posted_at, first_seen_at))) / 3600";
  const adjCase =
    "case " + FRESHNESS.map(([h, pts]) => (Number.isFinite(h) ? `when ${age} < ${Number(h)} then ${Number(pts)}` : `else ${Number(pts)}`)).join(" ") + " end";
  await sql.unsafe(`
    with f as (select id, ${adjCase} as adj from jobs)
    update jobs j set
      fresh_adj = f.adj,
      final_score = greatest(0, least(100, j.score + f.adj)),
      priority = case
        when j.excluded then null
        when j.score + f.adj >= ${Number(PRIORITY.P1)} then 'P1'
        when j.score + f.adj >= ${Number(PRIORITY.P2)} then 'P2'
        when j.score + f.adj >= ${Number(PRIORITY.P3)} then 'P3'
        else null end
    from f where f.id = j.id
      and (j.fresh_adj is distinct from f.adj or j.final_score is distinct from greatest(0, least(100, j.score + f.adj)))`);
}
