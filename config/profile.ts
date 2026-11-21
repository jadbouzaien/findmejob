import "../src/lib/env"; // charge .env avant de lire SALARY_*
/**
 * TON PROFIL DE RECHERCHE — c'est ici que tu règles tout le scoring.
 * Après modification : `npm run rescore` recalcule les scores des offres déjà en base.
 */

export type TrackId =
  | "fullstack"
  | "ai_integration"
  | "devops"
  | "deployment"
  | "project_product"
  | "nocode_ops";

export interface Track {
  id: TrackId;
  label: string;
  /** Fichier dans /cvs à envoyer pour ce type de poste (offre en français) */
  cv: string;
  /** CV pour une offre rédigée en anglais */
  cvEn: string;
  /** CV spécifiques selon le titre : [regex titre, cv FR, cv EN] (prioritaire) */
  cvByTitle?: Array<[RegExp, string, string]>;
  /**
   * Ton expérience réelle DANS CE MÉTIER : au-delà, les années demandées par l'offre sont pénalisées.
   * seniorTitle = pénalité si le titre dit "Senior / Confirmé / Expérimenté".
   */
  seniority: { years: number; seniorTitle: number; excludeSeniorIf?: RegExp };
  /** Titre très aligné → 45 pts */
  strongTitle: RegExp[];
  /** Titre compatible mais générique → 25 pts */
  weakTitle: RegExp[];
  /** Compétences recherchées dans titre + description (poids = points) */
  skills: Array<[RegExp, number]>;
  /** Pénalités spécifiques à la catégorie (ex: stack non maîtrisée) */
  penalties?: Array<[RegExp, number, string]>;
}

const w = (s: string) => new RegExp(`(^|[^a-z0-9])(${s})([^a-z0-9]|$)`, "i");

export const TRACKS: Track[] = [
  {
    id: "fullstack",
    seniority: { years: 7, seniorTitle: 0 },
    label: "Dev Fullstack JS",
    cv: "CV_Jad_Bouzaien_FR.pdf",
    cvEn: "CV_Jad_Bouzaien_EN.pdf",
    strongTitle: [
      w("full[- ]?stack"),
      w("fullstack"),
      w("node(\\.?js)?|nest(\\.?js)?|typescript|react|next\\.?js|javascript"),
      w("d[ée]veloppeur(se)? web|web developer|software engineer.*(node|typescript|react)"),
    ],
    weakTitle: [
      w("d[ée]veloppeu(r|se)|developer|software engineer|ing[ée]nieur (logiciel|d[ée]veloppement|d[ée]v)|product engineer"),
      w("back[- ]?end|front[- ]?end"),
    ],
    skills: [
      [w("typescript|ts"), 5],
      [w("node(\\.?js)?"), 5],
      [w("nest\\.?js|nestjs"), 5],
      [w("react(\\.?js)?"), 4],
      [w("next\\.?js"), 4],
      [w("javascript|js"), 2],
      [w("postgres(ql)?|postgre"), 4],
      [w("sql|mysql"), 2],
      [w("docker"), 2],
      [w("aws|gcp|google cloud"), 2],
      [w("ci/cd|github actions"), 2],
      [w("api rest|rest api|restful|graphql"), 2],
      [w("figma"), 1],
      [w("saas"), 2],
      [w("llm|openai|claude|anthropic|ia g[ée]n[ée]rative|genai|ai agents?|agents? ia"), 3],
      [w("php|symfony|laravel"), 1],
    ],
    penalties: [
      [w("java(?!script)|spring|j2ee|jee"), 30, "Stack Java"],
      [w("\\.net|c#|dotnet|asp\\.net"), 30, "Stack .NET"],
      [w("ruby|rails|scala|elixir|kotlin|swift|ios|android|flutter|golang|rust|c\\+\\+|embedded|embarqu[ée]"), 25, "Stack non maîtrisée"],
      [w("angular|vue\\.?js|vuejs|nuxt"), 6, "Front Angular/Vue (pas React)"],
      [w("salesforce|sap|abap|wordpress only|magento|shopify"), 15, "Écosystème éditeur"],
    ],
  },
  {
    id: "ai_integration",
    seniority: { years: 4, seniorTitle: 5 },
    label: "Intégration IA / Automatisation",
    cv: "CV_Jad_Bouzaien_IA_FR.pdf",
    cvEn: "CV_Jad_Bouzaien_AI_EN.pdf",
    strongTitle: [
      w("ai (automation|integration|solutions?|application|product|implementation|workflow|agents?) (engineer|developer|specialist|consultant)"),
      w("(applied|genai|gen ai|llm|generative ai) engineer"),
      w("ai engineer|ai developer|agentic|ai agents?"),
      w("forward[- ]deployed (engineer|software engineer|deployment)"),
      w("automation engineer|workflow automation"),
      w("(d[ée]veloppeur|ing[ée]nieur|int[ée]grateur|consultant)( \\w+)? (ia|intelligence artificielle|ia g[ée]n[ée]rative)"),
      w("prompt engineer"),
    ],
    weakTitle: [w("ai|ia|llm|genai|automation|automatisation")],
    skills: [
      [w("llms?|large language models?"), 5],
      [w("openai|gpt-?\\d?|chatgpt"), 4],
      [w("claude|anthropic"), 5],
      [w("agents?|agentic|multi-agents?|agentique"), 4],
      [w("rag|retrieval|vector (db|database)|embeddings?|pgvector"), 3],
      [w("langchain|langgraph|llamaindex|mcp|model context protocol"), 3],
      [w("n8n|make\\.com|zapier"), 4],
      [w("prompt(ing| engineering)?"), 2],
      [w("api integrations?|int[ée]grations? api|webhooks?"), 3],
      [w("typescript|node(\\.?js)?|python"), 3],
      [w("workflows?|orchestration"), 3],
      [w("saas|b2b"), 2],
    ],
    penalties: [
      [w("phd|doctorat|research scientist|ml researcher"), 25, "Profil recherche / PhD"],
      [w("pytorch|tensorflow|jax|cuda|model training|fine-?tuning|pre-?training|computer vision|mlops"), 12, "ML pur (entraînement de modèles)"],
    ],
  },
  {
    id: "devops",
    // DevOps : CI/CD et déploiements en tant que dev (~3 ans), jamais le titre DevOps à temps plein.
    // Un poste DevOps / SRE / Platform SENIOR n'est pas ton profil → offre masquée.
    seniority: {
      years: 3,
      seniorTitle: 20,
      excludeSeniorIf: w("devops|dev ops|devsecops|sre|site reliability|platform|cloud|infrastructure|infra|syst[eè]mes?|production|release|build"),
    },
    label: "DevOps / Cloud / Production",
    cv: "CV_Jad_Bouzaien_DevOps.pdf",
    cvEn: "CV_Jad_Bouzaien_DevOps_EN.pdf",
    strongTitle: [
      w("devops|dev ops|devsecops"),
      w("sre|site reliability"),
      w("platform engineer|cloud engineer|infrastructure engineer|ing[ée]nieur (cloud|infrastructure|production|d'exploitation|exploitation)"),
      w("build (and|&) release|release engineer|ci/cd engineer"),
    ],
    weakTitle: [w("cloud|infrastructure|syst[eè]mes?|sysadmin|administrateur|exploitation|production")],
    skills: [
      [w("docker|containers?|conteneurs?"), 5],
      [w("kubernetes|k8s|helm"), 4],
      [w("ci/cd|ci-cd|github actions|gitlab[- ]ci|jenkins"), 5],
      [w("aws"), 4],
      [w("gcp|google cloud"), 3],
      [w("linux|bash|shell"), 3],
      [w("python"), 2],
      [w("postgres(ql)?|mysql|sql"), 2],
      [w("terraform|ansible|iac|infrastructure as code"), 2],
      [w("prometheus|grafana|datadog|monitoring|observability"), 2],
      [w("node(\\.?js)?|typescript"), 2],
    ],
    penalties: [
      [w("azure"), 6, "Azure (non maîtrisé)"],
      [w("windows server|active directory|vmware|citrix|r[ée]seau|cisco|t[ée]l[ée]com"), 12, "Infra système/réseau classique"],
      [w("habilitation|secret d[ée]fense|clearance|security clearance"), 30, "Habilitation requise"],
    ],
  },
  {
    id: "deployment",
    seniority: { years: 5, seniorTitle: 5 },
    label: "Déploiement SaaS / Solutions / Intégration",
    cv: "CV_Jad_Bouzaien_Chef_de_projet_deploiement.pdf",
    cvEn: "CV_Jad_Bouzaien_AI_EN.pdf", // solutions / FDE en anglais : profil technique IA
    strongTitle: [
      w("chef(fe)? de projet (d[ée]ploiement|int[ée]gration|implementation|impl[ée]mentation|onboarding)"),
      w("(implementation|integration|onboarding|deployment) (manager|consultant|engineer|specialist|lead)"),
      w("solutions? (engineer|architect|consultant)|sales engineer|presales|avant[- ]vente"),
      w("customer (success )?engineer|technical account manager|technical customer success"),
      w("consultant(e)? (fonctionnel|technique|technico[- ]fonctionnel|saas|int[ée]gration)"),
      w("int[ée]grateur|integrator"),
    ],
    weakTitle: [w("d[ée]ploiement|deployment|onboarding|implementation|impl[ée]mentation|customer success|support (engineer|technique)")],
    skills: [
      [w("saas"), 5],
      [w("b2b"), 3],
      [w("api|apis|rest api|restful"), 4],
      [w("sql|postgres(ql)?"), 4],
      [w("int[ée]grations?|integrations?"), 3],
      [w("recette|uat|tests? fonctionnels?"), 3],
      [w("onboarding|d[ée]ploiement|deployment|implementation|go[- ]live|mise en production"), 3],
      [w("crm|hubspot|zoho"), 3],
      [w("facturation|e-?invoicing|factur-x|comptabilit[ée]|accounting|erp"), 4],
      [w("flottes?|fleet|mobilit[ée]|ev|v[ée]hicules? [ée]lectriques?|bornes?"), 4],
      [w("json|csv|webhooks?|etl"), 2],
      [w("client|customers?"), 1],
    ],
  },
  {
    id: "project_product",
    // PO/PM : ~1 an (freelance 2025-2026), jamais en poste à temps plein.
    // Un poste Product Manager / Owner SENIOR n'est pas ton profil → offre masquée (pas juste pénalisée).
    seniority: { years: 1, seniorTitle: 20, excludeSeniorIf: w("product (manager|owner|lead)|pm|po|proxy po") },
    label: "Chef de projet / PO / PM technique",
    cv: "CV_Jad_Bouzaien_Chef_de_projet.pdf",
    cvEn: "CV_Jad_Bouzaien_PO_PM_EN.pdf",
    cvByTitle: [[w("product|produit|po|owner|pm"), "CV_Jad_Bouzaien_PO_PM_FR.pdf", "CV_Jad_Bouzaien_PO_PM_EN.pdf"]],
    strongTitle: [
      w("chef(fe)? de projet( (informatique|technique|digital|num[ée]rique|web|si|it|moa|amoa|moe))?"),
      w("(technical |it |digital )?project manager"),
      w("product owner|po technique|proxy po"),
      w("(technical )?product manager"),
      w("delivery manager|program manager|scrum master"),
    ],
    weakTitle: [w("projet|project|product|produit|amoa|moa|coordinat(eur|rice|or)")],
    skills: [
      [w("agile|scrum|kanban"), 3],
      [w("jira|confluence|notion|linear|figma"), 2],
      [w("sp[ée]cifications?|cahier des charges|user stories|backlog"), 4],
      [w("recette|uat|qa"), 3],
      [w("saas|b2b"), 3],
      [w("api|int[ée]grations?|integrations?"), 3],
      [w("roadmap|discovery|priorisation|prioritization"), 3],
      [w("technique|technical|d[ée]veloppeurs?|developers?"), 2],
      [w("refonte|syst[eè]mes? d'information|migration"), 3],
      [w("ia|ai|llm"), 2],
    ],
    penalties: [
      [w("pmp|prince2"), 5, "Certification PM demandée"],
      [w("btp|construction|g[ée]nie civil|industriel|usine|pharma|clinique|marketing digital|[ée]v[ée]nementiel"), 20, "Projet hors IT"],
    ],
  },
  {
    id: "nocode_ops",
    seniority: { years: 5, seniorTitle: 5 },
    label: "Ops / No-code / RevOps",
    cv: "CV_Jad_Bouzaien_IA_FR.pdf", // n8n, Make, Zapier, HubSpot, Airtable y figurent
    cvEn: "CV_Jad_Bouzaien_AI_EN.pdf",
    strongTitle: [
      w("no[- ]?code|low[- ]?code"),
      w("rev ?ops|revenue operations|biz ?ops|business operations|sales ops|marketing ops|growth ops|gtm (ops|engineer)|gtm engineer"),
      w("automation (specialist|manager|lead|consultant)|ops automation"),
      w("(operations|ops) (engineer|manager|lead).*(automation|tools|systems)"),
      w("(make|zapier|n8n|airtable|bubble|hubspot|zoho) (developer|expert|specialist|consultant|admin)"),
      w("business systems|internal tools"),
    ],
    weakTitle: [w("ops|operations|op[ée]rations|outils internes")],
    skills: [
      [w("zapier"), 4],
      [w("make\\.com|integromat"), 3],
      [w("n8n"), 5],
      [w("airtable|notion"), 3],
      [w("bubble|softr|glide|retool|webflow"), 3],
      [w("hubspot|zoho|salesforce|pipedrive|crm"), 4],
      [w("api|webhooks?"), 4],
      [w("sql"), 3],
      [w("ia|ai|llm|gpt|claude"), 3],
      [w("automati(on|sation)s?|workflows?"), 4],
      [w("javascript|python|scripts?"), 2],
    ],
  },
];

/** Zones géographiques */
export const LOCATIONS = {
  // Sur site OK
  home: [
    "marseille", "bouches[- ]du[- ]rh[oô]ne", "aix[- ]en[- ]provence", "aubagne", "la ciotat", "vitrolles",
    "marignane", "martigues", "istres", "salon[- ]de[- ]provence", "g[ée]menos", "rousset", "meyreuil",
    "gardanne", "les milles", "cassis", "allauch", "plan[- ]de[- ]cuques", "(^|\\D)13\\d{3}(\\D|$)", "^13 ?-",
  ],
  // Hybride OK, sur site 100% = moins bien
  near: [
    "toulon", "la seyne", "hy[eè]res", "la garde", "six[- ]fours", "var", "(^|\\D)83\\d{3}(\\D|$)", "^83 ?-",
    "montpellier", "h[ée]rault", "(^|\\D)34\\d{3}(\\D|$)", "^34 ?-",
    "avignon", "(^|\\D)84\\d{3}(\\D|$)", "^84 ?-", "n[iî]mes", "arles",
  ],
} as const;

/** Remote accepté */
export const REMOTE_OK_REGIONS =
  /(worldwide|anywhere|global|world|europe|european|emea|eu\b|france|cet|cest|gmt\+[0-2]|utc[+ ]?[0-2]|remote$|^remote\b|international|europa)/i;

/** Remote mais réservé à un autre pays → exclu */
export const REMOTE_RESTRICTED =
  /(us[- ]only|usa only|u\.s\. only|united states only|must (be|reside|live)[^.]{0,40}(united states|u\.s\.|usa|us\b|canada|uk)|authorized to work in the (united states|us|u\.s\.)|work authorization in the (us|united states)|us citizens?|green card|latam only|apac only|canada only|uk only|india only|philippines|pakistan|brazil only|north america only|americas only|us time ?zones? (only|required)|(pst|est|cst|pt|et) (hours|time ?zone) required)/i;

/** Les montants restent dans .env (SALARY_MIN_EUR / SALARY_GOOD_EUR) pour ne pas être publiés */
export const SALARY = {
  /** Plancher annuel brut en € */
  minEur: Number(process.env.SALARY_MIN_EUR ?? 0),
  /** Bonus si au-dessus */
  goodEur: Number(process.env.SALARY_GOOD_EUR ?? Infinity),
  usdToEur: 0.92,
  gbpToEur: 1.17,
  chfToEur: 1.05,
};

/**
 * Pénalités globales (toutes catégories).
 * scope "title" = seulement si le TITRE matche (évite "vous reporterez au Head of Engineering").
 */
export const GLOBAL_PENALTIES: Array<{ re: RegExp; pts: number; label: string; scope: "title" | "all" }> = [
  { re: w("staff|principal|distinguished"), pts: 25, label: "Niveau Staff/Principal", scope: "title" },
  { re: w("head of|director|directeur|directrice|vp|vice president|cto|chief"), pts: 30, label: "Poste de direction", scope: "title" },
  {
    re: w("tech lead|lead tech(nique)?|lead dev(eloper|elopment)?|lead d[ée]v(eloppeur|eloppeuse)?|lead (software|full ?-?stack|front ?-?end|back ?-?end|ai|ia|sofe|web|mobile|platform)( engineer| developer| d[ée]veloppeur)?|lead engineer|(engineer(ing)?|developer|d[ée]veloppeur|full ?-?stack|software|front ?-?end|back ?-?end|ai|ia) (team )?lead|team lead|squad lead|engineering manager|(engineer|ing[ée]nieur|developer|d[ée]veloppeur)s? manager|manager d'[ée]quipe|team manager|people manager|responsable d'[ée]quipe"),
    pts: 5,
    label: "Poste de lead (toi : ~1 an de gestion de projet)",
    scope: "title",
  },
  {
    re: w("fluent (german|dutch|spanish|italian|portuguese|polish|swedish|japanese)|(german|dutch|spanish|italian|portuguese|japanese) (is )?required|native (german|dutch|spanish)|allemand courant|deutsch|flie(ss|ß)end"),
    pts: 30,
    label: "Autre langue requise",
    scope: "all",
  },
];

/**
 * Écosystèmes d'éditeurs que tu ne maîtrises pas (ERP, CRM, plateformes propriétaires).
 * Dans le TITRE → offre masquée (c'est le cœur du poste). Dans la description seulement → −vendorMentionPts.
 * HubSpot et Zoho n'y sont pas : tu les connais.
 */
export const VENDOR_ECOSYSTEMS =
  /(^|[^a-z])(microsoft dynamics|dynamics 365|d365|business central|navision|sap|s\/4 ?hana|abap|salesforce|servicenow|oracle|sage x3|sage 100|cegid|odoo|workday (hcm|integrations?|financials|studio|adaptive|extend|prism|developer|consultant|admin\\w*|analyst|specialist|engineer)|guidewire|pega|sharepoint|power ?platform|power apps|power automate|magento|shopify|sitecore|adobe experience manager|aem|mulesoft|netsuite|infor|ifs)([^a-z]|$)/i;
export const VENDOR_MENTION_PTS = 5;

/**
 * Expérience de lead / management exigée par l'offre. Tu as ~1 an (gestion de projet en freelance).
 * - "N ans à encadrer / en tant que lead" avec N > myYears, ou "proven lead" → offre masquée
 * - mention vague ("management experience", "expérience en encadrement") → −mentionPts
 */
export const LEAD_EXPERIENCE = {
  myYears: 1,
  mentionPts: 8,
  /** capture le nombre d'années */
  yearsRe:
    /(\d+)\s*\+?\s*(?:years?|yrs?|ans|années)\s+(?:of\s+|d['’]\s*)?(?:experience\s+|exp[ée]rience\s+)?(?:(?:as\s+(?:a\s+)?|en\s+tant\s+que\s+|comme\s+|in\s+(?:a\s+)?)?(?:tech(?:nical)?\s+lead|team\s+lead|lead\s+dev(?:eloper)?|engineering\s+manager|lead|manager)\b|(?:leading|managing|mentoring\s+and\s+managing)\s+(?:a\s+team|teams|engineers|developers|people|a\s+squad|squads)|(?:de\s+|en\s+|du\s+)?(?:management|encadrement|people\s+management)\b(?!\s+(?:de\s+|des\s+|du\s+|d['’]\s*)?(?:projets?|programmes?|produits?|delivery|portefeuille)))/i,
  strongRe: w("proven lead|proven track record (of )?(leading|managing) (engineers|developers|teams?|people)|(already|previously) (led|managed) (a team|teams|engineers|developers)"),
  mentionRe: w("people management|management experience|(experience|track record) (leading|managing) (a team|teams|engineers|developers|people|a squad)|exp[ée]rience (r[ée]ussie |significative |confirm[ée]e )?(de|en|du|dans le) (management|encadrement)|encadrement d'(une )?[ée]quipe|d[ée]j[àa] (encadr[ée]|manag[ée])"),
};

/** Exclusions dures (offre masquée) */
export const HARD_EXCLUDE_TITLE: Array<[RegExp, string]> = [
  [w("stage|stagiaire|intern|internship|alternan(ce|t)|apprenti(ssage)?|apprentice|working student|werkstudent"), "Stage / alternance"],
  [w("account executive|sales development|sdr|bdr|business developer|commercial(e)?|recruiter|recruteur|talent acquisition|paralegal|legal counsel|accountant|comptable|designer|copywriter"), "Métier non ciblé"],
  [/(^|[^a-z])marketing(?! ?op)/i, "Marketing (non ciblé)"],
  [VENDOR_ECOSYSTEMS, "Écosystème éditeur non maîtrisé"],
  [w("data scientist|data analyst|analytics engineer|research scientist|research engineer"), "Data science / analyse (non ciblé)"],
];

/**
 * Diplôme : tu as un Bac+4 (RNCP niveau 6, École 42) + Licence Pro.
 * Pénalités quand l'offre demande un Bac+5 / Master / diplôme d'ingénieur.
 */
export const EDUCATION = {
  required: 12, // "De formation Bac+5", "Master requis"
  preferred: 6, // "idéalement", "souhaité", "preferred"
  equivalent: 4, // "ou équivalent", "or equivalent experience"
};

/**
 * Expérience demandée par l'offre vs ton expérience dans le métier (seniority.years de la catégorie) :
 * au-delà → −moderate ; au-delà de +bigGap ans → −severe.
 */
export const EXPERIENCE = { moderate: 10, severe: 20, bigGap: 3 };

/** Mots du titre qui signalent un poste senior */
export const SENIOR_TITLE = /(^|[^a-z])(senior|sr\.?|confirm[ée]e?|exp[ée]riment[ée]e?|group product|group pm)([^a-z]|$)/i;

/** Titres encore plus hauts (utilisés pour les exclusions "pas ton profil") */
export const VERY_SENIOR_TITLE = /(^|[^a-z])(lead|principal|staff|head|director|directeur|directrice|vp|chief|group)([^a-z]|$)/i;

/**
 * Fraîcheur : ajustement ajouté au score de fit selon l'âge de l'offre (date de publication,
 * sinon date de détection). [âge max en heures, points]. Recalculé toutes les 15 min.
 */
export const FRESHNESS: Array<[number, number]> = [
  [24, 5],
  [72, 3],
  [7 * 24, 0],
  [14 * 24, -3],
  [30 * 24, -8],
  [Infinity, -15],
];

/** Seuils de priorité (appliqués au score final = fit + fraîcheur) */
export const PRIORITY = { P1: 75, P2: 60, P3: 45 };
