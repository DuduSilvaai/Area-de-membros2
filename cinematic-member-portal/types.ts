export interface Portal {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  progress: number;
  lastAccessed?: string;
  isLocked?: boolean;
}

export interface User {
  name: string;
  avatarUrl?: string;
}