/**
 * Banque de contenu des lettres de motivation.
 * Chaque "preuve" est un fait réel de ton parcours, déclenché par des mots-clés de l'offre.
 * Le générateur garde les 3 preuves qui matchent le plus l'offre (titre + description).
 */
import type { TrackId } from "./profile";

export interface Proof {
  id: string;
  /** Mots-clés de l'offre qui rendent cette preuve pertinente */
  keywords: RegExp;
  /** Catégories pour lesquelles cette preuve est mise en avant par défaut */
  tracks: TrackId[];
  fr: string;
  en: string;
}

export const PROOFS: Proof[] = [
  {
    id: "ai_agents",
    keywords: /\b(agents?|agentic|agentique|rag|mcp|retrieval|llms?|genai|gen ai|ia g[ée]n[ée]rative|generative|ai|ia|openai|claude|anthropic|gpt)\b/gi,
    tracks: ["ai_integration", "deployment"],
    fr: "Pour Fleatch, un SaaS de gestion de flottes, j'ai intégré des agents IA, du RAG et du MCP, en plus du suivi temps réel des véhicules.",
    en: "For Fleatch, a fleet management SaaS, I integrated AI agents, RAG and MCP, alongside real-time vehicle tracking.",
  },
  {
    id: "n8n_claude",
    keywords: /\b(n8n|workflows?|automati\w*|claude|anthropic|llms?|documents?|files?|fichiers?|extraction|ocr|orchestration)\b/gi,
    tracks: ["ai_integration", "nocode_ops"],
    fr: "Chez Karrosserie.Pro, j'ai mis en place des workflows n8n connectés à Claude pour analyser des fichiers, puis réintégré certains de ces workflows dans le code pour les fiabiliser.",
    en: "At Karrosserie.Pro, I built n8n workflows connected to Claude to analyze files, then moved some of them into code to make them more reliable.",
  },
  {
    id: "nocode_beev",
    keywords: /\b(make|zapier|hubspot|airtable|slack|google sheets|crm|no-?code|low-?code|rev ?ops|biz ?ops|ops|integrations?|int[ée]grations?)\b/gi,
    tracks: ["nocode_ops", "deployment"],
    fr: "Chez Beev, j'ai mis en place des automatisations Make et Zapier (messages Slack, alimentation d'Airtable et Google Sheets) et déployé HubSpot, avant de réimplémenter ces flux dans le code pour réduire la dette technique.",
    en: "At Beev, I set up Make and Zapier automations (Slack messages, Airtable and Google Sheets data filling) and rolled out HubSpot, before rebuilding these flows in code to reduce technical debt.",
  },
  {
    id: "einvoicing",
    keywords: /\b(factur\w*|invoic\w*|e-?invoicing|comptab\w*|accounting|erp|r[ée]glementa\w*|regulat\w*|compliance|conformit[ée]|fintech|finance|paiements?|payments?)\b/gi,
    tracks: ["deployment", "project_product"],
    fr: "Chez Karrosserie.Pro, SaaS comptable, j'ai piloté l'intégration de la facturation électronique obligatoire (Factur-X, plateforme agréée), de l'analyse réglementaire à la mise en production.",
    en: "At Karrosserie.Pro, an accounting SaaS, I led the integration of mandatory e-invoicing (Factur-X, certified platform), from regulatory analysis to production.",
  },
  {
    id: "backend",
    keywords: /\b(nest\.?js|nestjs|node\.?js|node|typescript|postgres\w*|sql|back-?end|apis?|architecture|data model|mod[eè]le de donn[ée]es|microservices?|ddd)\b/gi,
    tracks: ["fullstack"],
    fr: "Chez Beev, j'ai conçu from scratch un back-end NestJS et son modèle de données PostgreSQL, socle d'un SaaS de gestion de flottes et de supervision de bornes de recharge.",
    en: "At Beev, I designed and built from scratch a NestJS backend and its PostgreSQL data model, the foundation of a fleet management and EV charging monitoring SaaS.",
  },
  {
    id: "frontend",
    keywords: /\b(react|next\.?js|front-?end|ui|ux|interfaces?|dashboards?|tableaux? de bord)\b/gi,
    tracks: ["fullstack"],
    fr: "Côté front, je développe en React et Next.js : backoffice de catalogue, tableaux de bord de supervision, calculateur TCO et simulateur de recharge.",
    en: "On the frontend, I work with React and Next.js: catalog back office, monitoring dashboards, TCO calculator and charging simulator.",
  },
  {
    id: "cicd",
    keywords: /\b(ci\/cd|ci-cd|github actions|gitlab|docker|containers?|conteneurs?|deploy\w*|d[ée]ploiement|devops|tests?|qualit[ée]|release)\b/gi,
    tracks: ["devops", "fullstack"],
    fr: "J'ai mis en place les tests unitaires et les pipelines CI/CD (GitHub Actions) et conteneurisé les services avec Docker pour fiabiliser les mises en production.",
    en: "I set up unit tests and CI/CD pipelines (GitHub Actions) and containerized services with Docker to make production releases reliable.",
  },
  {
    id: "infra",
    keywords: /\b(kubernetes|k8s|aws|gcp|cloud|clusters?|linux|bash|shell|scripts?|infra\w*|sre|exploitation|production|monitoring|observabilit\w*)\b/gi,
    tracks: ["devops"],
    fr: "Chez Digital Virgo, j'ai exploité des clusters Kubernetes / AWS et des bases de données de production, et développé des outils d'automatisation de tâches système.",
    en: "At Digital Virgo, I operated Kubernetes / AWS clusters and production databases, and built system task automation tools.",
  },
  {
    id: "delivery",
    keywords: /\b(clients?|customers?|onboarding|d[ée]ploiement|deployment|implementation|impl[ée]mentation|recette|uat|formation|training|go-?live|adoption|success)\b/gi,
    tracks: ["deployment", "project_product"],
    fr: "J'ai mené de A à Z le déploiement d'un SaaS B2B de gestion de flottes : recette, mise en production et formation des utilisateurs.",
    en: "I delivered a B2B fleet management SaaS end to end: acceptance testing, production release and user training.",
  },
  {
    id: "product",
    keywords: /\b(product|produit|backlog|roadmap|priori\w*|agile|scrum|jira|notion|sprints?|sp[ée]cifications?|specs?|user stor\w*|owner|po|pm|discovery)\b/gi,
    tracks: ["project_product"],
    fr: "Sur Karrosserie.Pro et Fleatch, je gère la priorisation du backlog, les tickets et la documentation produit sous Notion ; chez Beev, je rédigeais les spécifications techniques et travaillais en sprints.",
    en: "On Karrosserie.Pro and Fleatch, I own backlog prioritization, tickets and product documentation in Notion; at Beev, I wrote technical specifications and worked in sprints.",
  },
  {
    id: "requirements",
    keywords: /\b(besoins?|requirements?|m[ée]tiers?|business|stakeholders?|parties prenantes|fonctionnel\w*|functional|refonte|transformation|syst[eè]mes? d'information)\b/gi,
    tracks: ["project_product", "deployment"],
    fr: "Chez Beev, j'ai recueilli les besoins des équipes métier et remplacé des outils fragmentés par une plateforme unifiée, ce qui a fortement réduit la dette technique.",
    en: "At Beev, I gathered requirements from business teams and replaced fragmented tools with a unified platform, drastically reducing technical debt.",
  },
  {
    id: "ev_domain",
    keywords: /\b(mobilit\w*|ev|[ée]lectriques?|electric|fleets?|flottes?|v[ée]hicules?|vehicles?|charging|bornes?|iot|[ée]nergie|energy|transport|logisti\w*)\b/gi,
    tracks: [],
    fr: "Je connais bien la mobilité électrique : calculateur de coût total de possession, simulateur de recharge et supervision IoT de bornes.",
    en: "I know electric mobility well: total cost of ownership calculator, charging simulator and IoT charging station monitoring.",
  },
];

/** Accroche selon la catégorie du poste */
export const HOOKS: Record<TrackId, { fr: string; en: string }> = {
  fullstack: {
    fr: "Développeur full stack TypeScript depuis plus de 7 ans, je conçois des SaaS métier de bout en bout, du modèle de données jusqu'au déploiement.",
    en: "A full stack TypeScript developer with 7+ years of experience, I build business SaaS products end to end, from the data model to deployment.",
  },
  ai_integration: {
    fr: "J'intègre l'IA dans des produits SaaS qui tournent en production : agents IA, RAG, MCP et workflows connectés aux LLM comme Claude et ChatGPT.",
    en: "I bring AI into SaaS products running in production: AI agents, RAG, MCP and workflows connected to LLMs such as Claude and ChatGPT.",
  },
  devops: {
    fr: "Issu du développement full stack, je prends en charge depuis plus de 4 ans la chaîne de livraison des applications que je construis : CI/CD, Docker, déploiements AWS / GCP et mises en production.",
    en: "Coming from full stack development, I have owned the delivery chain of the applications I build for 4+ years: CI/CD, Docker, AWS / GCP deployments and production releases.",
  },
  deployment: {
    fr: "Développeur de formation, je travaille depuis plus de 7 ans au contact des clients et des équipes métier pour déployer des solutions SaaS : intégrations, recette, mise en production et formation.",
    en: "An engineer by training, I have spent 7+ years working with clients and business teams to roll out SaaS solutions: integrations, acceptance testing, production releases and training.",
  },
  project_product: {
    fr: "Développeur full stack de formation, j'ai porté des produits SaaS B2B du recueil des besoins à la mise en production, en Agile.",
    en: "A full stack developer by training, I have taken B2B SaaS products from requirements gathering to production, in Agile.",
  },
  nocode_ops: {
    fr: "J'automatise des processus métier avec n8n, Make, Zapier, HubSpot et Airtable, et je sais quand basculer un workflow dans le code pour le fiabiliser.",
    en: "I automate business processes with n8n, Make, Zapier, HubSpot and Airtable, and I know when to move a workflow into code to make it reliable.",
  },
};

/**
 * Tes compétences réelles (et leur libellé propre). La lettre ne cite QUE celles-ci,
 * quand l'offre les mentionne — jamais un outil que tu ne maîtrises pas.
 */
export const MY_SKILLS: Array<[RegExp, string]> = [
  [/\btypescript\b/i, "TypeScript"],
  [/\bnode(\.?js)?\b/i, "Node.js"],
  [/\bnest\.?js\b/i, "NestJS"],
  [/\breact(\.?js)?\b/i, "React"],
  [/\bnext\.?js\b/i, "Next.js"],
  [/\bfigma\b/i, "Figma"],
  [/\bpostgres(ql)?\b/i, "PostgreSQL"],
  [/\bmysql\b/i, "MySQL"],
  [/\bphp\b/i, "PHP"],
  [/\bpython\b/i, "Python"],
  [/\bdocker\b/i, "Docker"],
  [/\bkubernetes|\bk8s\b/i, "Kubernetes"],
  [/\bci\/cd|\bci-cd\b|github actions/i, "CI/CD"],
  [/\baws\b|amazon web services/i, "AWS"],
  [/\bgcp\b|google cloud/i, "GCP"],
  [/\blinux\b/i, "Linux"],
  [/\b(api rest|rest api|restful)\b/i, "API REST"],
  [/\bllms?\b|large language models?/i, "LLM"],
  [/\bclaude\b|\banthropic\b/i, "Claude"],
  [/\bopenai\b|\bchatgpt\b|\bgpt-?\d/i, "OpenAI"],
  [/\brag\b|retrieval[- ]augmented/i, "RAG"],
  [/\bmcp\b|model context protocol/i, "MCP"],
  [/\bai agents?\b|\bagents? ia\b|\bagentic\b|\bagentique\b/i, "agents IA"],
  [/\bn8n\b/i, "n8n"],
  [/\bmake\.com\b|\bintegromat\b/i, "Make"],
  [/\bzapier\b/i, "Zapier"],
  [/\bhubspot\b/i, "HubSpot"],
  [/\bairtable\b/i, "Airtable"],
  [/\bnotion\b/i, "Notion"],
  [/\bjira\b/i, "Jira"],
  [/\bscrum\b/i, "Scrum"],
  [/\bagile\b/i, "Agile"],
  [/\bddd\b|domain[- ]driven/i, "DDD"],
  [/\biot\b/i, "IoT"],
  [/factur-?x|e-?invoicing|facturation [ée]lectronique/i, "facturation électronique"],
];
