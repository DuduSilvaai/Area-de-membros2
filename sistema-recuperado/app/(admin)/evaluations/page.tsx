'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getEvaluations, Evaluation } from './actions';
import { Star, MessageSquareQuote, Calendar, User, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Keep using cn for class merging if available, or just string templates if simple

// --- Components ---

function RatingStars({ rating }: { rating: number }) {
    return (
        <div className="flex gap-1" title={`${rating} estrelas`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={16}
                    className={cn(
                        "transition-all duration-300",
                        star <= rating
                            ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]"
                            : "fill-transparent text-gray-600"
                    )}
                />
            ))}
        </div>
    );
}

function EvaluationCard({ evaluation }: { evaluation: Evaluation }) {
    const { user, content, rating, comment, created_at } = evaluation;

    // Format date
    const dateObj = new Date(created_at);
    const dateFormatted = dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    const timeFormatted = dateObj.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 shadow-md hover:shadow-xl">
            <div className="flex flex-col md:flex-row gap-6">
                {/* User Info & Rating */}
                <div className="flex-shrink-0 flex md:flex-col items-center md:items-start gap-3 md:w-48">
                    <div className="relative">
                        {user.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.full_name || 'User'}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white/10 group-hover:border-pink-500/50 transition-colors"
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.full_name}&background=random`; }}
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-600/20 flex items-center justify-center border-2 border-white/10 text-pink-400 font-bold text-lg">
                                {(user.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-1 border border-white/10">
                            <User size={10} className="text-gray-400" />
                        </div>
                    </div>

                    <div className="flex flex-col min-w-0">
                        <h3 className="font-semibold text-sm text-[var(--text-primary)] truncate max-w-[150px]" title={user.full_name || ''}>
                            {user.full_name || 'Anônimo'}
                        </h3>
                        <span className="text-xs text-[var(--text-secondary)] truncate max-w-[150px]" title={user.email || ''}>
                            {user.email}
                        </span>
                    </div>
                </div>

                {/* Content & Comment */}
                <div className="flex-grow space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <BookOpen size={14} className="text-pink-500" />
                            <span className="font-medium text-[var(--text-primary)]">{content.title}</span>
                            {content.module_title && (
                                <>
                                    <span className="text-gray-600">•</span>
                                    <span className="text-xs opacity-70">{content.module_title}</span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <RatingStars rating={rating} />
                            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] bg-white/5 px-2 py-1 rounded-full">
                                <Calendar size={12} />
                                <span>{dateFormatted} <span className="opacity-50">às</span> {timeFormatted}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-1">
                        {comment ? (
                            <div className="relative pl-7">
                                <MessageSquareQuote className="absolute left-0 top-0 text-pink-500/30" size={20} />
                                <p className="text-sm text-[var(--text-primary)] leading-relaxed italic opacity-90">
                                    "{comment}"
                                </p>
                            </div>
                        ) : (
                            <span className="text-xs text-[var(--text-secondary)] italic opacity-50 pl-1">
                                Sem comentário escrito.
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Main Page ---

export default function EvaluationsPage() {
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const LIMIT = 10;

    const fetchEvaluations = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, count, error: fetchError } = await getEvaluations(page, LIMIT);
            if (fetchError) throw new Error(fetchError);

            setEvaluations(data);
            setTotalCount(count);
        } catch (err: any) {
            console.error(err);
            if (err.message && (err.message.includes('relationship') || err.message.includes('foreign key'))) {
                setError('Erro de Schema: Execute o script fix_relationships.sql no Supabase.');
            } else {
                setError('Falha ao carregar avaliações. Tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchEvaluations();
    }, [fetchEvaluations]);

    const totalPages = Math.ceil(totalCount / LIMIT);

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500">
                        Avaliações dos Alunos
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-sm max-w-3xl leading-relaxed">
                        Acompanhe o feedback das aulas. Veja o que os alunos estão dizendo, suas notas e em quais conteúdos.
                    </p>
                </div>

                {/* Simple Stats or Filter could go here */}
                <div className="flex gap-4">
                    {/* Placeholder for future filters */}
                </div>
            </div>

            {/* Content */}
            <div className="space-y-4 min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-[var(--text-secondary)]">
                        <Loader2 size={40} className="animate-spin text-pink-500" />
                        <p className="text-sm font-medium">Carregando avaliações...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400 bg-red-500/5 rounded-2xl border border-red-500/10">
                        <AlertCircle size={32} />
                        <p className="font-medium">{error}</p>
                        <button
                            onClick={() => fetchEvaluations()}
                            className="text-xs bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-full transition-colors"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : evaluations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-[var(--text-secondary)] bg-white/5 rounded-3xl border border-white/5 border-dashed">
                        <Star size={48} className="text-gray-700" />
                        <p className="text-lg font-medium text-[var(--text-primary)]">Nenhuma avaliação ainda</p>
                        <p className="text-sm w-full max-w-2xl text-center leading-relaxed px-4">
                            Assim que os alunos avaliarem as aulas, elas aparecerão aqui.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {evaluations.map((evaluation) => (
                            <EvaluationCard key={evaluation.id} evaluation={evaluation} />
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-4">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-[var(--text-secondary)] font-medium">
                        Página {page} de {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    >
                        Próxima
                    </button>
                </div>
            )}
        </div>
    );
}
