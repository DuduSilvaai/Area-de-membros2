'use client';

import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    MessageWithSender,
    TextContent,
    ImageContent,
    VideoContent,
    FileContent,
    MeetingContent,
    isTextContent,
    isImageContent,
    isVideoContent,
    isFileContent,
    isMeetingContent
} from '@/types/chat';
import { useState } from 'react';
import { ImagePreviewModal } from './ImagePreviewModal';

interface MessageBubbleProps {
    message: MessageWithSender;
    isOwn: boolean;
    showSender?: boolean;
    senderName?: string;
}

export function MessageBubble({ message, isOwn, showSender = false, senderName }: MessageBubbleProps) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    const content = message.content as any;
    const messageDate = new Date(message.created_at);
    const timestamp = isToday(messageDate)
        ? format(messageDate, 'HH:mm')
        : format(messageDate, "dd/MM 'às' HH:mm", { locale: ptBR });

    const openPreview = (url: string) => {
        setPreviewUrl(url);
        setPreviewOpen(true);
    };

    // Render based on message type
    const renderContent = () => {
        switch (message.type) {
            case 'text':
                return <TextMessage content={content as TextContent} />;
            case 'image':
                return <ImageMessage content={content as ImageContent} onPreview={openPreview} />;
            case 'video':
                return <VideoMessage content={content as VideoContent} onPreview={openPreview} />;
            case 'file':
                return <FileMessage content={content as FileContent} />;
            case 'meeting':
                return <MeetingMessage content={content as MeetingContent} />;
            default:
                return <TextMessage content={{ text: 'Mensagem não suportada' }} />;
        }
    };

    // Special styling for meeting cards
    if (message.type === 'meeting') {
        return (
            <div className="flex justify-center my-4">
                <div className="w-full max-w-md">
                    {renderContent()}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
                <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    {showSender && !isOwn && (
                        <span className="text-xs text-zinc-400 ml-2 mb-1 block">
                            {senderName || ((message.content as any)?.meta?.role === 'admin'
                                ? 'Equipe de Suporte'
                                : message.sender?.full_name || 'Usuário')}
                        </span>
                    )}
                    <div
                        className={`
              relative rounded-2xl px-4 py-2.5 shadow-sm
              ${isOwn
                                ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-tr-sm'
                                : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
                            }
              ${message.type === 'image' || message.type === 'video' ? 'p-1' : ''}
            `}
                    >
                        {renderContent()}
                        <span
                            className={`
                text-[10px] mt-1 block text-right
                ${isOwn ? 'text-pink-200' : 'text-zinc-500'}
              `}
                        >
                            {timestamp}
                            {isOwn && (
                                <span className="ml-1">
                                    {message.is_read ? '✓✓' : '✓'}
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            </div>
            <ImagePreviewModal
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
                url={previewUrl}
                isVideo={message.type === 'video'}
            />
        </>
    );
}

// Text Message
function TextMessage({ content }: { content: TextContent }) {
    return (
        <p className="text-sm whitespace-pre-wrap break-words">
            {content.text}
        </p>
    );
}

// Image Message
function ImageMessage({
    content,
    onPreview
}: {
    content: ImageContent;
    onPreview: (url: string) => void;
}) {
    return (
        <div
            className="cursor-pointer rounded-xl overflow-hidden"
            onClick={() => onPreview(content.url)}
        >
            <img
                src={content.url}
                alt={content.caption || 'Imagem'}
                className="max-w-full max-h-64 object-cover rounded-xl"
                loading="lazy"
            />
            {content.caption && (
                <p className="text-sm mt-2 px-2">{content.caption}</p>
            )}
        </div>
    );
}

// Video Message
function VideoMessage({
    content,
    onPreview
}: {
    content: VideoContent;
    onPreview: (url: string) => void;
}) {
    return (
        <div
            className="cursor-pointer rounded-xl overflow-hidden relative group"
            onClick={() => onPreview(content.url)}
        >
            {content.thumbnail ? (
                <img
                    src={content.thumbnail}
                    alt="Video preview"
                    className="max-w-full max-h-64 object-cover rounded-xl"
                />
            ) : (
                <video
                    src={content.url}
                    className="max-w-full max-h-64 object-cover rounded-xl"
                    preload="metadata"
                />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                    <svg className="w-8 h-8 text-pink-500 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            </div>
            {content.duration && (
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                    {formatDuration(content.duration)}
                </span>
            )}
        </div>
    );
}

// File Message
function FileMessage({ content }: { content: FileContent }) {
    const getFileIcon = () => {
        const type = content.mimeType.split('/')[0];
        switch (type) {
            case 'application':
                if (content.mimeType.includes('pdf')) return '📄';
                if (content.mimeType.includes('zip') || content.mimeType.includes('rar')) return '🗜️';
                return '📁';
            case 'text':
                return '📝';
            default:
                return '📎';
        }
    };

    return (
        <a
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-zinc-700/50 rounded-xl hover:bg-zinc-700 transition-colors"
        >
            <span className="text-2xl">{getFileIcon()}</span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{content.name}</p>
                <p className="text-xs text-zinc-400">{formatFileSize(content.size)}</p>
            </div>
            <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
        </a>
    );
}

// Meeting Message - Premium Card
function MeetingMessage({ content }: { content: MeetingContent }) {
    const meetingDate = new Date(content.date);

    const formatMeetingDate = () => {
        if (isToday(meetingDate)) return 'Hoje';
        if (isTomorrow(meetingDate)) return 'Amanhã';
        if (isYesterday(meetingDate)) return 'Ontem';
        return format(meetingDate, "EEEE, d 'de' MMMM", { locale: ptBR });
    };

    const formatMeetingTime = () => {
        return format(meetingDate, 'HH:mm');
    };

    const generateGoogleCalendarUrl = () => {
        const startDate = meetingDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
        const endDate = new Date(meetingDate.getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');

        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: content.title,
            dates: `${startDate}/${endDate}`,
            details: content.description || '',
            location: content.link
        });

        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    };

    return (
        <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl border-2 border-pink-500/30 overflow-hidden shadow-xl">
            {/* Header with calendar icon */}
            <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 px-4 py-3 border-b border-pink-500/20">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs text-pink-400 font-medium uppercase tracking-wider">
                            Reunião Agendada
                        </p>
                        <h3 className="text-white font-bold text-lg">
                            {content.title}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Date & Time */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-zinc-300">
                        <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="capitalize">{formatMeetingDate()}</span>
                    </div>
                    <div className="px-3 py-1 bg-pink-500/20 rounded-full">
                        <span className="text-pink-400 font-bold">{formatMeetingTime()}</span>
                    </div>
                </div>

                {/* Description */}
                {content.description && (
                    <p className="text-zinc-400 text-sm">
                        {content.description}
                    </p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <a
                        href={content.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold rounded-xl text-center transition-all shadow-lg hover:shadow-pink-500/25 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Acessar Reunião
                    </a>
                    <a
                        href={generateGoogleCalendarUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-xl transition-colors flex items-center gap-2"
                        title="Adicionar ao Google Calendar"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    );
}

// Helper functions
function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
