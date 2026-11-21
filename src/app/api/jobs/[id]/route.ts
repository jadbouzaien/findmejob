import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { JOB_STATUSES } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [job] = await sql`select description, salary_text from jobs where id = ${Number(id)}`;
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = (await req.json()) as { status?: string };
  if (!status || !(JOB_STATUSES as readonly string[]).includes(status))
    return NextResponse.json({ error: "statut invalide" }, { status: 400 });
  await sql`update jobs set status = ${status}, status_updated_at = now() where id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
