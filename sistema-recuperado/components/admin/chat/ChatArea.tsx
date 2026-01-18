'use client';

// ChatArea component - Admin interface

import { useRef, useEffect, useState, useCallback } from 'react';
import { ConversationWithStudent, MessageWithSender, MessageContent, MessageType } from '@/types/chat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageInput } from '@/components/admin/chat/MessageInput';
import { supabase } from '@/lib/supabaseClient';
import { CornerDownRight } from 'lucide-react';

interface ChatAreaProps {
    conversation: ConversationWithStudent;
    messages: MessageWithSender[];
    loading?: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    onSendMessage: (content: MessageContent, type: MessageType) => Promise<void>;
    isSending?: boolean;
}

export function ChatArea({
    conversation,
    messages,
    loading = false,
    hasMore,
    onLoadMore,
    onSendMessage,
    isSending = false
}: ChatAreaProps) {
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Get current user ID
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setCurrentUserId(data.user?.id || null);
        });
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (!isLoadingMore) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoadingMore]);

    // Handle infinite scroll (inverted - load more at top)
    const handleScroll = useCallback(async () => {
        const container = messagesContainerRef.current;
        if (!container || loading || isLoadingMore || !hasMore) return;

        // Load more when scrolled near top
        if (container.scrollTop < 100) {
            const previousScrollHeight = container.scrollHeight;
            setIsLoadingMore(true);

            await onLoadMore();

            // Maintain scroll position after loading
            requestAnimationFrame(() => {
                if (container) {
                    container.scrollTop = container.scrollHeight - previousScrollHeight;
                }
                setIsLoadingMore(false);
            });
        }
    }, [loading, isLoadingMore, hasMore, onLoadMore]);

    // Get student initials for header
    const studentInitials = conversation.student?.full_name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '??';

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F8F9FB] dark:bg-[#0F0F12] transition-colors duration-200">
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm z-10">
                {/* Student Avatar */}
                {conversation.student?.avatar_url ? (
                    <img
                        src={conversation.student.avatar_url}
                        alt={conversation.student.full_name || 'Avatar'}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-pink-500/30"
                    />
                ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold ring-2 ring-pink-500/30">
                        {studentInitials}
                    </div>
                )}

                {/* Student Info */}
                <div className="flex-1">
                    <h2 className="text-[#1A1A1E] dark:text-white font-semibold transition-colors">
                        {conversation.student?.full_name || 'Aluno'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 transition-colors">
                        {conversation.student?.email || 'Conversa privada'}
                    </p>
                </div>

                {/* Actions */}
                <button
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-500 dark:text-zinc-400 hover:text-[#1A1A1E] dark:hover:text-white"
                    title="Mais opções"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
            </div>

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-1"
                style={{ overscrollBehavior: 'contain' }}
            >
                {/* Loading more indicator */}
                {isLoadingMore && (
                    <div className="flex justify-center py-4">
                        <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* Load more button */}
                {hasMore && !isLoadingMore && !loading && (
                    <div className="flex justify-center py-2">
                        <button
                            onClick={onLoadMore}
                            className="text-sm text-zinc-500 hover:text-pink-400 transition-colors"
                        >
                            Carregar mensagens anteriores
                        </button>
                    </div>
                )}

                {/* Initial loading */}
                {loading && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-zinc-500 text-sm">Carregando mensagens...</p>
                    </div>
                )}

                {/* Messages list */}
                {messages.map((message, index) => {
                    const role = (message.content as any)?.meta?.role;
                    // For Admin View, 'admin' role is Own.
                    // Fallback to sender_id check.
                    const isOwn = role
                        ? role === 'admin'
                        : message.sender_id === currentUserId;

                    const showSender = !isOwn && (
                        index === 0 ||
                        messages[index - 1]?.sender_id !== message.sender_id
                    );

                    let senderName = message.sender?.full_name || 'Usuário';

                    if (role === 'admin') {
                        senderName = 'Equipe de Suporte';
                    } else if (message.sender_id === conversation.student_id) {
                        senderName = conversation.student?.full_name || message.sender?.full_name || 'Aluno';
                    }

                    return (
                        <div key={message.id}>
                            {/* Context Header */}
                            {(message as any).context && (message as any).context.source === 'lesson' && (
                                <div className="flex justify-center mb-2">
                                    <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg px-3 py-1.5 text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-2">
                                        <CornerDownRight className="w-3 h-3" />
                                        <span>
                                            Enviado de: <strong>{(message as any).context.moduleTitle}</strong> {'>'} {(message as any).context.lessonTitle}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <MessageBubble
                                key={message.id}
                                message={message}
                                isOwn={isOwn}
                                showSender={showSender}
                                senderName={senderName}
                            />
                        </div>
                    );
                })}

                {/* Empty state */}
                {!loading && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4 transition-colors">
                            <svg className="w-8 h-8 text-gray-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 dark:text-zinc-500 transition-colors">
                            Nenhuma mensagem ainda.<br />
                            Inicie a conversa!
                        </p>
                    </div>
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <MessageInput
                onSendMessage={onSendMessage}
                isSending={isSending}
                conversationId={conversation.id}
            />
        </div>
    );
}
