'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { MessageSquare, ArrowRight, Video, User, ChevronDown, ChevronUp, History, Reply, Send, X, CornerDownRight } from 'lucide-react';

interface CommentEdit {
    id: string;
    original_text: string;
    edited_at: string;
}

interface CommentItem {
    id: string;
    text: string;
    created_at: string;
    updated_at?: string;
    user_id: string;
    content_id: string;
    profile?: {
        full_name: string | null;
        avatar_url: string | null;
        email: string | null;
    };
    lesson?: {
        title: string;
        module_id: string;
        module?: {
            title: string;
            portal_id: string;
            portal?: {
                name: string;
            };
        };
    };
    edits?: CommentEdit[];
}

export default function AdminCommentsPage() {
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    // Reply State
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch recent comments
                const { data: commentsData, error: commentsError } = await supabase
                    .from('comments')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (commentsError) throw commentsError;
                if (!commentsData?.length) {
                    setComments([]);
                    setLoading(false);
                    return;
                }

                // 2. Collect IDs
                const userIds = Array.from(new Set(commentsData.map(c => c.user_id)));
                const contentIds = Array.from(new Set(commentsData.map(c => c.content_id).filter((id): id is string => !!id)));
                const commentIds = commentsData.map(c => c.id);

                // 3. Fetch Profiles
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, email')
                    .in('id', userIds);

                const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

                // 4. Fetch Content Hierarchy
                const { data: contentsData, error: contentError } = await supabase
                    .from('contents')
                    .select(`
                        id, 
                        title, 
                        module_id,
                        modules (
                            id,
                            title,
                            portal_id,
                            portals (
                                id, 
                                name
                            )
                        )
                    `)
                    .in('id', contentIds);

                if (contentError) console.error('Error fetching contents:', contentError);

                const contentMap = new Map(contentsData?.map(c => [c.id, c]));

                // 5. Fetch Edit History
                const { data: editsData } = await (supabase
                    .from('comment_edits' as any)
                    .select('id, comment_id, original_text, edited_at')
                    .in('comment_id', commentIds)
                    .order('edited_at', { ascending: false })) as { data: any[] | null; error: any };

                const editsMap = new Map<string, CommentEdit[]>();
                editsData?.forEach((edit: any) => {
                    const existing = editsMap.get(edit.comment_id) || [];
                    existing.push({
                        id: edit.id,
                        original_text: edit.original_text,
                        edited_at: edit.edited_at
                    });
                    editsMap.set(edit.comment_id, existing);
                });

                // 6. Merge
                const merged = commentsData.map(c => {
                    const profile = profilesMap.get(c.user_id);
                    const content = c.content_id ? contentMap.get(c.content_id) : undefined;

                    return {
                        id: c.id,
                        text: c.text,
                        created_at: c.created_at,
                        updated_at: c.updated_at,
                        user_id: c.user_id,
                        content_id: c.content_id || '',
                        profile: profile,
                        lesson: content ? {
                            title: content.title,
                            module_id: content.module_id,
                            module: content.modules ? {
                                title: content.modules.title,
                                portal_id: content.modules.portal_id || '',
                                portal: content.modules.portals ? {
                                    name: content.modules.portals.name
                                } : undefined
                            } : undefined
                        } : undefined,
                        edits: editsMap.get(c.id) || []
                    };
                });

                setComments(merged);

            } catch (error) {
                console.error('Error loading comments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const toggleExpand = (commentId: string) => {
        setExpandedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    const UserAvatar = ({ url, name }: { url?: string | null, name?: string | null }) => {
        const initials = name ? name.substring(0, 2).toUpperCase() : 'U';
        return (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                {url ? <img src={url} alt={name || 'User'} className="w-full h-full object-cover" /> : <span className="font-semibold text-gray-500">{initials}</span>}
            </div>
        );
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('Tem certeza que deseja excluir este comentário?')) return;

        try {
            // Optimistic update
            setComments(prev => prev.filter(c => c.id !== commentId));

            // Call Server Action
            const { deleteComment } = await import('@/app/actions/comments');
            const result = await deleteComment(commentId);

            if (!result.success) {
                alert(`Erro no servidor: ${result.error}`);
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Erro ao excluir comentário. Tente novamente.');
            window.location.reload();
        }
    };

    const handleReply = async (commentId: string, contentId: string) => {
        if (!replyText.trim()) return;

        setIsSubmittingReply(true);
        try {
            const { replyToComment } = await import('@/app/actions/comments');
            const result = await replyToComment(commentId, replyText, contentId);

            if (result.success && result.comment) {
                // Optimistic UI Update (append as a new comment or handle visually)
                // Since this is a flat list sorted by date, adding it to the top is easiest for feedback,
                // but technically it's a child. Ideally we'd re-fetch, but let's just toast and clear.
                setReplyingTo(null);
                setReplyText('');
                alert('Resposta enviada com sucesso!'); // Or use a toast if available

                // Re-fetch to show the new reply in context (simple approach)
                window.location.reload();
            } else {
                alert(result.error || 'Erro ao enviar resposta');
            }
        } catch (error) {
            console.error('Error replying:', error);
            alert('Erro ao enviar resposta.');
        } finally {
            setIsSubmittingReply(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <MessageSquare className="w-8 h-8 text-pink-600" />
                    Últimos Comentários
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Acompanhe as interações mais recentes dos alunos nas aulas.
                </p>
            </header>

            {loading ? (
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhum comentário encontrado.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {comments.map((comment) => {
                        const portalId = comment.lesson?.module?.portal_id;
                        const lessonId = comment.content_id;
                        const lessonLink = portalId && lessonId ? `/members/${portalId}/lesson/${lessonId}` : '#';
                        const isEdited = comment.updated_at && comment.updated_at !== comment.created_at;
                        const isExpanded = expandedComments.has(comment.id);
                        const isReplying = replyingTo === comment.id;

                        // Context Info
                        const portalName = comment.lesson?.module?.portal?.name;
                        const moduleTitle = comment.lesson?.module?.title;
                        const lessonTitle = comment.lesson?.title;

                        return (
                            <div key={comment.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group">
                                <div className="flex items-start gap-4">
                                    <UserAvatar
                                        url={comment.profile?.avatar_url}
                                        name={comment.profile?.full_name}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="font-semibold text-gray-900 dark:text-white truncate">
                                                {comment.profile?.full_name || 'Usuário Desconhecido'}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {comment.profile?.email}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                • {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                                                {isEdited && (
                                                    <span className="ml-1 text-orange-500 font-medium">(editado)</span>
                                                )}
                                            </span>
                                        </div>

                                        <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap leading-relaxed">
                                            "{comment.text}"
                                        </p>

                                        {/* Context Badge */}
                                        <div className="flex flex-wrap items-center gap-2 mb-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50 text-sm">
                                            {portalName && (
                                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                                    <span className="font-semibold text-gray-800 dark:text-gray-200">Portal:</span>
                                                    <span>{portalName}</span>
                                                    <ChevronDown className="-rotate-90 text-gray-300 mx-1" size={14} />
                                                </div>
                                            )}
                                            {moduleTitle && (
                                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                                    <span className="font-semibold text-gray-800 dark:text-gray-200">Módulo:</span>
                                                    <span>{moduleTitle}</span>
                                                    <ChevronDown className="-rotate-90 text-gray-300 mx-1" size={14} />
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-medium">
                                                <Video size={14} />
                                                <span>{lessonTitle || 'Aula removida'}</span>
                                            </div>
                                        </div>

                                        {/* Edit History Toggle */}
                                        {isEdited && comment.edits && comment.edits.length > 0 && (
                                            <div className="mb-4">
                                                <button
                                                    onClick={() => toggleExpand(comment.id)}
                                                    className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                                                >
                                                    <History className="w-4 h-4" />
                                                    Ver histórico de edições ({comment.edits.length})
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>

                                                {isExpanded && (
                                                    <div className="mt-3 pl-4 border-l-2 border-orange-200 dark:border-orange-800 space-y-3">
                                                        {comment.edits.map((edit, index) => (
                                                            <div key={edit.id} className="text-sm">
                                                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                                                    <span className="font-medium">Versão {comment.edits!.length - index}</span>
                                                                    <span>•</span>
                                                                    <span>{formatDistanceToNow(new Date(edit.edited_at), { addSuffix: true, locale: ptBR })}</span>
                                                                </div>
                                                                <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-2 rounded italic">
                                                                    "{edit.original_text}"
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Reply Form */}
                                        {isReplying && (
                                            <div className="mt-4 pl-4 border-l-2 border-pink-200 dark:border-pink-900/30 animate-in slide-in-from-top-2 fade-in duration-200">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-1">
                                                        <textarea
                                                            value={replyText}
                                                            onChange={(e) => setReplyText(e.target.value)}
                                                            placeholder="Escreva sua resposta..."
                                                            className="w-full min-h-[100px] p-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all resize-none"
                                                            autoFocus
                                                        />
                                                        <div className="flex justify-end gap-2 mt-2">
                                                            <button
                                                                onClick={() => {
                                                                    setReplyingTo(null);
                                                                    setReplyText('');
                                                                }}
                                                                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                            >
                                                                Cancelar
                                                            </button>
                                                            <button
                                                                onClick={() => handleReply(comment.id, comment.content_id)}
                                                                disabled={!replyText.trim() || isSubmittingReply}
                                                                className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                {isSubmittingReply ? (
                                                                    <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                                                ) : (
                                                                    <Send size={14} />
                                                                )}
                                                                Enviar Resposta
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="shrink-0 flex flex-col items-end gap-2">
                                        {lessonLink !== '#' && (
                                            <Link
                                                href={lessonLink}
                                                target="_blank"
                                                className="group/link flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                                title="Ver na aula"
                                            >
                                                <ArrowRight className="w-4 h-4 transition-transform group-hover/link:-rotate-45" />
                                            </Link>
                                        )}

                                        {!isReplying && (
                                            <button
                                                onClick={() => {
                                                    setReplyingTo(comment.id);
                                                    setReplyText(`@${comment.profile?.full_name?.split(' ')[0] || 'Aluno'} `);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-pink-50 dark:bg-pink-900/10 text-pink-600 dark:text-pink-400 rounded-lg font-medium text-sm hover:bg-pink-100 dark:hover:bg-pink-900/20 transition-colors w-full justify-center"
                                            >
                                                <Reply size={16} />
                                                Responder
                                            </button>
                                        )}

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(comment.id);
                                            }}
                                            className="relative z-10 cursor-pointer group flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg font-medium text-sm hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors w-full justify-center"
                                        >
                                            <X size={16} />
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
