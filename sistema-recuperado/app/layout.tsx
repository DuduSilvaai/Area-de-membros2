import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema Mozart Recuperado",
  description: "Versão recuperada via engenharia reversa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className} style={{ backgroundColor: "#F5F5F7", color: "#1A1A1A" }}>
        <AuthProvider>
          <div className="flex min-h-screen w-full">
            {/* Menu Lateral Flutuante */}
            <Sidebar />

            {/* Área de Conteúdo */}
            <div className="flex-1" style={{ marginLeft: "284px" }}>
              <main className="min-h-screen" style={{ backgroundColor: "#F5F5F7", padding: "32px 32px 32px 20px" }}>
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
