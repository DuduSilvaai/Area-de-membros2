'use client';

import { useState } from 'react';
import { X, Send, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { submitFeedback } from '@/app/actions/ratings';
import { toast } from 'sonner';

interface FeedbackModalProps {
    isOpen: boolean;
    ratingId: string;
    onClose: () => void;
}

export default function FeedbackModal({ isOpen, ratingId, onClose }: FeedbackModalProps) {
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!feedbackText.trim()) {
            onClose();
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await submitFeedback(ratingId, feedbackText);

            if (result.success) {
                toast.success('Obrigado pelo seu feedback!');
                setFeedbackText('');
                onClose();
            } else {
                toast.error(result.error || 'Erro ao enviar feedback');
            }
        } catch (error) {
            toast.error('Erro ao enviar feedback');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = () => {
        setFeedbackText('');
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
            onClick={handleSkip}
        >
            <div
                className="relative w-full max-w-md bg-white dark:bg-[#1a1a1d] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 animate-in zoom-in-95 fade-in duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
                    aria-label="Fechar"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="pt-6 px-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/20">
                        <Star className="w-8 h-8 text-white fill-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        Obrigado pela avaliação!
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Quer compartilhar mais detalhes? (opcional)
                    </p>
                </div>

                {/* Body */}
                <div className="p-6">
                    <Textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Conte-nos o que você achou da aula, sugestões de melhoria, ou qualquer feedback..."
                        className="min-h-[120px] resize-none bg-gray-50 dark:bg-[#141417] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-pink-500"
                        disabled={isSubmitting}
                    />

                    {/* Actions */}
                    <div className="flex gap-3 mt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleSkip}
                            disabled={isSubmitting}
                            className="flex-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            Pular
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !feedbackText.trim()}
                            className="flex-1 gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg shadow-pink-500/20"
                        >
                            <Send className="w-4 h-4" />
                            {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
