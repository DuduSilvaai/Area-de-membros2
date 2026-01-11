'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from 'sonner';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  // Sidebar deve aparecer apenas se NÃO estivermos em /members (ou login, etc se necessário)
  // Mas o requisito principal é esconder dos ALUNOS (/members)
  // Também é bom esconder em login e rotas públicas se já não estiver
  const isMembersArea = pathname?.startsWith('/members');
  const isAuthPage = ['/login', '/signup', '/forgot-password'].some(p => pathname?.startsWith(p));

  const showSidebar = !isMembersArea && !isAuthPage;

  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <div className="flex min-h-screen w-full">
              {/* Menu Lateral Flutuante - Condicional */}
              {showSidebar && <Sidebar />}

              {/* Área de Conteúdo */}
              {/* Se o sidebar estiver visível, mantemos a margem. Se não, tela cheia */}
              <div className="flex-1" style={{ marginLeft: showSidebar ? "284px" : "0" }}>
                <main className="min-h-screen" style={{ padding: showSidebar ? "32px 32px 32px 20px" : "0" }}>
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
