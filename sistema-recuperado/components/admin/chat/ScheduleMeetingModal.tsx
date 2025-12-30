'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';

interface ScheduleMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: {
        title: string;
        description: string;
        date: string;
        link: string;
    }) => void;
}

export function ScheduleMeetingModal({ isOpen, onClose, onSave }: ScheduleMeetingModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [link, setLink] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setDescription('');
            setDate('');
            setTime('');
            setLink('');
            setErrors({});
        }
    }, [isOpen]);

    // Handle escape key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    // Validate form
    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!title.trim()) newErrors.title = 'Título é obrigatório';
        if (!date) newErrors.date = 'Data é obrigatória';
        if (!time) newErrors.time = 'Horário é obrigatório';
        if (!link.trim()) newErrors.link = 'Link é obrigatório';

        // Validate URL
        if (link.trim() && !isValidUrl(link)) {
            newErrors.link = 'URL inválida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submit
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        // Combine date and time into ISO string
        const dateTime = new Date(`${date}T${time}`).toISOString();

        onSave({
            title: title.trim(),
            description: description.trim(),
            date: dateTime,
            link: link.trim()
        });
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 w-full max-w-md mx-4 animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white">Agendar Reunião</h2>
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Título da Reunião *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Mentoria Individual"
                            className={`w-full px-4 py-3 bg-zinc-800 border rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all ${errors.title ? 'border-red-500' : 'border-zinc-700 focus:border-pink-500'
                                }`}
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-400">{errors.title}</p>
                        )}
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Data *
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className={`w-full px-4 py-3 bg-zinc-800 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all ${errors.date ? 'border-red-500' : 'border-zinc-700 focus:border-pink-500'
                                    }`}
                            />
                            {errors.date && (
                                <p className="mt-1 text-sm text-red-400">{errors.date}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Horário *
                            </label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className={`w-full px-4 py-3 bg-zinc-800 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all ${errors.time ? 'border-red-500' : 'border-zinc-700 focus:border-pink-500'
                                    }`}
                            />
                            {errors.time && (
                                <p className="mt-1 text-sm text-red-400">{errors.time}</p>
                            )}
                        </div>
                    </div>

                    {/* Link */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Link da Reunião *
                        </label>
                        <input
                            type="url"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://zoom.us/j/..."
                            className={`w-full px-4 py-3 bg-zinc-800 border rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all ${errors.link ? 'border-red-500' : 'border-zinc-700 focus:border-pink-500'
                                }`}
                        />
                        {errors.link && (
                            <p className="mt-1 text-sm text-red-400">{errors.link}</p>
                        )}
                        <p className="mt-1 text-xs text-zinc-500">
                            Zoom, Google Meet, Teams ou qualquer link de reunião
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Descrição <span className="text-zinc-500">(opcional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descreva o objetivo da reunião..."
                            rows={3}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-pink-500/25"
                        >
                            Agendar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Helper function to validate URL
function isValidUrl(string: string): boolean {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}
