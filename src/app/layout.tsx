import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Find Me Job", description: "Offres d'emploi triées par fit" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
