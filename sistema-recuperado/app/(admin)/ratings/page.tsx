'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Star, MessageCircle, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

interface RatingItem {
    id: string;
    stars: number;
    created_at: string;
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
    feedback?: {
        id: string;
        text: string;
        created_at: string;
    };
}

interface Stats {
    totalRatings: number;
    averageStars: number;
    totalFeedback: number;
    distribution: { [key: number]: number };
}

export default function AdminRatingsPage() {
    const [ratings, setRatings] = useState<RatingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats>({ totalRatings: 0, averageStars: 0, totalFeedback: 0, distribution: {} });
    const [expandedRatings, setExpandedRatings] = useState<Set<string>>(new Set());
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch ratings
                const { data: ratingsData, error: ratingsError } = await (supabase
                    .from('ratings' as any)
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100)) as { data: any[] | null; error: any };

                if (ratingsError) throw ratingsError;
                if (!ratingsData?.length) {
                    setRatings([]);
                    setLoading(false);
                    return;
                }

                // Calculate stats
                const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                let totalStars = 0;
                ratingsData.forEach((r: any) => {
                    distribution[r.stars] = (distribution[r.stars] || 0) + 1;
                    totalStars += r.stars;
                });

                // 2. Collect IDs
                const userIds = Array.from(new Set(ratingsData.map((r: any) => r.user_id as string)));
                const contentIds = Array.from(new Set(ratingsData.map((r: any) => r.content_id as string)));
                const ratingIds = ratingsData.map((r: any) => r.id as string);

                // 3. Fetch Profiles
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, email')
                    .in('id', userIds);

                const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

                // 4. Fetch Content Hierarchy
                const { data: contentsData } = await supabase
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

                const contentMap = new Map(contentsData?.map(c => [c.id, c]));

                // 5. Fetch Feedback
                const { data: feedbackData } = await (supabase
                    .from('feedback' as any)
                    .select('id, rating_id, text, created_at')
                    .in('rating_id', ratingIds)) as { data: any[] | null; error: any };

                const feedbackMap = new Map(feedbackData?.map((f: any) => [f.rating_id, f]));

                // 6. Merge
                const merged = ratingsData.map((r: any) => {
                    const profile = profilesMap.get(r.user_id);
                    const content = contentMap.get(r.content_id);
                    const feedback = feedbackMap.get(r.id);

                    return {
                        id: r.id,
                        stars: r.stars,
                        created_at: r.created_at,
                        user_id: r.user_id,
                        content_id: r.content_id,
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
                        feedback: feedback ? {
                            id: feedback.id,
                            text: feedback.text,
                            created_at: feedback.created_at
                        } : undefined
                    };
                });

                setRatings(merged);
                setStats({
                    totalRatings: ratingsData.length,
                    averageStars: Math.round((totalStars / ratingsData.length) * 10) / 10,
                    totalFeedback: feedbackData?.length || 0,
                    distribution
                });

            } catch (error) {
                console.error('Error loading ratings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const toggleExpand = (ratingId: string) => {
        setExpandedRatings(prev => {
            const newSet = new Set(prev);
            if (newSet.has(ratingId)) {
                newSet.delete(ratingId);
            } else {
                newSet.add(ratingId);
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

    const StarDisplay = ({ count }: { count: number }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
                <Star
                    key={n}
                    className={`w-4 h-4 ${n <= count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                />
            ))}
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                    Avaliações
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Acompanhe as avaliações e feedbacks dos alunos.
                </p>
            </header>

            {/* Stats Cards */}
            {!loading && stats.totalRatings > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/10 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800/50">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="w-5 h-5 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Média Geral</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{stats.averageStars}</span>
                            <StarDisplay count={Math.round(stats.averageStars)} />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/10 p-6 rounded-xl border border-pink-200 dark:border-pink-800/50">
                        <div className="flex items-center gap-3 mb-2">
                            <Star className="w-5 h-5 text-pink-600" />
                            <span className="text-sm font-medium text-pink-700 dark:text-pink-400">Total de Avaliações</span>
                        </div>
                        <span className="text-3xl font-bold text-pink-700 dark:text-pink-300">{stats.totalRatings}</span>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 p-6 rounded-xl border border-purple-200 dark:border-purple-800/50">
                        <div className="flex items-center gap-3 mb-2">
                            <MessageCircle className="w-5 h-5 text-purple-600" />
                            <span className="text-sm font-medium text-purple-700 dark:text-purple-400">Feedbacks Recebidos</span>
                        </div>
                        <span className="text-3xl font-bold text-purple-700 dark:text-purple-300">{stats.totalFeedback}</span>
                    </div>
                </div>
            )}

            {/* Ratings List */}
            {loading ? (
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : ratings.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhuma avaliação encontrada.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {ratings.map((rating) => {
                        const isExpanded = expandedRatings.has(rating.id);

                        return (
                            <div key={rating.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <UserAvatar
                                        url={rating.profile?.avatar_url}
                                        name={rating.profile?.full_name}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="font-semibold text-gray-900 dark:text-white truncate">
                                                {rating.profile?.full_name || 'Usuário Desconhecido'}
                                            </span>
                                            <StarDisplay count={rating.stars} />
                                            <span className="text-xs text-gray-400">
                                                • {formatDistanceToNow(new Date(rating.created_at), { addSuffix: true, locale: ptBR })}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-500 truncate">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Aula:</span>{' '}
                                            {rating.lesson?.title || 'Aula removida'}
                                            {rating.lesson?.module?.portal?.name && (
                                                <span className="ml-2 text-gray-400">
                                                    ({rating.lesson.module.portal.name})
                                                </span>
                                            )}
                                        </p>

                                        {/* Feedback */}
                                        {rating.feedback && (
                                            <div className="mt-3">
                                                <button
                                                    onClick={() => toggleExpand(rating.id)}
                                                    className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                    Ver feedback
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>

                                                {isExpanded && (
                                                    <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-800/50">
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                            "{rating.feedback.text}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
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
