import type { Source } from "../lib/types";
import { greenhouse, lever, ashby } from "./ats";
import { linkedin } from "./linkedin";
import { franceTravail } from "./franceTravail";
import { remoteok, remotive, himalayas, weworkremotely } from "./remoteBoards";

export const SOURCES: Source[] = [greenhouse, lever, ashby, linkedin, franceTravail, remoteok, himalayas, weworkremotely, remotive];

export const SOURCE_LABELS: Record<string, string> = Object.fromEntries(SOURCES.map((s) => [s.id, s.label]));
