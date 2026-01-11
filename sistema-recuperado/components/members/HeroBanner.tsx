'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Info } from 'lucide-react';

interface HeroBannerProps {
    userFirstName: string;
    featuredCourse?: {
        id: string;
        title: string;
        thumbnail: string;
        progress: number;
    } | null;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ userFirstName, featuredCourse }) => {
    const defaultImage = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';

    return (
        <div className="relative w-full h-[65vh] md:h-[75vh] flex items-end overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] hover:scale-105 ease-linear"
                style={{ backgroundImage: `url(${featuredCourse?.thumbnail || defaultImage})` }}
            ></div>

            {/* Adaptive Gradients */}
            {/* Dark Mode Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent hidden dark:block"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent opacity-90 hidden dark:block"></div>

            {/* Light Mode Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/80 to-transparent dark:hidden block"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-gray-50/60 to-transparent opacity-95 dark:hidden block"></div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-12 pb-16 md:pb-24">
                <div className="max-w-2xl animate-fade-in-up">
                    <span className="inline-block py-1.5 px-4 rounded-full bg-mozart-pink/10 border border-mozart-pink/20 text-mozart-pink text-xs font-bold tracking-widest mb-6 uppercase shadow-[0_0_15px_rgba(255,0,128,0.1)]">
                        {featuredCourse && featuredCourse.progress > 0 ? 'Continuar Aprendendo' : 'Área do Aluno'}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-gray-900 dark:text-white mb-6 leading-tight drop-shadow-sm">
                        {featuredCourse?.title || `Bem-vindo de volta, ${userFirstName}`}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 line-clamp-2 font-light tracking-wide max-w-xl">
                        {featuredCourse ? (
                            <>Olá, <span className="text-gray-900 dark:text-white font-medium">{userFirstName}</span>. Você está progredindo muito bem. Continue de onde parou.</>
                        ) : (
                            <>Explore seus cursos e continue sua jornada de aprendizado.</>
                        )}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        {featuredCourse && (
                            <Link
                                href={`/members/${featuredCourse.id}`}
                                className="flex items-center justify-center gap-3 bg-mozart-pink hover:bg-mozart-pink-dark text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-mozart-pink/25"
                            >
                                <Play fill="currentColor" size={20} />
                                {featuredCourse.progress > 0 ? 'Continuar Assistindo' : 'Começar Agora'}
                            </Link>
                        )}
                        <button
                            className="flex items-center justify-center gap-3 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 backdrop-blur-md text-gray-900 dark:text-white px-8 py-4 rounded-lg font-medium text-lg transition-all border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                        >
                            <Info size={20} />
                            Mais Informações
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroBanner;
