import React, { useState } from 'react';
import { Play, Lock } from 'lucide-react';

interface PortalCardProps {
    title: string;
    subtitle: string;
    imageUrl?: string | null;
    progress: number;
    isLocked?: boolean;
    onClick?: () => void;
}

const PortalCard: React.FC<PortalCardProps> = ({
    title,
    subtitle,
    imageUrl,
    progress = 0,
    isLocked = false,
    onClick
}) => {
    const [isHovered, setIsHovered] = useState(false);

    // Fallback image if null
    const displayImage = imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";

    return (
        <div
            className="group relative flex flex-col w-full bg-white dark:bg-[#111111] rounded-xl overflow-hidden cursor-pointer border border-gray-200 dark:border-white/10 transition-all duration-500 hover:border-brand-pink/30 hover:shadow-[0_0_30px_-5px_rgba(255,45,120,0.3)] hover:-translate-y-2"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            {/* Image Container with Cinematic Ratio */}
            <div className="relative w-full aspect-video overflow-hidden">
                {/* The Image */}
                <img
                    src={displayImage}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-[1.01]"
                />

                {/* Overlay Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-40" />
                <div className={`absolute inset-0 bg-brand-pink/20 mix-blend-overlay transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

                {/* Center Play Button (appears on hover) */}
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                        {isLocked ? (
                            <Lock className="w-6 h-6 text-white/70" />
                        ) : (
                            <Play className="w-6 h-6 text-white fill-white ml-1" />
                        )}
                    </div>
                </div>

                {/* Badges - Only show if progress > 0 */}
                {progress > 0 && (
                    <div className="absolute top-4 left-4">
                        {progress === 100 ? (
                            <span className="px-3 py-1 text-xs font-bold tracking-wider text-black bg-brand-pink rounded-full shadow-lg shadow-brand-pink/20">
                                CONCLUÍDO
                            </span>
                        ) : (
                            <span className="px-3 py-1 text-xs font-bold tracking-wider text-white bg-black/60 backdrop-blur-md border border-white/10 rounded-full">
                                {progress}% CONCLUÍDO
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="relative p-6 flex-1 flex flex-col justify-between z-10">
                <div>
                    <h3 className="text-xl font-serif font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-brand-pink transition-colors duration-300">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-light flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-purple"></span>
                        {subtitle}
                    </p>
                </div>

                {/* Progress Bar (Cinema Style) */}
                <div className="mt-6">
                    <div className="h-1 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-brand-purple to-brand-pink transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Subtle decorative glow at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-pink/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
        </div>
    );
};

export default PortalCard;
