import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Télécharge le CV conseillé pour l'offre */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [job] = await sql<{ cv: string | null }[]>`select cv from jobs where id = ${Number(id)}`;
  if (!job?.cv) return new Response("Pas de CV associé", { status: 404 });
  const file = basename(job.cv); // pas de traversée de dossier
  try {
    const pdf = await readFile(join(process.cwd(), "cvs", file));
    return new Response(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${file}"` },
    });
  } catch {
    return new Response(`CV introuvable : cvs/${file}`, { status: 404 });
  }
}
