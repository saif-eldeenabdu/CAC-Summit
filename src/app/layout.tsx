import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";

export const metadata: Metadata = {
  title: "MUN Committee Scorer — CAC Summit II",
  description:
    "Professional Model United Nations scoring platform. Score delegates, track participation, calculate rankings, and generate award recommendations in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground font-sans">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
