'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    MessageSquare,
    Send,
    CornerDownRight,
    ThumbsUp,
    MoreVertical,
    Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { deleteComment } from '@/app/actions/comments';
import { toast } from 'sonner';

interface Comment {
    id: string;
    user_id: string;
    content_id: string | null;
    text: string;
    created_at: string;
    parent_id: string | null;
    is_pinned?: boolean;
    updated_at?: string;
    profiles: {
        full_name: string | null;
        avatar_url: string | null;
    }[] | null;
    likes_count?: number;
    user_liked?: boolean;
}

interface LessonCommentsProps {
    lessonId: string;
}

export default function LessonComments({ lessonId }: LessonCommentsProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Load comments
    useEffect(() => {
        if (!lessonId) return;

        const fetchComments = async (isBackground = false) => {
            try {
                if (!isBackground) setLoading(true);
                // 1. Fetch Comments
                const { data: commentsData, error: commentsError } = await supabase
                    .from('comments')
                    .select('*')
                    .eq('content_id', lessonId)
                    .order('created_at', { ascending: false });

                if (commentsError) throw commentsError;

                if (!commentsData || commentsData.length === 0) {
                    setComments([]);
                    setLoading(false);
                    return;
                }

                // 2. Fetch Profiles manually (since FK is missing/unreliable)
                const userIds = Array.from(new Set(commentsData.map(c => c.user_id)));
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', userIds);

                if (profilesError) console.error('Error fetching profiles:', profilesError);

                const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));

                // 3. Fetch Likes
                const commentIds = commentsData.map(c => c.id);
                const { data: likesData, error: likesError } = await supabase
                    .from('comment_likes')
                    .select('comment_id, user_id')
                    .in('comment_id', commentIds);

                // 4. Merge Data
                const mergedComments = commentsData.map(comment => {
                    const profile = profilesMap.get(comment.user_id);
                    const likes = (likesData || []).filter(l => l.comment_id === comment.id);

                    return {
                        ...comment,
                        profiles: profile ? [{ // Mimic existing structure or simplify
                            full_name: profile.full_name,
                            avatar_url: profile.avatar_url
                        }] : [],
                        likes_count: likes.length,
                        user_liked: user ? likes.some(l => l.user_id === user.id) : false
                    };
                });

                setComments(mergedComments);

            } catch (error) {
                console.error('Error fetching comments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchComments();

        // Subscribe to realtime changes
        // Subscribe to realtime changes
        // Separated into two channels to handle DELETEs which might not trigger 'content_id' filter
        // depending on Replica Identity settings (defaults to PK only)
        const channel = supabase
            .channel(`comments:${lessonId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'comments',
                filter: `content_id=eq.${lessonId}`
            }, (payload) => {
                fetchComments(true);
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'comments',
                filter: `content_id=eq.${lessonId}`
            }, (payload) => {
                fetchComments(true);
            })
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'comments'
            }, (payload) => {
                // For DELETE, we check if the deleted ID is in our current list
                // We cannot rely on filter here if Replica Identity is default
                const deletedId = payload.old.id;
                setComments(prev => {
                    const exists = prev.some(c => c.id === deletedId);
                    if (exists) {
                        // Remove immediately
                        return prev.filter(c => c.id !== deletedId);
                    }
                    return prev;
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [lessonId, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('comments')
                .insert({
                    content_id: lessonId,
                    user_id: user.id,
                    text: newComment,
                    parent_id: null
                });

            if (error) throw error;
            setNewComment('');
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Erro ao enviar comentário.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async (parentId: string) => {
        if (!replyText.trim() || !user) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('comments')
                .insert({
                    content_id: lessonId,
                    user_id: user.id,
                    text: replyText,
                    parent_id: parentId
                });

            if (error) throw error;
            setReplyText('');
            setReplyingTo(null);
        } catch (error) {
            console.error('Error posting reply:', error);
            alert('Erro ao enviar resposta.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async (commentId: string, currentLiked: boolean) => {
        if (!user) return;

        // Optimistic update
        setComments(prev => prev.map(c => {
            if (c.id === commentId) {
                return {
                    ...c,
                    likes_count: (c.likes_count || 0) + (currentLiked ? -1 : 1),
                    user_liked: !currentLiked
                };
            }
            return c;
        }));

        try {
            if (currentLiked) {
                await supabase
                    .from('comment_likes')
                    .delete()
                    .eq('comment_id', commentId)
                    .eq('user_id', user.id);
            } else {
                await supabase
                    .from('comment_likes')
                    .insert({
                        comment_id: commentId,
                        user_id: user.id
                    });
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            // Revert optimistic update? For now assume it works or next fetch corrects it.
        }
    };

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const checkDeletePermission = (comment: Comment) => {
        if (!user) return false;
        // Allow if user is author OR user is admin (checking metadata role)
        return user.id === comment.user_id || user.user_metadata?.role === 'admin';
    };

    const confirmDelete = (commentId: string) => {
        setDeleteId(commentId);
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            // Optimistic update
            setComments(prev => prev.filter(c => c.id !== deleteId));

            if (user?.user_metadata?.role === 'admin') {
                const result = await deleteComment(deleteId);
                if (!result.success) {
                    toast.error(`Falha ao excluir: ${result.error}`);
                    // Revert optimistic if needed, but simple reload is easier for edge case
                } else {
                    toast.success('Comentário excluído.');
                }
            } else {
                const { error } = await supabase
                    .from('comments')
                    .delete()
                    .eq('id', deleteId);
                if (error) throw error;
                toast.success('Comentário excluído.');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('Erro ao excluir comentário.');
        } finally {
            setDeleteId(null);
        }
    };

    // Helper to render user avatar
    const UserAvatar = ({ name, url }: { name: string | null, url: string | null }) => {
        const initials = name
            ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : 'U';

        return (
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                style={{ backgroundColor: 'var(--primary-subtle)', color: 'var(--primary-main)' }}>
                {url ? (
                    <img src={url} alt={name || 'User'} className="w-full h-full object-cover" />
                ) : (
                    <span className="font-bold text-sm">{initials}</span>
                )}
            </div>
        );
    };

    // Filter root comments
    const rootComments = comments.filter(c => !c.parent_id);

    // Group replies
    const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return (
        <div className="space-y-8 animate-in fade-in duration-500 relative">
            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 99999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(4px)',
                    }}
                    onClick={() => setDeleteId(null)}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '1rem',
                            padding: '1.5rem',
                            width: '100%',
                            maxWidth: '400px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        }}
                        className="dark:!bg-[#1a1a1d]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem' }} className="text-gray-900 dark:text-white">
                            Excluir Comentário?
                        </h3>
                        <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }} className="text-gray-500 dark:text-gray-400">
                            Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button
                                onClick={() => setDeleteId(null)}
                                style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.5rem' }}
                                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 700, borderRadius: '0.5rem', backgroundColor: '#dc2626', color: 'white' }}
                                className="hover:bg-red-700 transition-colors shadow-lg"
                            >
                                Sim, excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Comment Form */}
            <form onSubmit={handleSubmit} className="mb-8">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Deixe sua dúvida ou comentário
                </label>
                <div className="flex gap-4">
                    <div className="hidden sm:block">
                        <UserAvatar
                            name={user?.user_metadata?.full_name || 'Eu'}
                            url={user?.user_metadata?.avatar_url || null}
                        />
                    </div>
                    <div className="flex-1 space-y-2">
                        <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Escreva algo..."
                            className="w-full min-h-[100px] resize-y border border-gray-200 dark:border-white/10 focus-visible:ring-1 bg-white dark:bg-[#141417] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={submitting || !newComment.trim()}
                                className="gap-2 bg-pink-600 hover:bg-pink-700 text-white"
                            >
                                <Send className="w-4 h-4" />
                                Enviar Comentário
                            </Button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Comments List */}
            <div className="space-y-6">
                {loading && comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        Carregando comentários...
                    </div>
                ) : rootComments.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg border-dashed border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                    </div>
                ) : (
                    rootComments.map(comment => (
                        <div key={comment.id} className="group">
                            {/* Root Comment */}
                            <div className="flex gap-4">
                                <UserAvatar
                                    name={comment.profiles?.[0]?.full_name || 'Desconhecido'}
                                    url={comment.profiles?.[0]?.avatar_url || null}
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                                            {comment.profiles?.[0]?.full_name || 'Usuário Desconhecido'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            • {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                                        </span>
                                    </div>

                                    <p className="text-sm leading-relaxed mb-3 text-gray-600 dark:text-gray-300">
                                        {comment.text}
                                    </p>

                                    <div className="flex items-center gap-4 text-xs font-medium">
                                        <button
                                            onClick={() => handleLike(comment.id, !!comment.user_liked)}
                                            className={`flex items-center gap-1.5 transition-colors ${comment.user_liked ? 'text-pink-500' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            <ThumbsUp className={`w-3.5 h-3.5 ${comment.user_liked ? 'fill-current' : ''}`} />
                                            {comment.likes_count || 0} Curtidas
                                        </button>

                                        <button
                                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            Responder
                                        </button>

                                        {checkDeletePermission(comment) && (
                                            <button
                                                onClick={() => confirmDelete(comment.id)}
                                                className="flex items-center gap-1.5 text-red-500/70 hover:text-red-500 transition-colors ml-auto opacity-0 group-hover:opacity-100"
                                            >
                                                Excluir
                                            </button>
                                        )}
                                    </div>

                                    {/* Reply Form */}
                                    {replyingTo === comment.id && (
                                        <div className="mt-4 pl-4 border-l-2 border-gray-200 dark:border-white/10">
                                            <div className="flex gap-3">
                                                <Textarea
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    placeholder="Escreva sua resposta..."
                                                    className="min-h-[80px] text-sm bg-white dark:bg-[#141417] text-gray-900 dark:text-white border-gray-200 dark:border-white/10"
                                                    autoFocus
                                                />
                                                <div className="flex flex-col gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleReply(comment.id)}
                                                        disabled={submitting || !replyText.trim()}
                                                        className="bg-pink-600 hover:bg-pink-700 text-white"
                                                    >
                                                        Responder
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setReplyingTo(null)}
                                                        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                                    >
                                                        Cancelar
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Replies */}
                                    {getReplies(comment.id).length > 0 && (
                                        <div className="mt-4 pl-4 space-y-4 border-l-2 border-gray-100 dark:border-white/5">
                                            {getReplies(comment.id).map(reply => (
                                                <div key={reply.id} className="flex gap-3">
                                                    <div className="w-8 h-8">
                                                        <UserAvatar
                                                            name={reply.profiles?.[0]?.full_name || 'Desconhecido'}
                                                            url={reply.profiles?.[0]?.avatar_url || null}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-xs text-gray-800 dark:text-gray-200">
                                                                {reply.profiles?.[0]?.full_name || 'Usuário Desconhecido'}
                                                            </span>
                                                            <span className="text-[10px] text-gray-500">
                                                                • {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: ptBR })}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm mb-2 text-gray-600 dark:text-gray-300">
                                                            {reply.text}
                                                        </p>
                                                        <div className="flex items-center gap-4 text-xs">
                                                            <button
                                                                onClick={() => handleLike(reply.id, !!reply.user_liked)}
                                                                className={`flex items-center gap-1.5 transition-colors ${reply.user_liked ? 'text-pink-500' : 'text-gray-500 hover:text-gray-300'}`}
                                                            >
                                                                <ThumbsUp className={`w-3 h-3 ${reply.user_liked ? 'fill-current' : ''}`} />
                                                                {reply.likes_count || 0}
                                                            </button>

                                                            {checkDeletePermission(reply) && (
                                                                <button
                                                                    onClick={() => confirmDelete(reply.id)}
                                                                    className="text-red-500/70 hover:text-red-500 transition-colors ml-auto"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
