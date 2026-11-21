import { listJobs, sourceHealth } from "@/lib/queries";
import Dashboard from "./Dashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [jobs, sources] = await Promise.all([listJobs(), sourceHealth()]);
  return <Dashboard initialJobs={jobs} initialSources={sources} />;
}
