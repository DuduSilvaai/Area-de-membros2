import React, { useState } from 'react';
import { Play, Pause, Volume2, Maximize, Settings, SkipForward } from 'lucide-react';

interface VideoPlayerProps {
  poster: string;
  onEnded: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ poster, onEnded }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35); // Mock progress

  // Mock video handling
  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl group">
      {/* Video Element Placeholder */}
      <div 
        className="w-full h-full bg-[#0a0a0a] flex items-center justify-center cursor-pointer"
        onClick={togglePlay}
      >
        {!isPlaying && (
          <img src={poster} alt="Video Poster" className="w-full h-full object-cover opacity-60" />
        )}
        
        {isPlaying && (
           // This would be the actual video tag
           <div className="w-full h-full bg-black flex items-center justify-center text-gray-500">
              <video 
                className="w-full h-full object-contain"
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" 
                autoPlay 
                onEnded={onEnded}
                controls={false}
              />
           </div>
        )}

        {!isPlaying && (
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-24 h-24 bg-mozart-pink/90 rounded-full flex items-center justify-center pl-2 hover:scale-110 transition-transform shadow-[0_0_40px_rgba(255,0,128,0.5)] backdrop-blur-sm border-4 border-white/10">
               <Play size={48} fill="white" className="text-white" />
             </div>
           </div>
        )}
      </div>

      {/* Custom Controls Overlay */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/95 via-black/60 to-transparent px-8 py-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/20 rounded-full mb-5 cursor-pointer hover:h-1.5 transition-all group/progress">
          <div className="h-full bg-mozart-pink rounded-full relative" style={{ width: `${progress}%` }}>
             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_#FF0080] opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
          </div>
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-6">
            <button onClick={togglePlay} className="hover:text-mozart-pink transition-colors">
              {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
            </button>
            <div className="flex items-center gap-3 group/vol">
               <Volume2 size={22} className="hover:text-mozart-pink transition-colors" />
               <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300">
                  <div className="w-20 h-1 bg-white/30 rounded ml-2 cursor-pointer">
                     <div className="w-[70%] h-full bg-mozart-pink rounded"></div>
                  </div>
               </div>
            </div>
            <span className="text-sm font-medium text-gray-300 tracking-wide font-mono">12:30 / 45:00</span>
          </div>

          <div className="flex items-center gap-5">
             <button className="text-gray-300 hover:text-white text-sm font-semibold flex items-center gap-1 bg-white/10 px-3 py-1 rounded hover:bg-white/20 transition-all">
                <SkipForward size={14} /> 1.5x
             </button>
             <button className="text-gray-300 hover:text-white transition-transform hover:rotate-45">
                <Settings size={22} />
             </button>
             <button className="text-gray-300 hover:text-white hover:scale-110 transition-transform">
                <Maximize size={22} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;