import React from 'react';
import { User, Settings, LogOut } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <div className="fixed bottom-6 left-6 z-50">
       <div className="group relative">
          <button className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white hover:bg-zinc-800 hover:border-brand-pink/50 hover:shadow-[0_0_15px_rgba(255,45,120,0.4)] transition-all duration-300">
             <span className="font-serif italic text-xl">N</span>
          </button>
          
          {/* Hover Menu */}
          <div className="absolute bottom-full left-0 mb-4 w-48 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-2xl">
              <div className="p-4 border-b border-white/5">
                  <p className="text-sm text-white font-medium">Conta do Aluno</p>
                  <p className="text-xs text-gray-500">aluno@loveforsweet.com</p>
              </div>
              <div className="py-2">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
                      <User size={14} /> Perfil
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
                      <Settings size={14} /> Configurações
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 flex items-center gap-2 transition-colors">
                      <LogOut size={14} /> Sair
                  </button>
              </div>
          </div>
       </div>
    </div>
  );
};

export default Footer;