/**
 * Entreprises surveillées directement sur leur ATS (= les offres arrivent ici AVANT LinkedIn).
 * Ajouter une boîte : trouve l'URL de sa page carrière :
 *   job-boards.greenhouse.io/<slug>  → greenhouse
 *   jobs.lever.co/<slug>             → lever
 *   jobs.ashbyhq.com/<slug>          → ashby
 * Toutes celles ci-dessous ont été vérifiées le 2026-11-20.
 */
export interface AtsCompany {
  ats: "greenhouse" | "lever" | "ashby";
  slug: string;
  name: string;
}

export const COMPANIES: AtsCompany[] = [
  // IA — les boîtes qui recrutent sur ton créneau "intégration IA / FDE / solutions"
  { ats: "greenhouse", slug: "anthropic", name: "Anthropic" },
  { ats: "ashby", slug: "openai", name: "OpenAI" },
  { ats: "ashby", slug: "cohere", name: "Cohere" },
  { ats: "ashby", slug: "elevenlabs", name: "ElevenLabs" },
  { ats: "ashby", slug: "langchain", name: "LangChain" },
  { ats: "ashby", slug: "n8n", name: "n8n" },
  { ats: "ashby", slug: "dust", name: "Dust" },
  { ats: "ashby", slug: "lovable", name: "Lovable" },
  { ats: "ashby", slug: "cursor", name: "Cursor" },
  { ats: "ashby", slug: "replit", name: "Replit" },
  { ats: "ashby", slug: "modal", name: "Modal" },
  { ats: "ashby", slug: "poolside", name: "Poolside" },
  { ats: "ashby", slug: "vapi", name: "Vapi" },
  { ats: "ashby", slug: "photoroom", name: "Photoroom" },

  // SaaS / dev tools US & EU avec présence France ou remote Europe
  { ats: "greenhouse", slug: "datadog", name: "Datadog" },
  { ats: "greenhouse", slug: "vercel", name: "Vercel" },
  { ats: "greenhouse", slug: "gitlab", name: "GitLab" },
  { ats: "greenhouse", slug: "elastic", name: "Elastic" },
  { ats: "greenhouse", slug: "cloudflare", name: "Cloudflare" },
  { ats: "greenhouse", slug: "mongodb", name: "MongoDB" },
  { ats: "greenhouse", slug: "stripe", name: "Stripe" },
  { ats: "greenhouse", slug: "grafanalabs", name: "Grafana Labs" },
  { ats: "greenhouse", slug: "twilio", name: "Twilio" },
  { ats: "greenhouse", slug: "intercom", name: "Intercom" },
  { ats: "greenhouse", slug: "figma", name: "Figma" },
  { ats: "greenhouse", slug: "airtable", name: "Airtable" },
  { ats: "greenhouse", slug: "algolia", name: "Algolia" },
  { ats: "greenhouse", slug: "dataiku", name: "Dataiku" },
  { ats: "greenhouse", slug: "mirakl", name: "Mirakl" },
  { ats: "ashby", slug: "linear", name: "Linear" },
  { ats: "ashby", slug: "notion", name: "Notion" },
  { ats: "ashby", slug: "ramp", name: "Ramp" },
  { ats: "ashby", slug: "posthog", name: "PostHog" },
  { ats: "ashby", slug: "supabase", name: "Supabase" },

  // France
  { ats: "ashby", slug: "pennylane", name: "Pennylane" },
  { ats: "lever", slug: "pigment", name: "Pigment" },
  { ats: "lever", slug: "swile", name: "Swile" },
];
