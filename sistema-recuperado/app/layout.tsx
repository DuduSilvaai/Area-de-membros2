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
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex min-h-screen bg-gray-50">
            {/* Menu Lateral Fixo */}
            <Sidebar />

            {/* Área de Conteúdo (empurrada para a direita) */}
            <div className="flex-1 ml-64 p-8">
              {children}
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}