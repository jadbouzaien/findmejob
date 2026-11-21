import { NextResponse } from "next/server";
import { listJobs, sourceHealth } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const [jobs, sources] = await Promise.all([listJobs(), sourceHealth()]);
  return NextResponse.json({ jobs, sources });
}
