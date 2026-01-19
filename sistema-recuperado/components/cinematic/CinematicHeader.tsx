import React from 'react';

const CinematicHeader: React.FC = () => {
    return (
        <div className="w-full flex flex-col items-center text-center relative z-10 py-4 animate-fade-in">

            {/* Enhanced Logo Section - Digital Style Recreation */}
            <div className="relative mb-6 group cursor-default">
                {/* Atmospheric Glow behind logo - Restored and intensified */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[220px] bg-[#ff2d78]/10 blur-[90px] rounded-full group-hover:bg-[#ff2d78]/20 transition-all duration-700 pointer-events-none"></div>

                <div className="relative flex flex-col items-center justify-center">
                    {/* Artistic Heart SVG - Thinner, elegant, hand-drawn style */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[340px] h-[250px] opacity-60 dark:opacity-20 pointer-events-none select-none">
                        <svg viewBox="0 0 200 150" fill="none" stroke="url(#roseGradient)" strokeWidth="0.8" className="w-full h-full drop-shadow-[0_0_5px_rgba(230,164,180,0.3)]">
                            <defs>
                                <linearGradient id="roseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="currentColor" className="text-[#FF2D78] dark:text-[#F8D7DA]" />
                                    <stop offset="40%" stopColor="currentColor" className="text-[#E61E6A] dark:text-[#E6A4B4]" />
                                    <stop offset="100%" stopColor="currentColor" className="text-[#D63384] dark:text-[#D63384]" />
                                </linearGradient>
                            </defs>
                            <path d="M100 35 C 80 10, 10 20, 20 65 C 25 95, 90 125, 100 135 C 110 125, 175 95, 180 65 C 190 20, 120 10, 100 35" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M100 35 Q 105 50 100 60" strokeWidth="0.5" opacity="0.6" />
                        </svg>
                    </div>

                    {/* Main Script Text - Rose Gold Gradient - Scaled to fit */}
                    {/* Explicitly using font-family style to force Great Vibes if Tailwind class fails */}
                    <h1
                        className="text-7xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-[#D63384] via-[#E61E6A] to-[#FF2D78] dark:from-[#F8D7DA] dark:via-[#E6A4B4] dark:to-[#D63384] drop-shadow-2xl z-10 pt-8 pb-4 px-4 transform group-hover:scale-105 transition-transform duration-500 leading-tight block"
                        style={{ fontFamily: '"Great Vibes", cursive' }}
                    >
                        Love for Sweet
                    </h1>

                    {/* Subtitle */}
                    <div className="flex items-center gap-4 -mt-2">
                        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#D63384]/40 dark:to-[#E6A4B4]/40"></div>
                        <p className="text-[10px] md:text-xs font-serif tracking-[0.35em] text-[#D63384]/90 dark:text-[#E6A4B4]/70 uppercase shadow-black drop-shadow-sm">
                            Confeitaria & Chocolateria
                        </p>
                        <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#D63384]/40 dark:to-[#E6A4B4]/40"></div>
                    </div>

                </div>
            </div>

            {/* Main Title with HARDCODED Gradient for Safety */}
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-4 tracking-tight w-full mt-2">
                Selecione seu <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF2D78] via-[#E61E6A] to-[#9F1CFF]">Domínio</span>
            </h1>

            {/* Subtitle - Split into two lines as requested */}
            <div className="flex flex-col items-center justify-center gap-1 w-full max-w-2xl mx-auto mb-2 px-4">
                <p className="text-base text-gray-600 dark:text-gray-400 font-light leading-relaxed">
                    Entre em um ambiente especializado projetado para
                </p>
                <p className="text-base text-gray-600 dark:text-gray-400 font-light leading-relaxed">
                    <strong className="text-gray-900 dark:text-white font-medium">aprendizado profundo</strong> e excelência técnica.
                </p>
            </div>

        </div>
    );
};

export default CinematicHeader;
