export function timeAgo(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.round(ms / 60_000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.round(h / 24);
  return `il y a ${j} j`;
}

export function salaryLabel(min: number | null, max: number | null): string {
  if (!min && !max) return "—";
  const k = (n: number) => `${Math.round(n / 1000)}k€`;
  if (min && max && min !== max) return `${k(min)}–${k(max)}`;
  return k((max ?? min)!);
}

export const MODE_LABEL: Record<string, string> = {
  onsite: "Sur site",
  hybrid: "Hybride",
  remote: "Remote",
  unknown: "",
};

export const STATUS_LABEL: Record<string, string> = {
  new: "Nouveau",
  to_apply: "À postuler",
  applied: "Postulé",
  interview: "Entretien",
  rejected: "Refus",
  ignored: "Ignoré",
  expired: "N'existe plus",
};

export const TRACK_LABEL: Record<string, string> = {
  fullstack: "Dev Fullstack JS",
  ai_integration: "Intégration IA",
  devops: "DevOps / Cloud",
  deployment: "Déploiement SaaS",
  project_product: "Chef de projet / PO",
  nocode_ops: "Ops / No-code",
};
