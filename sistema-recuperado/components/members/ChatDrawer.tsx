'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '@/lib/hooks/useChat';
import { useParams } from 'next/navigation';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageContent, MessageType } from '@/types/chat';
import { supabase } from '@/lib/supabase/client';
import { MeetingsList } from '@/components/meetings/MeetingsList';

interface ChatDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    lessonId?: string;
    lessonTitle?: string;
    moduleTitle?: string;
}

export function ChatDrawer({ isOpen, onClose, lessonId, lessonTitle, moduleTitle }: ChatDrawerProps) {
    const [text, setText] = useState('');
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'meetings'>('chat');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const params = useParams();
    const currentLessonId = lessonId || (params?.lessonId as string);
    const [contextData, setContextData] = useState<{ lessonTitle?: string, moduleTitle?: string }>({
        lessonTitle: lessonTitle,
        moduleTitle: moduleTitle
    });

    useEffect(() => {
        if (currentLessonId && !lessonTitle) {
            const fetchContext = async () => {
                const { data } = await supabase
                    .from('contents')
                    .select('title, module:modules(title)')
                    .eq('id', currentLessonId)
                    .single();

                if (data) {
                    setContextData({
                        lessonTitle: data.title,
                        moduleTitle: (data.module as any)?.title
                    });
                }
            };
            fetchContext();
        }
    }, [currentLessonId, lessonTitle]);

    const {
        messages,
        loadingMessages,
        fetchMessages,
        sendMessage,
        markAsRead,
        createConversation,
        isSending,
        subscribeToMessages,
        unsubscribe
    } = useChat({ isAdmin: false });

    // CONST context payload
    const contextPayload = currentLessonId ? {
        source: 'lesson',
        lessonId: currentLessonId,
        lessonTitle: contextData.lessonTitle,
        moduleTitle: contextData.moduleTitle,
        url: window.location.href
    } : null;

    // Get current user
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setCurrentUserId(data.user?.id || null);
        });
    }, []);

    // Initialize conversation when drawer opens
    useEffect(() => {
        if (!isOpen) return;

        const init = async () => {
            // Get or create conversation
            const id = await createConversation();
            if (id) {
                setConversationId(id);
                await fetchMessages(id);
                subscribeToMessages(id);
                await markAsRead(id);
            }
        };

        init();

        return () => {
            unsubscribe();
        };
    }, [isOpen, createConversation, fetchMessages, subscribeToMessages, markAsRead, unsubscribe]);

    // Polling fallback - refresh messages periodically while drawer is open
    // This ensures messages sync even if realtime subscription fails
    useEffect(() => {
        if (!isOpen || !conversationId) return;

        const pollInterval = setInterval(async () => {
            // Fetch latest messages to sync state
            await fetchMessages(conversationId);
            await markAsRead(conversationId);
        }, 10000); // Poll every 10 seconds

        return () => {
            clearInterval(pollInterval);
        };
    }, [isOpen, conversationId, fetchMessages, markAsRead]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    // Auto-resize textarea
    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
        }
    }, []);

    // Send text message
    const handleSendText = async () => {
        if (!text.trim() || isSending || !conversationId) return;

        const content: MessageContent = { text: text.trim() };
        setText('');

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        await sendMessage(content, 'text', contextPayload);
    };

    // Handle file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !conversationId) return;

        setIsUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${conversationId}/${Date.now()}.${fileExt}`;

            const { error } = await supabase.storage
                .from('chat-attachments')
                .upload(fileName, file);

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('chat-attachments')
                .getPublicUrl(fileName);

            const url = urlData.publicUrl;
            const type = file.type.startsWith('image/') ? 'image' :
                file.type.startsWith('video/') ? 'video' : 'file';

            if (type === 'image') {
                await sendMessage({ url, caption: '' }, 'image');
            } else if (type === 'video') {
                await sendMessage({ url }, 'video');
            } else {
                await sendMessage({
                    url,
                    name: file.name,
                    size: file.size,
                    mimeType: file.type
                }, 'file');
            }

        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
            />

            {/* Modal Container - Centering Wrapper */}
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                {/* Modal Window */}
                <div
                    className="w-[90vw] md:w-[480px] h-[600px] max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col shadow-2xl pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex flex-col border-b border-zinc-800 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-t-2xl">
                        <div className="flex items-center justify-between px-4 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-white font-semibold">Suporte</h2>
                                    <p className="text-xs text-zinc-400">Estamos aqui para ajudar</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {/* Tabs */}
                        <div className="flex px-4 pb-0 gap-6">
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'chat' ? 'text-white' : 'text-zinc-400 hover:text-zinc-300'
                                    }`}
                            >
                                Chat
                                {activeTab === 'chat' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500 rounded-t-full" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('meetings')}
                                className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'meetings' ? 'text-white' : 'text-zinc-400 hover:text-zinc-300'
                                    }`}
                            >
                                Reuniões
                                {activeTab === 'meetings' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500 rounded-t-full" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    {activeTab === 'meetings' ? (
                        <div className="flex-1 overflow-hidden flex flex-col bg-zinc-900 rounded-b-2xl">
                            {currentUserId ? (
                                <MeetingsList studentId={currentUserId} isAdmin={false} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-zinc-500">
                                    Carregando perfil...
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                                {loadingMessages && messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-3" />
                                        <p className="text-zinc-500 text-sm">Carregando...</p>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-white font-medium mb-1">Olá! 👋</h3>
                                        <p className="text-zinc-400 text-sm">
                                            Envie uma mensagem e nossa equipe responderá em breve.
                                        </p>
                                    </div>
                                ) : (
                                    messages.map((message, index) => {
                                        const role = (message.content as any)?.meta?.role;
                                        // If role is present, Student View sees 'student' role as Own.
                                        // Fallback to sender_id check.
                                        const isOwn = role
                                            ? role === 'student'
                                            : message.sender_id === currentUserId;

                                        return (
                                            <MessageBubble
                                                key={message.id}
                                                message={message}
                                                isOwn={isOwn}
                                                showSender={!isOwn}
                                            />
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="border-t border-zinc-800 p-4 bg-zinc-900/80 rounded-b-2xl">
                                <div className="flex items-end gap-2">
                                    {/* File Upload */}
                                    <label className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                                        {isUploading ? (
                                            <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
                                        )}
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                            disabled={isUploading || !conversationId}
                                        />
                                    </label>

                                    {/* Text Input */}
                                    <div className="flex-1">
                                        <textarea
                                            ref={textareaRef}
                                            value={text}
                                            onChange={(e) => {
                                                setText(e.target.value);
                                                adjustTextareaHeight();
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendText();
                                                }
                                            }}
                                            placeholder="Digite sua mensagem..."
                                            rows={1}
                                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 resize-none transition-all"
                                            style={{ minHeight: '48px', maxHeight: '100px' }}
                                        />
                                    </div>

                                    {/* Send Button */}
                                    <button
                                        onClick={handleSendText}
                                        disabled={!text.trim() || isSending || !conversationId}
                                        className="p-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white transition-all shadow-lg hover:shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSending ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
