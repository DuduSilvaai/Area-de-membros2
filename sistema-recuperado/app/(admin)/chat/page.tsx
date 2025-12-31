'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@/lib/hooks/useChat';
import { ConversationSidebar } from '@/components/admin/chat/ConversationSidebar';
import { ChatArea } from '../../../components/admin/chat/ChatArea';
import { ConversationWithStudent } from '@/types/chat';

export default function AdminChatPage() {
    const [selectedConversation, setSelectedConversation] = useState<ConversationWithStudent | null>(null);
    const {
        conversations,
        loadingConversations,
        fetchConversations,
        messages,
        loadingMessages,
        hasMore,
        fetchMessages,
        loadMoreMessages,
        sendMessage,
        markAsRead,
        isSending,
        subscribeToMessages,
        unsubscribe
    } = useChat({ isAdmin: true });

    // Fetch conversations on mount
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Handle conversation selection
    const handleSelectConversation = async (conversation: ConversationWithStudent) => {
        setSelectedConversation(conversation);

        // Unsubscribe from previous and subscribe to new
        unsubscribe();
        subscribeToMessages(conversation.id);

        // Fetch messages
        await fetchMessages(conversation.id);

        // Mark as read
        if (conversation.unread_count_admin > 0) {
            await markAsRead(conversation.id);
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] bg-[#F8F9FB] dark:bg-[#0F0F12] overflow-hidden transition-colors duration-200">
            {/* Sidebar - Fixed width layout handled inside component */}
            <ConversationSidebar
                conversations={conversations}
                selectedId={selectedConversation?.id}
                onSelect={handleSelectConversation}
                loading={loadingConversations}
            />

            {/* Divider */}
            <div className="w-px bg-gray-200 dark:bg-zinc-800" />

            {/* Chat Area - Flex grow */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FB] dark:bg-[#0F0F12]">
                {selectedConversation ? (
                    <ChatArea
                        conversation={selectedConversation}
                        messages={messages}
                        loading={loadingMessages}
                        hasMore={hasMore}
                        onLoadMore={loadMoreMessages}
                        onSendMessage={sendMessage}
                        isSending={isSending}
                    />
                ) : (
                    <EmptyState />
                )}
            </div>
        </div>
    );
}

// Empty state when no conversation is selected
function EmptyState() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#F8F9FB] dark:bg-[#0F0F12] transition-colors duration-200">
            {/* Icon */}
            <div className="w-32 h-32 rounded-full bg-pink-500/10 flex items-center justify-center mb-8 shadow-xl shadow-pink-500/5">
                <svg className="w-16 h-16 text-[#FF2D78]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-[#1A1A1E] dark:text-white mb-3 transition-colors">
                Central de Mentoria
            </h2>

            {/* Description - properly constrained */}
            <p className="w-full max-w-2xl px-8 text-center text-gray-500 dark:text-gray-400 leading-relaxed transition-colors">
                Selecione uma conversa ao lado para começar a ajudar seus alunos.
                Aqui você pode tirar dúvidas e acompanhar o progresso.
            </p>

            {/* Decorative hint */}
            <div className="mt-8 flex items-center gap-2 text-gray-400 dark:text-zinc-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                <span className="text-sm">Escolha uma conversa</span>
            </div>
        </div>
    );
}
