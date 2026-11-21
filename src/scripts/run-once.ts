/** Lance une seule fois les sources (toutes, ou celles passées en argument) puis s'arrête. Ex : npm run once -- remoteok lever */
import { migrate, sql } from "../lib/db";
import { SOURCES } from "../sources";
import { runSource } from "../worker/pipeline";

await migrate();
const only = process.argv.slice(2);
for (const s of SOURCES.filter((s) => s.enabled() && (!only.length || only.includes(s.id)))) await runSource(s);
await sql.end();
