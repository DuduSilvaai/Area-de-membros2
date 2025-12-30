'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ChatDrawer } from './ChatDrawer';

interface ChatWidgetProps {
    portalId?: string;
}

export function ChatWidget({ portalId }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasNewMessage, setHasNewMessage] = useState(false);

    // Fetch unread count on mount
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data } = await supabase
                    .from('conversations')
                    .select('unread_count_student')
                    .eq('student_id', user.id)
                    .maybeSingle();

                if (data) {
                    setUnreadCount(data.unread_count_student);
                    setHasNewMessage(data.unread_count_student > 0);
                }
            } catch (error) {
                console.error('Error fetching unread count:', error);
            }
        };

        fetchUnreadCount();

        // Subscribe to conversation updates for real-time unread count
        const channel = supabase
            .channel('student-unread')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'conversations'
                },
                (payload) => {
                    const newCount = (payload.new as any).unread_count_student;
                    setUnreadCount(newCount);
                    if (newCount > 0 && !isOpen) {
                        setHasNewMessage(true);
                    }
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [isOpen]);

    // Reset new message indicator when opening
    const handleOpen = () => {
        setIsOpen(true);
        setHasNewMessage(false);
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={handleOpen}
                className={`
          fixed bottom-6 right-6 z-40
          w-14 h-14 rounded-full
          bg-gradient-to-br from-pink-500 to-pink-600
          hover:from-pink-600 hover:to-pink-700
          shadow-lg hover:shadow-xl hover:shadow-pink-500/25
          transition-all duration-300 ease-out
          flex items-center justify-center
          group
          ${hasNewMessage ? 'animate-bounce' : ''}
        `}
                title="Abrir chat com suporte"
            >
                {/* Chat Icon */}
                <svg
                    className="w-6 h-6 text-white transition-transform group-hover:scale-110"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span
                        className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}

                {/* New Message Pulse */}
                {hasNewMessage && (
                    <span className="absolute inset-0 rounded-full bg-pink-500 animate-ping opacity-30" />
                )}
            </button>

            {/* Chat Drawer */}
            <ChatDrawer
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                portalId={portalId}
            />
        </>
    );
}
