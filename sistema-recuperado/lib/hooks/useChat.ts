'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
    ConversationWithStudent,
    MessageWithSender,
    MessageContent,
    MessageType
} from '@/types/chat';
import { Json } from '@/types/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseChatOptions {
    conversationId?: string;
    isAdmin?: boolean;
    autoSubscribe?: boolean;
    initialConversations?: ConversationWithStudent[];
}

interface UseChatReturn {
    // Conversations
    conversations: ConversationWithStudent[];
    loadingConversations: boolean;
    fetchConversations: () => Promise<void>;

    // Messages
    messages: MessageWithSender[];
    loadingMessages: boolean;
    hasMore: boolean;
    fetchMessages: (conversationId: string, reset?: boolean) => Promise<void>;
    loadMoreMessages: () => Promise<void>;

    // Actions
    sendMessage: (content: MessageContent, type: MessageType, context?: Json, attachments?: Json[]) => Promise<void>;
    markAsRead: (conversationId: string) => Promise<void>;
    createConversation: (portalId?: string) => Promise<string | null>;

    // State
    isSending: boolean;
    unreadCount: number;

    // Realtime
    subscribeToMessages: (conversationId: string) => void;
    subscribeToConversationsList: () => void;
    unsubscribe: () => void;
}

const PAGE_SIZE = 30;

export function useChat(options: UseChatOptions = {}): UseChatReturn {
    const { conversationId, isAdmin = false, autoSubscribe = true, initialConversations = [] } = options;

    const [conversations, setConversations] = useState<ConversationWithStudent[]>(initialConversations);
    const [messages, setMessages] = useState<MessageWithSender[]>([]);
    const [loadingConversations, setLoadingConversations] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    // Initialize unread count from initial data
    useEffect(() => {
        if (initialConversations.length > 0) {
            const total = initialConversations.reduce((acc, c) =>
                acc + (isAdmin ? c.unread_count_admin : c.unread_count_student), 0
            );
            setUnreadCount(total);
        }
    }, []); // Run once on mount

    const channelRef = useRef<RealtimeChannel | null>(null);
    const listChannelRef = useRef<RealtimeChannel | null>(null);
    const currentConversationRef = useRef<string | null>(null);

    const offsetRef = useRef(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize notification sound
    useEffect(() => {
        audioRef.current = new Audio('/sounds/notification.mp3');
        audioRef.current.volume = 0.5;
    }, []);

    // Play notification sound
    const playNotificationSound = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {
                // Audio play failed, likely due to autoplay policy
            });
        }
    }, []);

    // Fetch conversations list (for admin)
    const fetchConversations = useCallback(async () => {
        setLoadingConversations(true);
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select(`
          *,
          student:profiles!conversations_student_id_profiles_fkey(id, full_name, avatar_url)
        `)
                .order('unread_count_admin', { ascending: false })
                .order('last_message_at', { ascending: false });

            if (error) throw error;

            // Transform data
            const transformed = (data || []).map(conv => ({
                ...conv,
                student: Array.isArray(conv.student) ? conv.student[0] : conv.student
            }));

            setConversations(transformed);

            // Calculate total unread
            const total = transformed.reduce((acc, c) =>
                acc + (isAdmin ? c.unread_count_admin : c.unread_count_student), 0
            );
            setUnreadCount(total);

        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoadingConversations(false);
        }
    }, [isAdmin]);

    // Fetch messages for a conversation
    const fetchMessages = useCallback(async (convId: string, reset = true) => {
        if (reset) {
            offsetRef.current = 0;
            setMessages([]);
            setHasMore(true);
        }

        setLoadingMessages(true);
        currentConversationRef.current = convId;

        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
          *,
          sender:profiles!messages_sender_id_profiles_fkey(id, full_name, avatar_url)
        `)
                .eq('conversation_id', convId)
                .order('created_at', { ascending: false })
                .range(offsetRef.current, offsetRef.current + PAGE_SIZE - 1);

            if (error) throw error;

            const transformedMessages = (data || []).map(msg => ({
                ...msg,
                sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender
            }));

            if (reset) {
                setMessages(transformedMessages.reverse());
            } else {
                setMessages(prev => [...transformedMessages.reverse(), ...prev]);
            }

            setHasMore((data?.length || 0) === PAGE_SIZE);
            offsetRef.current += data?.length || 0;

        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    // Load more messages (pagination)
    const loadMoreMessages = useCallback(async () => {
        if (!currentConversationRef.current || loadingMessages || !hasMore) return;
        await fetchMessages(currentConversationRef.current, false);
    }, [fetchMessages, loadingMessages, hasMore]);

    // Send a message
    const sendMessage = useCallback(async (content: MessageContent, type: MessageType, context?: Json, attachments?: Json[]) => {
        if (!currentConversationRef.current) return;

        setIsSending(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setIsSending(false);
            return;
        }

        // Optimistic update
        const optimisticMessage: MessageWithSender = {
            id: `temp-${Date.now()}`,
            conversation_id: currentConversationRef.current,
            sender_id: user.id,
            type,
            content: content as any,
            is_read: false,
            context: context || null,
            attachments: attachments || null,
            created_at: new Date().toISOString(),
            sender: {
                id: user.id,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Você',
                avatar_url: user.user_metadata?.avatar_url || null
            }
        };

        setMessages(prev => [...prev, optimisticMessage]);

        try {
            // Inject sender role into content
            const contentWithMeta = {
                ...content,
                meta: {
                    ...content.meta,
                    role: isAdmin ? 'admin' : 'student'
                }
            };

            const { data, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: currentConversationRef.current,
                    sender_id: user.id,
                    type,
                    content: contentWithMeta as unknown as Json,
                    context: context || null,
                    attachments: attachments || null
                })
                .select(`
          *,
          sender:profiles!messages_sender_id_profiles_fkey(id, full_name, avatar_url)
        `)
                .single();

            if (error) throw error;

            // Replace optimistic message with real one
            setMessages(prev =>
                prev.map(m =>
                    m.id === optimisticMessage.id
                        ? { ...data, sender: Array.isArray(data.sender) ? data.sender[0] : data.sender }
                        : m
                )
            );

        } catch (error) {
            console.error('Error sending message:', error);
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        } finally {
            setIsSending(false);
        }
    }, []);

    // Mark messages as read
    const markAsRead = useCallback(async (convId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Mark messages as read
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('conversation_id', convId)
                .neq('sender_id', user.id)
                .eq('is_read', false);

            // Reset unread count
            const updateField = isAdmin ? 'unread_count_admin' : 'unread_count_student';
            await supabase
                .from('conversations')
                .update({ [updateField]: 0 })
                .eq('id', convId);

            // Update local state
            setConversations(prev =>
                prev.map(c =>
                    c.id === convId
                        ? {
                            ...c,
                            [isAdmin ? 'unread_count_admin' : 'unread_count_student']: 0
                        }
                        : c
                )
            );

        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }, [isAdmin]);

    // Create a new conversation (for students)
    const createConversation = useCallback(async (portalId?: string): Promise<string | null> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            // Check if conversation already exists
            let query = supabase
                .from('conversations')
                .select('id')
                .eq('student_id', user.id);

            if (portalId) {
                query = query.eq('portal_id', portalId);
            }

            const { data: existing } = await query.maybeSingle();

            if (existing) {
                return existing.id;
            }

            // Create new conversation
            const { data, error } = await supabase
                .from('conversations')
                .insert({
                    student_id: user.id,
                    portal_id: portalId || null
                })
                .select('id')
                .single();

            if (error) throw error;
            return data.id;

        } catch (error) {
            console.error('Error creating conversation:', error);
            return null;
        }
    }, []);

    // Subscribe to realtime messages
    const subscribeToMessages = useCallback((convId: string) => {
        // Unsubscribe from previous channel
        if (channelRef.current) {
            channelRef.current.unsubscribe();
        }

        channelRef.current = supabase
            .channel(`messages:${convId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${convId}`
                },
                async (payload) => {
                    const newMessage = payload.new as MessageWithSender;

                    // Get current user ID first (before setMessages)
                    const { data: { user } } = await supabase.auth.getUser();
                    const currentUserId = user?.id;

                    // Fetch sender info
                    const { data: sender } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url')
                        .eq('id', newMessage.sender_id)
                        .single();

                    const messageWithSender: MessageWithSender = {
                        ...newMessage,
                        sender: sender || undefined
                    };

                    // Check if message already exists (from optimistic update)
                    setMessages(prev => {
                        const exists = prev.some(m => m.id === newMessage.id);
                        if (exists) return prev;

                        // Play sound if message is from someone else
                        if (newMessage.sender_id !== currentUserId) {
                            playNotificationSound();
                        }

                        return [...prev, messageWithSender];
                    });
                }
            )
            .subscribe();

    }, [playNotificationSound]);

    // Subscribe to conversations list (for admin)
    const subscribeToConversationsList = useCallback(() => {
        if (!isAdmin || listChannelRef.current) return;

        listChannelRef.current = supabase
            .channel('conversations-list')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations'
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        // Fetch the full conversation with student details
                        const { data, error } = await supabase
                            .from('conversations')
                            .select(`
                                *,
                                student:profiles!conversations_student_id_profiles_fkey(id, full_name, avatar_url)
                            `)
                            .eq('id', payload.new.id)
                            .single();

                        if (!error && data) {
                            const newConv: ConversationWithStudent = {
                                ...data,
                                student: Array.isArray(data.student) ? data.student[0] : data.student
                            };

                            setConversations(prev => {
                                // Prevent duplicates
                                if (prev.some(c => c.id === newConv.id)) return prev;
                                return [newConv, ...prev];
                            });
                            playNotificationSound();
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        setConversations(prev => {
                            return prev.map(c => {
                                if (c.id === (payload.new as any).id) {
                                    // Merge updates
                                    return { ...c, ...payload.new };
                                }
                                return c;
                            }).sort((a, b) => {
                                // Re-sort by date
                                const dateA = new Date(a.last_message_at || 0).getTime();
                                const dateB = new Date(b.last_message_at || 0).getTime();
                                return dateB - dateA;
                            });
                        });

                        // Update unread count total
                        // We need to recalculate. This is tricky with simple state updates.
                        // Best effort:
                        if ((payload.new as any).unread_count_admin > (payload.old as any).unread_count_admin) {
                            playNotificationSound();
                        }
                    }
                }
            )
            .subscribe();

    }, [isAdmin, playNotificationSound]);

    // Unsubscribe from realtime
    const unsubscribe = useCallback(() => {
        if (channelRef.current) {
            channelRef.current.unsubscribe();
            channelRef.current = null;
        }
        if (listChannelRef.current) {
            listChannelRef.current.unsubscribe();
            listChannelRef.current = null;
        }
    }, []);

    // Auto-subscribe when conversation changes
    useEffect(() => {
        if (conversationId && autoSubscribe) {
            subscribeToMessages(conversationId);
        }

        return () => {
            unsubscribe();
        };
    }, [conversationId, autoSubscribe, subscribeToMessages, unsubscribe]);

    return {
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
        createConversation,
        isSending,
        unreadCount,
        subscribeToMessages,
        subscribeToConversationsList,
        unsubscribe
    };
}
