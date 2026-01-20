'use client';

import { Inter, Playfair_Display, Great_Vibes } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({ subsets: ["latin"], variable: '--font-playfair' });
const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin"], variable: '--font-great-vibes' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} ${playfair.variable} ${greatVibes.variable}`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
        <div id="modal-root" />
      </body>
    </html>
  );
}
