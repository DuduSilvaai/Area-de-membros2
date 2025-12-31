'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import {
    Send,
    Loader2,
    MessageSquare,
    Paperclip,
    X,
    Headphones
} from 'lucide-react';

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    type: 'text' | 'image' | 'file' | 'video' | 'meeting';
    content: {
        text?: string;
        url?: string;
        name?: string;
        context?: {
            lessonId: string;
            lessonTitle: string;
            sentFrom: string;
        };
    };
    is_read: boolean;
    created_at: string;
    sender?: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
    };
}

interface LessonSupportProps {
    lessonId: string;
    lessonTitle: string;
    portalId: string;
}

export default function LessonSupport({ lessonId, lessonTitle, portalId }: LessonSupportProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Initialize or get conversation
    useEffect(() => {
        if (!user?.id) return;

        const initConversation = async () => {
            setLoading(true);
            try {
                // Try to find existing conversation
                const { data: existing, error: findError } = await supabase
                    .from('conversations')
                    .select('id')
                    .eq('student_id', user.id)
                    .eq('portal_id', portalId)
                    .single();

                if (existing) {
                    setConversationId(existing.id);
                    await fetchMessages(existing.id);
                } else if (findError?.code === 'PGRST116') {
                    // No conversation exists, create one
                    const { data: newConv, error: createError } = await supabase
                        .from('conversations')
                        .insert({
                            student_id: user.id,
                            portal_id: portalId
                        })
                        .select('id')
                        .single();

                    if (createError) {
                        console.error('Error creating conversation:', createError);
                    } else if (newConv) {
                        setConversationId(newConv.id);
                    }
                }
            } catch (error) {
                console.error('Error initializing conversation:', error);
            } finally {
                setLoading(false);
            }
        };

        initConversation();
    }, [user?.id, portalId]);

    // Fetch messages
    const fetchMessages = async (convId: string) => {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                id,
                conversation_id,
                sender_id,
                type,
                content,
                is_read,
                created_at
            `)
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
        } else {
            // Cast messages from Supabase - content is JSONB so we need to handle typing
            setMessages((data || []) as Message[]);
        }
    };

    // Subscribe to realtime messages
    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages(prev => [...prev, newMsg]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    // Auto-resize textarea
    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
    }, []);

    // Send message
    const handleSend = async () => {
        if (!newMessage.trim() || !conversationId || !user?.id || sending) return;

        setSending(true);
        const messageText = newMessage.trim();
        setNewMessage('');

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    type: 'text',
                    content: {
                        text: messageText,
                        context: {
                            lessonId,
                            lessonTitle,
                            sentFrom: 'lesson-support'
                        }
                    }
                });

            if (error) {
                console.error('Error sending message:', error);
                setNewMessage(messageText); // Restore message on error
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setNewMessage(messageText);
        } finally {
            setSending(false);
        }
    };

    // Format timestamp
    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format date
    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Hoje';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Ontem';
        }
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    // Group messages by date
    const groupMessagesByDate = (msgs: Message[]) => {
        const groups: { date: string; messages: Message[] }[] = [];
        let currentDate = '';

        msgs.forEach(msg => {
            const msgDate = formatDate(msg.created_at);
            if (msgDate !== currentDate) {
                currentDate = msgDate;
                groups.push({ date: msgDate, messages: [msg] });
            } else {
                groups[groups.length - 1].messages.push(msg);
            }
        });

        return groups;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: 'var(--primary-main)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Carregando suporte...
                </p>
            </div>
        );
    }

    const messageGroups = groupMessagesByDate(messages);

    return (
        <div className="flex flex-col h-[400px]">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #FF4D94, #9333EA)' }}
                >
                    <Headphones className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Suporte ao Aluno
                    </h4>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Tire suas dúvidas sobre esta aula
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                            style={{ background: 'linear-gradient(135deg, rgba(255,77,148,0.2), rgba(147,51,234,0.2))' }}
                        >
                            <MessageSquare className="w-8 h-8" style={{ color: 'var(--primary-main)' }} />
                        </div>
                        <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                            Precisa de ajuda? 👋
                        </h4>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Envie sua dúvida sobre a aula "{lessonTitle}" e nossa equipe responderá em breve.
                        </p>
                    </div>
                ) : (
                    messageGroups.map((group, groupIndex) => (
                        <div key={groupIndex}>
                            {/* Date Separator */}
                            <div className="flex items-center justify-center mb-4">
                                <span
                                    className="px-3 py-1 rounded-full text-xs"
                                    style={{
                                        backgroundColor: 'var(--bg-surface)',
                                        color: 'var(--text-secondary)'
                                    }}
                                >
                                    {group.date}
                                </span>
                            </div>

                            {/* Messages */}
                            {group.messages.map((message) => {
                                const isOwn = message.sender_id === user?.id;
                                const messageContent = message.content as { text?: string; context?: { lessonTitle?: string } };

                                return (
                                    <div
                                        key={message.id}
                                        className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] px-4 py-3 rounded-2xl ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'
                                                }`}
                                            style={{
                                                backgroundColor: isOwn
                                                    ? 'var(--primary-main)'
                                                    : 'var(--bg-surface)',
                                                color: isOwn
                                                    ? 'var(--text-on-primary)'
                                                    : 'var(--text-primary)'
                                            }}
                                        >
                                            {/* Context Badge */}
                                            {messageContent.context?.lessonTitle && isOwn && (
                                                <div
                                                    className="text-xs mb-2 pb-2 border-b opacity-70"
                                                    style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                                                >
                                                    📍 Enviado da aula: {messageContent.context.lessonTitle}
                                                </div>
                                            )}

                                            {/* Message Text */}
                                            <p className="text-sm whitespace-pre-wrap break-words">
                                                {messageContent.text || 'Mensagem'}
                                            </p>

                                            {/* Time */}
                                            <div
                                                className={`text-xs mt-1 ${isOwn ? 'text-right' : 'text-left'}`}
                                                style={{ opacity: 0.7 }}
                                            >
                                                {formatTime(message.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div
                className="pt-4 border-t"
                style={{ borderColor: 'var(--border-color)' }}
            >
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <textarea
                            ref={textareaRef}
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                adjustTextareaHeight();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Digite sua mensagem..."
                            rows={1}
                            className="w-full px-4 py-3 rounded-xl text-sm resize-none transition-all focus:outline-none focus:ring-2"
                            style={{
                                backgroundColor: 'var(--bg-canvas)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                minHeight: '48px',
                                maxHeight: '120px'
                            }}
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        className="p-3 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        style={{
                            backgroundColor: 'var(--primary-main)',
                            color: 'var(--text-on-primary)'
                        }}
                    >
                        {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
                <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-disabled)' }}>
                    Pressione Enter para enviar • Shift+Enter para nova linha
                </p>
            </div>
        </div>
    );
}
