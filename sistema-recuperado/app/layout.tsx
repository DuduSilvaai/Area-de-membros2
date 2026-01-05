import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema Mozart Recuperado",
  description: "Versão recuperada via engenharia reversa",
};

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <div className="flex min-h-screen w-full">
              {/* Menu Lateral Flutuante */}
              <Sidebar />

              {/* Área de Conteúdo */}
              <div className="flex-1" style={{ marginLeft: "284px" }}>
                <main className="min-h-screen" style={{ padding: "32px 32px 32px 20px" }}>
                  {children}
                </main>
              </div>
            </div>
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
