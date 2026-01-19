import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Command, Loader2, ArrowRight, Star, Hexagon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabaseClient';

const BRAND_LOGO = "https://cdn-icons-png.flaticon.com/512/2964/2964063.png";

interface Portal {
  id: string;
  name: string;
  image_url: string | null;
  description: string | null;
  logo?: string;
  settings?: Record<string, any>;
}

export default function MobilePortalSelection() {
  const router = useRouter();
  const { theme } = useTheme();
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPortal, setHoveredPortal] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPortals() {
      try {
        const { data, error } = await supabase
          .from('portals')
          .select('*');

        if (error) {
          console.error('Error fetching portals:', error);
        } else {
          // Cast the data to match the Portal interface, treating settings as Record<string, any>
          setPortals((data as any[])?.map(p => ({
            ...p,
            settings: p.settings || {}
          })) || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPortals();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-mozart-pink" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-[#0a0a0a] selection:bg-mozart-pink selection:text-white">

      {/* Dynamic Background Backdrop based on hover */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${hoveredPortal ? 'opacity-90' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-black/80 dark:bg-black/90 z-0"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center justify-center h-full px-6 py-8">

        {/* Header - More Compact */}
        <div
          className={`text-center mb-8 md:mb-12 shrink-0 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${hoveredPortal ? 'opacity-30 blur-sm scale-95' : 'opacity-100 blur-0 scale-100'}`}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(255,255,255,0.05)] transform hover:rotate-12 transition-transform duration-500">
            <img
              src={BRAND_LOGO}
              className={`w-8 h-8 object-contain transition-all duration-500 ${theme === 'dark' ? 'filter brightness-0 invert' : 'filter brightness-0 opacity-80'}`}
              alt="Logo"
            />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-gray-900 dark:text-white mb-4 tracking-tighter leading-tight">
            Selecione seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-mozart-pink to-purple-600 animate-gradient-x">Domínio</span>
          </h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-light max-w-xl mx-auto tracking-wide">
            Entre em um ambiente especializado projetado para <span className="text-gray-900 dark:text-white font-medium">trabalho profundo</span> e flow.
          </p>
        </div>

        {/* The Portals Container - Fixed Height within Viewport */}
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl justify-center items-stretch perspective-1000 shrink-0">
          {portals.map((portal, idx) => {
            const isHovered = hoveredPortal === portal.id;
            const isBlurred = hoveredPortal !== null && hoveredPortal !== portal.id;

            // Resolve images
            const coverImage = portal.settings?.banner_url || portal.image_url || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop';
            const logo = portal.settings?.logo_url || BRAND_LOGO;

            return (
              <div
                key={portal.id}
                onClick={() => router.push(`/members/${portal.id}`)}
                onMouseEnter={() => setHoveredPortal(portal.id)}
                onMouseLeave={() => setHoveredPortal(null)}
                className={`
                        relative group flex-1 
                        h-[350px] md:h-[420px] lg:h-[480px] 
                        rounded-[1.5rem] overflow-hidden cursor-pointer 
                        transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                        border border-white/20 dark:border-white/10
                        ${isHovered ? 'md:flex-[1.8] scale-[1.02] shadow-[0_20px_80px_rgba(0,0,0,0.4)] z-20 ring-1 ring-white/20' : ''}
                        ${isBlurred ? 'opacity-40 scale-95 grayscale-[0.8] blur-[2px]' : 'opacity-100 grayscale-0'}
                        ${!hoveredPortal ? 'hover:shadow-xl' : ''}
                      `}
              >
                {/* Background Image with Parallax Effect */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] ease-out group-hover:scale-110"
                  style={{ backgroundImage: `url(${coverImage})` }}
                ></div>

                {/* Overlay Gradient - Darker at bottom */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/90 dark:to-black transition-opacity duration-500 group-hover:opacity-80"></div>

                {/* Active Glow Gradient (Only on Hover) */}
                <div className={`absolute inset-0 bg-gradient-to-tr from-mozart-pink/20 to-purple-500/0 opacity-0 transition-opacity duration-700 ${isHovered ? 'opacity-100' : ''}`}></div>

                {/* Content Content */}
                <div className="absolute inset-0 p-6 md:p-8 lg:p-10 flex flex-col justify-end z-10">

                  {/* Floating Badge */}
                  <div className="absolute top-6 left-6 transform -translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 delay-100">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[9px] font-bold text-white tracking-[0.2em] uppercase shadow-lg">
                      {idx === 0 ? <Star size={10} className="text-yellow-400 fill-current" /> : <Hexagon size={10} className="text-blue-400 fill-current" />}
                      {idx === 0 ? 'Acesso Premium' : 'Área de Membros'}
                    </span>
                  </div>

                  <div className="transform transition-transform duration-700 group-hover:-translate-y-2">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/10 shadow-lg transition-all duration-500 ${isHovered ? 'bg-mozart-pink border-mozart-pink scale-110' : ''}`}>
                        <img src={logo} className="w-6 h-6 object-contain filter brightness-0 invert" alt="" />
                      </div>
                      <div className={`h-px bg-white/30 flex-1 origin-left transition-all duration-700 ${isHovered ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></div>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3 leading-none tracking-tight">
                      {portal.name.split(' ').map((word, i) => (
                        <span key={i} className="block">{word}</span>
                      ))}
                    </h2>

                    <p className={`text-gray-300 text-xs md:text-sm font-light leading-relaxed max-w-sm border-l-2 border-mozart-pink/50 pl-4 transition-all duration-700 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-2 line-clamp-2 md:line-clamp-none'}`}>
                      {portal.description || 'Acesso exclusivo para membros da comunidade.'}
                    </p>
                  </div>

                  {/* CTA Button - Reveals on Hover */}
                  <div className={`mt-6 overflow-hidden transition-all duration-700 ease-out ${isHovered ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <button className="group/btn flex items-center gap-3 text-white">
                      <div className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center group-hover/btn:bg-white group-hover/btn:text-black transition-all duration-300">
                        <ArrowRight size={16} className="transform -rotate-45 group-hover/btn:rotate-0 transition-transform duration-300" />
                      </div>
                      <span className="text-xs font-bold tracking-widest uppercase">Entrar no Portal</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer - Stick to bottom of container but fade out */}
        <div className={`mt-8 md:mt-12 transition-opacity duration-500 ${hoveredPortal ? 'opacity-0' : 'opacity-40'}`}>
          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 font-bold tracking-[0.3em] uppercase">
            <Command size={12} /> Powered by Mozart LMS
          </div>
        </div>

      </div>
    </div>
  );
}
