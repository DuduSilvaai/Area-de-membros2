// Chat System Types
// Tipos específicos para o sistema de chat

import { Tables } from './supabase';

// Base types from database
export type Conversation = Tables<'conversations'>;
export type Message = Tables<'messages'>;

// Message content types (JSONB structure)
export interface TextContent {
    text: string;
}

export interface ImageContent {
    url: string;
    caption?: string;
    width?: number;
    height?: number;
}

export interface VideoContent {
    url: string;
    thumbnail?: string;
    duration?: number;
}

export interface FileContent {
    url: string;
    name: string;
    size: number;
    mimeType: string;
}

export interface MeetingContent {
    title: string;
    description?: string;
    date: string; // ISO 8601 format
    link: string;
}

// Union type for message content
export type MessageContent =
    | TextContent
    | ImageContent
    | VideoContent
    | FileContent
    | MeetingContent;

// Message type enum
export type MessageType = 'text' | 'image' | 'file' | 'video' | 'meeting';

// Extended message with typed content
export interface TypedMessage extends Omit<Message, 'content'> {
    content: MessageContent;
}

// Conversation with student profile (for admin view)
export interface ConversationWithStudent extends Conversation {
    student?: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        email?: string;
    };
}

// Message with sender profile
export interface MessageWithSender extends Message {
    sender?: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
    };
}

// Helper type guards
export function isTextContent(content: MessageContent): content is TextContent {
    return 'text' in content;
}

export function isImageContent(content: MessageContent): content is ImageContent {
    return 'url' in content && ('width' in content || 'caption' in content);
}

export function isVideoContent(content: MessageContent): content is VideoContent {
    return 'url' in content && ('thumbnail' in content || 'duration' in content);
}

export function isFileContent(content: MessageContent): content is FileContent {
    return 'url' in content && 'name' in content && 'mimeType' in content;
}

export function isMeetingContent(content: MessageContent): content is MeetingContent {
    return 'title' in content && 'date' in content && 'link' in content;
}

// Chat state types
export interface ChatState {
    conversations: ConversationWithStudent[];
    activeConversation: ConversationWithStudent | null;
    messages: MessageWithSender[];
    isLoading: boolean;
    isSending: boolean;
    hasMore: boolean;
}

// Attachment type for file uploads
export interface ChatAttachment {
    file: File;
    preview?: string;
    type: 'image' | 'video' | 'file';
    uploading: boolean;
    progress: number;
}
