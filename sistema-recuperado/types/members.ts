// Types for Mozart StreamLearn Premium Members Area

export enum LessonStatus {
    LOCKED = 'LOCKED',
    AVAILABLE = 'AVAILABLE',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED'
}

export interface MemberUser {
    id: string;
    name: string;
    avatar: string;
    email?: string;
}

export interface MemberLesson {
    id: string;
    title: string;
    duration: string;
    status: LessonStatus;
    videoUrl?: string;
    description: string;
}

export interface MemberModule {
    id: string;
    title: string;
    lessons: MemberLesson[];
}

export interface MemberCourse {
    id: string;
    title: string;
    thumbnail: string;
    progress: number; // 0 to 100
    lastLessonId?: string;
    modules: MemberModule[];
    author: string;
}

export interface MemberComment {
    id: string;
    user: MemberUser;
    text: string;
    date: string;
    isInstructor?: boolean;
}

export interface MemberAttachment {
    id: string;
    name: string;
    type: 'PDF' | 'ZIP' | 'DOC';
    size: string;
    url?: string;
}

export interface MemberPortal {
    id: string;
    name: string;
    logo?: string;
    description: string;
    coverImage: string;
}

export interface MemberNotification {
    id: string | number;
    title: string;
    message: string;
    time: string;
    isUnread: boolean;
    type: 'info' | 'success' | 'alert';
}
