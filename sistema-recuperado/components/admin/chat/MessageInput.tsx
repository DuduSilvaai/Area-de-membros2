'use client';

import { useState, useRef, useCallback, KeyboardEvent, ChangeEvent } from 'react';
import { MessageContent, MessageType } from '@/types/chat';
import { supabase } from '@/lib/supabaseClient';

interface MessageInputProps {
    onSendMessage: (content: MessageContent, type: MessageType) => Promise<void>;
    isSending?: boolean;
    conversationId: string;
}

export function MessageInput({ onSendMessage, isSending = false, conversationId }: MessageInputProps) {
    const [text, setText] = useState('');
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const attachMenuRef = useRef<HTMLDivElement>(null);

    // Auto-resize textarea
    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
        }
    }, []);

    const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        adjustTextareaHeight();
    };

    // Send text message
    const handleSendText = async () => {
        if (!text.trim() || isSending) return;

        const content: MessageContent = { text: text.trim() };
        setText('');

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        await onSendMessage(content, 'text');
    };

    // Handle keyboard events
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
        }
    };

    // Handle file upload
    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setShowAttachMenu(false);

        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${conversationId}/${Date.now()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('chat-attachments')
                .upload(fileName, file);

            if (error) throw error;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('chat-attachments')
                .getPublicUrl(fileName);

            const url = urlData.publicUrl;

            // Send message based on type
            if (type === 'image') {
                await onSendMessage({
                    url,
                    caption: '',
                    width: 0,
                    height: 0
                }, 'image');
            } else if (type === 'video') {
                await onSendMessage({
                    url,
                    duration: 0
                }, 'video');
            } else {
                await onSendMessage({
                    url,
                    name: file.name,
                    size: file.size,
                    mimeType: file.type
                }, 'file');
            }

        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Erro ao enviar arquivo. Tente novamente.');
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };



    return (
        <div className="border-t border-zinc-800 p-4 bg-zinc-900/80 backdrop-blur-sm">
            <div className="flex items-end gap-3">
                {/* Attachment Button */}
                <div className="relative" ref={attachMenuRef}>
                    <button
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        disabled={isUploading}
                        className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                        title="Anexar arquivo"
                    >
                        {isUploading ? (
                            <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        )}
                    </button>

                    {/* Attach Menu */}
                    {showAttachMenu && (
                        <div className="absolute bottom-full mb-2 left-0 bg-zinc-800 rounded-xl shadow-xl border border-zinc-700 overflow-hidden min-w-[160px] animate-fadeIn">
                            <button
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e) => handleFileSelect(e as any, 'image');
                                    input.click();
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-3 transition-colors"
                            >
                                <span className="text-lg">📷</span>
                                Foto
                            </button>
                            <button
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'video/*';
                                    input.onchange = (e) => handleFileSelect(e as any, 'video');
                                    input.click();
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-3 transition-colors"
                            >
                                <span className="text-lg">🎥</span>
                                Vídeo
                            </button>
                            <button
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.onchange = (e) => handleFileSelect(e as any, 'file');
                                    input.click();
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-3 transition-colors"
                            >
                                <span className="text-lg">📎</span>
                                Arquivo
                            </button>
                        </div>
                    )}
                </div>



                {/* Text Input */}
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite sua mensagem..."
                        rows={1}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 resize-none transition-all max-h-[150px]"
                        style={{ minHeight: '48px' }}
                    />
                </div>

                {/* Send Button */}
                <button
                    onClick={handleSendText}
                    disabled={!text.trim() || isSending}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white transition-all shadow-lg hover:shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
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



            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
            />
        </div>
    );
}
