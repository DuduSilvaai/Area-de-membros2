import React, { useState } from 'react';
import Header from './components/Header';
import PortalCard from './components/PortalCard';
import BackgroundEffects from './components/BackgroundEffects';
import { PORTALS } from './constants';
import { Portal } from './types';

const App: React.FC = () => {
  const [portals] = useState<Portal[]>(PORTALS);

  return (
    <div className="min-h-screen w-full relative bg-brand-dark text-white font-sans selection:bg-brand-pink/30 selection:text-brand-pink">
      
      <BackgroundEffects />

      <main className="relative z-10 px-4 sm:px-8 max-w-7xl mx-auto pb-24">
        <Header />

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {portals.map((portal, index) => (
            <div 
              key={portal.id} 
              className="animate-slide-up"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <PortalCard portal={portal} />
            </div>
          ))}
          
          {/* Add New / Empty State placeholder */}
          <div 
             className="group relative flex flex-col w-full aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-brand-pink/30 items-center justify-center cursor-pointer transition-all hover:bg-white/5 animate-slide-up"
             style={{ animationDelay: `${portals.length * 150}ms` }}
          >
             <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                 <span className="text-3xl text-gray-500 group-hover:text-brand-pink font-light">+</span>
             </div>
             <p className="text-gray-500 font-serif group-hover:text-gray-300">Explorar novos cursos</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;