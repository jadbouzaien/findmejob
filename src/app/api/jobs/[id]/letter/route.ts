import { sql } from "@/lib/db";
import { letterPdf, type LetterJob } from "@/letters/generate";

export const dynamic = "force-dynamic";

/** Génère la lettre de motivation de l'offre à la volée et la renvoie en téléchargement */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [job] = await sql<LetterJob[]>`
    select title, company, location, work_mode, zone, description, track, source
    from jobs where id = ${Number(id)}`;
  if (!job) return new Response("Offre introuvable", { status: 404 });
  try {
    const { pdf, filename } = await letterPdf(job);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return new Response(`Génération impossible : ${(e as Error).message}`, { status: 500 });
  }
}
