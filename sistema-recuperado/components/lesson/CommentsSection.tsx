'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MessageSquare, MoreVertical, Pin, Trash2, CornerDownRight, Send } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

interface Comment {
    id: string;
    content_id: string;
    user_id: string;
    parent_id: string | null;
    text: string;
    is_pinned: boolean;
    created_at: string;
    user?: {
        full_name: string;
        avatar_url: string | null;
        role?: string;
    };
    replies?: Comment[];
}

interface CommentsSectionProps {
    lessonId: string;
    currentUserRole?: string; // 'admin' | 'student'
}

export default function CommentsSection({ lessonId, currentUserRole }: CommentsSectionProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        if (lessonId) {
            fetchComments();
            // Realtime subscription could be added here
        }
    }, [lessonId]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    user:users (
                        full_name,
                        avatar_url,
                        role
                    )
                `)
                .eq('content_id', lessonId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Structure comments into hierarchy
            const flatComments = (data || []) as unknown as Comment[];
            const rootComments: Comment[] = [];
            const replyMap = new Map<string, Comment[]>();

            flatComments.forEach(comment => {
                if (comment.parent_id) {
                    if (!replyMap.has(comment.parent_id)) {
                        replyMap.set(comment.parent_id, []);
                    }
                    replyMap.get(comment.parent_id)!.push(comment);
                } else {
                    rootComments.push(comment);
                }
            });

            // Associate replies
            rootComments.forEach(comment => {
                comment.replies = (replyMap.get(comment.id) || []).sort(
                    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
            });

            // Sort pinned first
            rootComments.sort((a, b) => {
                if (a.is_pinned === b.is_pinned) {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }
                return a.is_pinned ? -1 : 1;
            });

            setComments(rootComments);
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (parentId: string | null = null) => {
        const text = parentId ? replyText : newComment;
        if (!text.trim() || !user) return;

        try {
            const { error } = await supabase
                .from('comments')
                .insert({
                    content_id: lessonId,
                    user_id: user.id,
                    parent_id: parentId,
                    text: text.trim()
                });

            if (error) throw error;

            // Reset inputs
            if (parentId) {
                setReplyingTo(null);
                setReplyText('');
            } else {
                setNewComment('');
            }

            // Refresh comments 
            fetchComments();

        } catch (error) {
            console.error('Error posting comment:', error);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('Excluir este comentário?')) return;
        try {
            await supabase.from('comments').delete().eq('id', commentId);
            fetchComments();
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const handlePin = async (commentId: string, currentStatus: boolean) => {
        try {
            await supabase
                .from('comments')
                .update({ is_pinned: !currentStatus })
                .eq('id', commentId);
            fetchComments();
        } catch (error) {
            console.error('Error pinning comment:', error);
        }
    };

    // Render individual comment
    const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => {
        const isAuthor = user?.id === comment.user_id;
        const isAdmin = currentUserRole === 'admin';
        const canDelete = isAuthor || isAdmin;

        return (
            <div className={`mb-6 ${isReply ? 'ml-12 border-l-2 border-gray-800 pl-4' : ''}`}>
                <div className="flex gap-4 group">
                    <div className="flex-shrink-0">
                        {comment.user?.avatar_url ? (
                            <img
                                src={comment.user.avatar_url}
                                alt={comment.user.full_name || 'User'}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500 font-bold">
                                {comment.user?.full_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white">
                                {comment.user?.full_name || 'Usuário'}
                            </span>
                            {comment.user?.role === 'admin' && (
                                <span className="bg-pink-500/10 text-pink-500 text-xs px-2 py-0.5 rounded-full">
                                    Admin
                                </span>
                            )}
                            <span className="text-gray-500 text-sm">
                                {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                            {comment.is_pinned && (
                                <span className="flex items-center gap-1 text-green-400 text-xs">
                                    <Pin className="w-3 h-3" /> Fixado
                                </span>
                            )}
                        </div>

                        <p className="text-gray-300 mb-2 leading-relaxed whitespace-pre-wrap">
                            {comment.text}
                        </p>

                        <div className="flex items-center gap-4 text-sm">
                            <button
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className="text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                            >
                                <CornerDownRight className="w-4 h-4" /> Responder
                            </button>

                            {isAdmin && !isReply && (
                                <button
                                    onClick={() => handlePin(comment.id, comment.is_pinned)}
                                    className={`${comment.is_pinned ? 'text-green-400' : 'text-gray-500 hover:text-white'} flex items-center gap-1 transition-colors`}
                                >
                                    <Pin className="w-4 h-4" /> {comment.is_pinned ? 'Desafixar' : 'Fixar'}
                                </button>
                            )}

                            {canDelete && (
                                <button
                                    onClick={() => handleDelete(comment.id)}
                                    className="text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" /> Excluir
                                </button>
                            )}
                        </div>

                        {/* Reply Input */}
                        {replyingTo === comment.id && (
                            <div className="mt-4 flex gap-2">
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Escreva sua resposta..."
                                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2 text-white focus:outline-none focus:border-pink-500 transition-colors"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit(comment.id)}
                                />
                                <button
                                    onClick={() => handleSubmit(comment.id)}
                                    className="p-2 bg-pink-600 rounded-full text-white hover:bg-pink-500 transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Render Replies */}
                {comment.replies?.map(reply => (
                    <CommentItem key={reply.id} comment={reply} isReply={true} />
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-pink-500" />
                Comentários ({comments.length + comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)})
            </h3>

            {/* New Comment Input */}
            <div className="bg-zinc-900/50 rounded-xl p-4 mb-8 border border-white/5">
                <div className="flex gap-4">
                    <div className="flex-shrink-0">
                        {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} className="w-10 h-10 rounded-full" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500 font-bold">
                                {user?.user_metadata?.full_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Tem alguma dúvida ou sugestão? Comente aqui..."
                            className="w-full bg-transparent text-white border-0 focus:ring-0 p-0 placeholder-gray-500 resize-none h-20"
                        />
                        <div className="flex justify-end mt-2 pt-2 border-t border-white/5">
                            <button
                                onClick={() => handleSubmit()}
                                disabled={!newComment.trim()}
                                className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Publicar Comentário
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments List */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Carregando comentários...</div>
            ) : comments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    Seja o primeiro a comentar nesta aula!
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map(comment => (
                        <CommentItem key={comment.id} comment={comment} />
                    ))}
                </div>
            )}
        </div>
    );
}
