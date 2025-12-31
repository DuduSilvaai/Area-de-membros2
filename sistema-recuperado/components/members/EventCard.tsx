'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Calendar, Clock, Video } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Event {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    link_url: string | null;
}

export default function EventCard() {
    const [nextEvent, setNextEvent] = useState<Event | null>(null);
    const [countdown, setCountdown] = useState('');

    useEffect(() => {
        const fetchNextEvent = async () => {
            const now = new Date().toISOString();
            const { data } = await supabase
                .from('events')
                .select('*')
                .gte('event_date', now)
                .order('event_date', { ascending: true })
                .limit(1)
                .single();

            if (data) setNextEvent(data);
        };

        fetchNextEvent();
    }, []);

    useEffect(() => {
        if (!nextEvent) return;

        const updateCountdown = () => {
            const now = new Date();
            const eventDate = new Date(nextEvent.event_date);
            const diff = eventDate.getTime() - now.getTime();

            if (diff <= 0) {
                setCountdown('Ao vivo agora!');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
                setCountdown(`Em ${days}d ${hours}h`);
            } else {
                setCountdown(`Em ${hours}h ${minutes}m`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [nextEvent]);

    if (!nextEvent) return null;

    return (
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8 relative overflow-hidden group">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-pink-500/10 transition-colors" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="bg-pink-500/10 p-3 rounded-xl border border-pink-500/20 text-pink-500">
                        <Calendar className="w-8 h-8" />
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Próxima Live
                            </span>
                            <span className="text-zinc-400 text-sm flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {countdown}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-pink-400 transition-colors">
                            {nextEvent.title}
                        </h3>
                        <p className="text-zinc-400 text-sm max-w-lg">
                            {format(new Date(nextEvent.event_date), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            {nextEvent.description && ` - ${nextEvent.description}`}
                        </p>
                    </div>
                </div>

                <a
                    href={nextEvent.link_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full md:w-auto bg-white hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all transform group-hover:scale-105 shadow-xl shadow-pink-500/5"
                >
                    <Video className="w-5 h-5 text-pink-600" />
                    Participar da Live
                </a>
            </div>
        </div>
    );
}
