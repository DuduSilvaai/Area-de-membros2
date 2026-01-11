import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Lobby from './pages/Lobby';
import Player from './pages/Player';
import PortalSelection from './pages/PortalSelection';
import Profile from './pages/Profile';
import AuroraBackground from './components/AuroraBackground';
import { ThemeProvider } from './ThemeContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuroraBackground />
      <HashRouter>
        <Routes>
          <Route path="/" element={<PortalSelection />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/members" element={<Navigate to="/lobby" replace />} />
          <Route path="/course/:courseId/lesson/:lessonId" element={<Player />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;