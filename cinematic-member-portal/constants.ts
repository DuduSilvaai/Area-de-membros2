import { Portal } from './types';

export const PORTALS: Portal[] = [
  {
    id: '1',
    title: 'Masterclass de Confeitaria',
    subtitle: 'Mozart Academy',
    imageUrl: 'https://picsum.photos/id/431/800/450', // Coffee/Tea vibe
    progress: 12,
  },
  {
    id: '2',
    title: 'Red Velvet Perfeito',
    subtitle: 'Módulo Especializado',
    imageUrl: 'https://picsum.photos/id/292/800/450', // Food ingredient vibe
    progress: 100,
  },
  {
    id: '3',
    title: 'Gestão de Negócios',
    subtitle: 'Mozart Academy',
    imageUrl: 'https://picsum.photos/id/1/800/450', // Laptop/Business
    progress: 0,
    isLocked: false,
  },
  {
    id: '4',
    title: 'Fotografia para Doces',
    subtitle: 'Workshop Exclusivo',
    imageUrl: 'https://picsum.photos/id/250/800/450', // Camera
    progress: 45,
  }
];

export const APP_NAME = "Love for Sweet";
export const TAGLINE = "Entre em um ambiente especializado projetado para aprendizado profundo.";