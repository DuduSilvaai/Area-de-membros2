import React from 'react';

const BackgroundEffects: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Top Center Glow - Spotlight for Title */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-pink/10 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow" />
      
      {/* Bottom Right Ambient */}
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-purple/10 blur-[100px] rounded-full mix-blend-screen" />
      
      {/* Grain overlay for film texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ 
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
      }} />
    </div>
  );
};

export default BackgroundEffects;