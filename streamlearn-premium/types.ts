export enum LessonStatus {
  LOCKED = 'LOCKED',
  AVAILABLE = 'AVAILABLE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  status: LessonStatus;
  videoUrl?: string; // Optional real URL, using mock logic mostly
  description: string;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  thumbnail: string;
  progress: number; // 0 to 100
  lastLessonId?: string;
  modules: Module[];
  author: string;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  date: string;
  isInstructor?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'PDF' | 'ZIP' | 'DOC';
  size: string;
}

export interface Portal {
  id: string;
  name: string;
  logo: string;
  description: string;
  coverImage: string;
}