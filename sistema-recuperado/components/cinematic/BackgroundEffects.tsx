import React from 'react';

const BackgroundEffects: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Top Center Glow - Spotlight for Title */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-pink/10 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow" />

            {/* Bottom Right Ambient */}
            <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-purple/10 blur-[100px] rounded-full mix-blend-screen" />

            {/* Grain overlay for film texture */}
            <div className="absolute inset-0 opacity-[0.03] bg-noise" />
        </div>
    );
};

export default BackgroundEffects;
