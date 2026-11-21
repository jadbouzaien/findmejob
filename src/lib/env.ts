import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env"), quiet: true });

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "postgres://findmejob:findmejob@localhost:5433/findmejob",
  telegramToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
  dashboardUrl: process.env.DASHBOARD_URL ?? "http://localhost:3100",
  franceTravailId: process.env.FRANCE_TRAVAIL_CLIENT_ID ?? "",
  franceTravailSecret: process.env.FRANCE_TRAVAIL_CLIENT_SECRET ?? "",
};
