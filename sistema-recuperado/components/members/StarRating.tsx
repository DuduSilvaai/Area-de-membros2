'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { submitRatingWithUser, getUserRating } from '@/app/actions/ratings';
import { toast } from 'sonner';

interface StarRatingProps {
    contentId: string;
    onRatingComplete?: (ratingId: string) => void;
}

export default function StarRating({ contentId, onRatingComplete }: StarRatingProps) {
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [existingRating, setExistingRating] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasRated, setHasRated] = useState(false);

    // Load existing rating
    useEffect(() => {
        const loadRating = async () => {
            if (!user?.id || !contentId) return;

            const result = await getUserRating(contentId, user.id);
            if (result.success && result.rating) {
                setExistingRating(result.rating.stars);
                setRating(result.rating.stars);
                setHasRated(true);
            }
        };

        loadRating();
    }, [user?.id, contentId]);

    const handleClick = async (value: number) => {
        if (!user?.id || isSubmitting) return;

        setIsSubmitting(true);
        setRating(value);

        try {
            const result = await submitRatingWithUser(contentId, user.id, value);

            if (result.success) {
                setHasRated(true);
                setExistingRating(value);
                toast.success('Avaliação enviada!');

                if (onRatingComplete && result.ratingId) {
                    onRatingComplete(result.ratingId);
                }
            } else {
                toast.error(result.error || 'Erro ao enviar avaliação');
            }
        } catch (error) {
            toast.error('Erro ao enviar avaliação');
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayRating = hoverRating || rating;

    return (
        <div className="flex flex-col items-center gap-3 p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {hasRated ? 'Sua avaliação' : 'Avalie esta aula'}
            </p>

            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleClick(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className={`
                            relative p-1 transition-all duration-200 
                            ${isSubmitting ? 'cursor-wait' : 'cursor-pointer'}
                            hover:scale-110 active:scale-95
                            focus:outline-none focus:ring-2 focus:ring-pink-500/50 rounded-full
                        `}
                        aria-label={`Avaliar ${star} estrela${star > 1 ? 's' : ''}`}
                    >
                        <Star
                            className={`
                                w-8 h-8 transition-all duration-200
                                ${star <= displayRating
                                    ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]'
                                    : 'text-gray-300 dark:text-gray-600'
                                }
                            `}
                        />
                        {/* Sparkle effect on hover */}
                        {star <= hoverRating && star > (existingRating || 0) && (
                            <span className="absolute inset-0 animate-ping opacity-30">
                                <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {hasRated && (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                    Clique para alterar sua avaliação
                </p>
            )}
        </div>
    );
}
