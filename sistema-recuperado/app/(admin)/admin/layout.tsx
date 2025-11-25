import Link from 'next/link';
import { Inter } from 'next/font/google';
import './admin.css';
import AdminRoute from '@/components/AdminRoute';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Painel Administrativo',
  description: 'Painel de controle administrativo',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="flex h-screen bg-gray-100">
          {/* Sidebar */}
          <div className="bg-gray-800 text-white w-64 flex-shrink-0">
            <div className="p-4">
              <h1 className="text-2xl font-bold">Admin</h1>
            </div>
            <nav className="mt-6">
              <div>
                <Link 
                  href="/admin" 
                  className="flex items-center px-6 py-3 text-gray-200 hover:bg-gray-700"
                >
                  <span>Dashboard</span>
                </Link>
                <Link 
                  href="/admin/contents" 
                  className="flex items-center px-6 py-3 text-gray-200 hover:bg-gray-700"
                >
                  <span>Conteúdos</span>
                </Link>
                <Link 
                  href="/admin/logs" 
                  className="flex items-center px-6 py-3 text-gray-200 hover:bg-gray-700"
                >
                  <span>Logs</span>
                </Link>
                <Link 
                  href="/" 
                  className="flex items-center px-6 py-3 text-gray-200 hover:bg-gray-700 mt-4 border-t border-gray-700"
                >
                  <span>← Voltar ao Site</span>
                </Link>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <main className="p-6">
              <AdminRoute>
                {children}
              </AdminRoute>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
