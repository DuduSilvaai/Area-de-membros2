import React from 'react';
import { useTheme } from '../ThemeContext';

const AuroraBackground: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      {/* Base Background Color */}
      <div className="absolute inset-0 bg-gray-50 dark:bg-[#050505] transition-colors duration-700"></div>

      {/* Aurora Orbs - Dark Mode */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`}>
         {/* Top Left - Purple/Pink Mix */}
         <div className="absolute -top-[10%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-purple-900/20 blur-[100px] animate-aurora-1"></div>
         <div className="absolute top-[5%] left-[5%] w-[40vw] h-[40vw] rounded-full bg-mozart-pink/10 blur-[120px] animate-aurora-2"></div>
         
         {/* Bottom Right - Blue/Purple */}
         <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-indigo-900/20 blur-[100px] animate-aurora-3"></div>
      </div>

      {/* Aurora Orbs - Light Mode (Subtle) */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${theme === 'light' ? 'opacity-100' : 'opacity-0'}`}>
         <div className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-mozart-pink/5 blur-[80px] animate-aurora-1"></div>
         <div className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/5 blur-[80px] animate-aurora-3"></div>
      </div>

      {/* Cinematic Noise Overlay */}
      <div className="absolute inset-0 bg-noise mix-blend-overlay opacity-40"></div>
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/20 dark:to-black/80"></div>
    </div>
  );
};

export default AuroraBackground;