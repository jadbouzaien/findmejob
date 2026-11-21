/**
 * API officielle France Travail (ex Pôle emploi) — gratuite.
 * Créer une app sur https://francetravail.io, s'abonner à "API Offres d'emploi v2",
 * puis renseigner FRANCE_TRAVAIL_CLIENT_ID / FRANCE_TRAVAIL_CLIENT_SECRET dans .env.
 */
import type { RawJob, Source } from "../lib/types";
import { env } from "../lib/env";
import { BROWSER_UA, HttpError, sleep } from "../lib/text";
import { isTitleRelevant } from "../scoring/score";

// Codes ROME : études & dev info, production/exploitation SI, conseil/MOA SI, expertise & support SI
const ROME = "M1805,M1810,M1806,M1802";
const DEPARTEMENTS = ["13", "83", "34", "84"];

let token: { value: string; exp: number } | null = null;

async function getToken() {
  if (token && token.exp > Date.now() + 60_000) return token.value;
  const res = await fetch("https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.franceTravailId,
      client_secret: env.franceTravailSecret,
      scope: "api_offresdemploiv2 o2dsoffre",
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new HttpError(res.status, `France Travail auth ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return token.value;
}

interface FtOffre {
  id: string;
  intitule: string;
  description?: string;
  dateCreation?: string;
  lieuTravail?: { libelle?: string };
  entreprise?: { nom?: string };
  salaire?: { libelle?: string; commentaire?: string };
  origineOffre?: { urlOrigine?: string };
  typeContrat?: string;
  experienceLibelle?: string;
}

export const franceTravail: Source = {
  id: "francetravail",
  label: "France Travail",
  intervalMin: 15,
  enabled: () => Boolean(env.franceTravailId && env.franceTravailSecret),
  async fetch(ctx) {
    const tk = await getToken();
    const out: RawJob[] = [];
    for (const dep of DEPARTEMENTS) {
      const p = new URLSearchParams({
        departement: dep,
        codeROME: ROME,
        publieeDepuis: ctx.seeding ? "7" : "1",
        range: "0-149",
        sort: "1",
      });
      const res = await fetch(`https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?${p}`, {
        headers: { Authorization: `Bearer ${tk}`, Accept: "application/json", "User-Agent": BROWSER_UA },
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status === 204) continue;
      if (!res.ok) throw new HttpError(res.status, `France Travail ${res.status}: ${await res.text()}`);
      const { resultats = [] } = (await res.json()) as { resultats?: FtOffre[] };
      for (const o of resultats) {
        if (!isTitleRelevant(o.intitule)) continue;
        out.push({
          source: "francetravail",
          externalId: o.id,
          url: o.origineOffre?.urlOrigine || `https://candidat.francetravail.fr/offres/recherche/detail/${o.id}`,
          title: o.intitule,
          company: o.entreprise?.nom ?? null,
          location: o.lieuTravail?.libelle ?? null,
          description: [o.description, o.typeContrat, o.experienceLibelle].filter(Boolean).join("\n\n"),
          salaryText: [o.salaire?.libelle, o.salaire?.commentaire].filter(Boolean).join(" ") || null,
          postedAt: o.dateCreation ? new Date(o.dateCreation) : null,
        });
      }
      await sleep(300);
    }
    return out;
  },
};
