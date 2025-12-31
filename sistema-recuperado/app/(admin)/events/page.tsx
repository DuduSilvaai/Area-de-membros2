'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Calendar, Link as LinkIcon, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Event {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    link_url: string | null;
    banner_url: string | null;
}

export default function AdminEventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        link_url: ''
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('event_date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Combine date and time
            const eventDate = new Date(`${formData.date}T${formData.time}`);

            const { error } = await supabase
                .from('events')
                .insert({
                    title: formData.title,
                    description: formData.description,
                    event_date: eventDate.toISOString(),
                    link_url: formData.link_url
                });

            if (error) throw error;

            setIsCreating(false);
            setFormData({ title: '', description: '', date: '', time: '', link_url: '' });
            fetchEvents();
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Erro ao criar evento');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este evento?')) return;
        try {
            const { error } = await supabase.from('events').delete().eq('id', id);
            if (error) throw error;
            fetchEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Eventos</h1>
                    <p className="text-gray-500 dark:text-gray-400">Agende lives e reuniões para seus alunos</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" /> Novo Evento
                </button>
            </div>

            {/* Create Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-zinc-800">
                        <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Novo Evento</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-pink-500 focus:border-pink-500"
                                    placeholder="Ex: Mentoria Semanal"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-pink-500 focus:border-pink-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora</label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.time}
                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-pink-500 focus:border-pink-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link da Reunião</label>
                                <input
                                    type="url"
                                    required
                                    value={formData.link_url}
                                    onChange={e => setFormData({ ...formData, link_url: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-pink-500 focus:border-pink-500"
                                    placeholder="https://zoom.us/..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full rounded-lg border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-pink-500 focus:border-pink-500 h-24 resize-none"
                                    placeholder="Detalhes sobre o evento..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
                                >
                                    Criar Evento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Events List */}
            <div className="grid gap-4">
                {events.length === 0 && !loading ? (
                    <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum evento agendado</h3>
                        <p className="text-gray-500 dark:text-gray-400">Crie o primeiro evento para seus alunos.</p>
                    </div>
                ) : (
                    events.map(event => (
                        <div key={event.id} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 flex items-start justify-between group hover:border-pink-500/30 transition-all">
                            <div className="flex gap-6">
                                <div className="flex flex-col items-center bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg min-w-[80px]">
                                    <span className="text-sm font-semibold text-pink-600 uppercase">
                                        {format(new Date(event.event_date), 'MMM', { locale: ptBR })}
                                    </span>
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {format(new Date(event.event_date), 'dd')}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {format(new Date(event.event_date), 'HH:mm')}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{event.title}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{event.description}</p>
                                    <a
                                        href={event.link_url || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700 font-medium"
                                    >
                                        <LinkIcon className="w-4 h-4" /> Link da Reunião
                                    </a>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <a
                                    href={event.link_url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-400 hover:text-pink-500 transition-colors"
                                    title="Abrir Link"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                </a>
                                <button
                                    onClick={() => handleDelete(event.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Excluir Evento"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
