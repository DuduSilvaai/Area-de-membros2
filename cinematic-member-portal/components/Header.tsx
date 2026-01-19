import React from 'react';

const Header: React.FC = () => {
  return (
    <div className="flex flex-col items-center text-center relative z-10 py-12 md:py-20 animate-fade-in">
      
      {/* Enhanced Logo Section - Digital Style Recreation */}
      <div className="relative mb-12 group cursor-default">
        {/* Atmospheric Glow behind logo - Subtle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[200px] bg-brand-rose/5 blur-[100px] rounded-full group-hover:bg-brand-rose/10 transition-all duration-700"></div>
        
        <div className="relative flex flex-col items-center justify-center">
            {/* Artistic Heart SVG - Thinner, elegant, hand-drawn style */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[50%] w-[380px] h-[280px] opacity-30 pointer-events-none select-none">
              <svg viewBox="0 0 200 150" fill="none" stroke="url(#roseGradient)" strokeWidth="0.8" className="w-full h-full drop-shadow-[0_0_5px_rgba(230,164,180,0.3)]">
                <defs>
                  <linearGradient id="roseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F8D7DA" />
                    <stop offset="40%" stopColor="#E6A4B4" />
                    <stop offset="100%" stopColor="#D63384" />
                  </linearGradient>
                </defs>
                {/* stylized ribbon heart path */}
                <path d="M100 35 C 80 10, 10 20, 20 65 C 25 95, 90 125, 100 135 C 110 125, 175 95, 180 65 C 190 20, 120 10, 100 35" strokeLinecap="round" strokeLinejoin="round" />
                {/* Extra decorative swirl for elegance */}
                <path d="M100 35 Q 105 50 100 60" strokeWidth="0.5" opacity="0.6" />
              </svg>
            </div>

            {/* Main Script Text - Rose Gold Gradient 
                Added pt-8 and pb-4 to prevent clipping of ascenders/descenders
                Increased leading to relaxed to give space
            */}
            <h1 className="text-7xl md:text-9xl font-script text-rose-gold drop-shadow-2xl z-10 pt-10 pb-4 px-4 transform group-hover:scale-105 transition-transform duration-500 leading-relaxed block">
              Love for Sweet
            </h1>
            
            {/* Subtitle */}
            <div className="flex items-center gap-4 -mt-2">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-brand-rose/40"></div>
              <p className="text-xs md:text-sm font-serif tracking-[0.35em] text-brand-rose/70 uppercase shadow-black drop-shadow-sm">
                 Confeitaria & Chocolateria
              </p>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-brand-rose/40"></div>
            </div>
            
        </div>
      </div>

      {/* Main Title with Gradient */}
      <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6 tracking-tight">
        Selecione seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-rose via-brand-pink to-brand-purple">Domínio</span>
      </h1>

      {/* Subtitle */}
      <p className="text-lg text-gray-400 font-light max-w-2xl mx-auto mb-4 leading-relaxed">
        Entre em um ambiente especializado projetado para <strong className="text-white font-medium">aprendizado profundo</strong> e excelência técnica.
      </p>

    </div>
  );
};

export default Header;