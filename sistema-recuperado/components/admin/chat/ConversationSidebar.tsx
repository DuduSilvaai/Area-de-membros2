'use client';

import { useState, useMemo } from 'react';
import { ConversationWithStudent } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConversationSidebarProps {
    conversations: ConversationWithStudent[];
    selectedId?: string;
    onSelect: (conversation: ConversationWithStudent) => void;
    loading?: boolean;
}

export function ConversationSidebar({
    conversations,
    selectedId,
    onSelect,
    loading = false
}: ConversationSidebarProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter and sort conversations
    const filteredConversations = useMemo(() => {
        let filtered = conversations;

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.student?.full_name?.toLowerCase().includes(query) ||
                c.student?.email?.toLowerCase().includes(query)
            );
        }

        // Sort: unread first, then by last_message_at
        return filtered.sort((a, b) => {
            // Unread first
            if (a.unread_count_admin > 0 && b.unread_count_admin === 0) return -1;
            if (b.unread_count_admin > 0 && a.unread_count_admin === 0) return 1;

            // Then by last message date
            return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        });
    }, [conversations, searchQuery]);

    return (
        <div className="w-80 h-full flex flex-col bg-white dark:bg-[#121216] flex-shrink-0 transition-colors duration-200 border-r border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800/80">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/20 text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    Conversas
                </h1>

                {/* Search */}
                <div className="mt-4 relative">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar aluno..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-800 border focus:border-pink-500 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all text-sm"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="animate-pulse flex gap-3 p-3">
                                <div className="w-12 h-12 bg-gray-200 dark:bg-zinc-700 rounded-full flex-shrink-0" />
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-zinc-800/80 flex items-center justify-center mb-4 transition-colors">
                            <svg className="w-10 h-10 text-gray-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-900 dark:text-zinc-400 font-medium mb-1 transition-colors">
                            {searchQuery ? 'Nenhum resultado' : 'Nenhuma conversa'}
                        </p>
                        <p className="text-gray-500 dark:text-zinc-500 text-sm leading-relaxed max-w-[200px]">
                            {searchQuery
                                ? 'Tente buscar por outro nome.'
                                : 'Os alunos aparecerão aqui quando enviarem mensagens.'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-zinc-800/50">
                        {filteredConversations.map(conversation => (
                            <ConversationItem
                                key={conversation.id}
                                conversation={conversation}
                                isSelected={selectedId === conversation.id}
                                onClick={() => onSelect(conversation)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Individual conversation item
function ConversationItem({
    conversation,
    isSelected,
    onClick
}: {
    conversation: ConversationWithStudent;
    isSelected: boolean;
    onClick: () => void;
}) {
    const hasUnread = conversation.unread_count_admin > 0;

    const timeAgo = formatDistanceToNow(new Date(conversation.last_message_at), {
        addSuffix: false,
        locale: ptBR
    });

    // Get initials for avatar fallback
    const initials = conversation.student?.full_name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '??';

    return (
        <button
            onClick={onClick}
            className={`
        w-full p-4 flex items-start gap-3 text-left transition-all duration-200 group
        ${isSelected
                    ? 'bg-pink-50 border-l-2 border-pink-500 dark:bg-pink-500/10'
                    : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50 border-l-2 border-transparent'
                }
        ${hasUnread ? 'bg-gray-50 dark:bg-zinc-800/30' : ''}
      `}
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                {conversation.student?.avatar_url ? (
                    <img
                        src={conversation.student.avatar_url}
                        alt={conversation.student.full_name || 'Avatar'}
                        className="w-12 h-12 rounded-full object-cover shadow-sm"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-sm">
                        {initials}
                    </div>
                )}
                {/* Unread indicator */}
                {hasUnread && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-md">
                        {conversation.unread_count_admin > 9 ? '9+' : conversation.unread_count_admin}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className={`font-medium truncate transition-colors ${hasUnread
                            ? 'text-gray-900 dark:text-white font-bold'
                            : 'text-gray-900 dark:text-zinc-300'
                        }`}>
                        {conversation.student?.full_name || 'Aluno'}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-zinc-500 flex-shrink-0 ml-2">
                        {timeAgo}
                    </span>
                </div>
                <p className={`text-sm truncate transition-colors ${hasUnread
                        ? 'text-gray-800 dark:text-zinc-300 font-medium'
                        : 'text-gray-500 dark:text-zinc-500 group-hover:text-gray-700 dark:group-hover:text-zinc-400'
                    }`}>
                    {conversation.last_message_preview || 'Iniciar conversa'}
                </p>
            </div>
        </button>
    );
}
