import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Visitas Domiciliarias - MEDHOME",
  description: "Sistema de gestión de visitas domiciliarias",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

