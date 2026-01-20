'use client';

import { useState, useEffect } from 'react';
import { getMeetings, Meeting } from '@/app/actions/meetings';
import { Calendar, Link as LinkIcon, FileText, Plus, Edit2, Loader2, Video } from 'lucide-react';
import { MeetingForm } from './MeetingForm';

interface MeetingsListProps {
    studentId: string;
    isAdmin?: boolean; // If true, shows Edit buttons
}

export function MeetingsList({ studentId, isAdmin = false }: MeetingsListProps) {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

    const fetchMeetingsData = async () => {
        setIsLoading(true);
        try {
            const data = await getMeetings(studentId);
            setMeetings(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (studentId) {
            fetchMeetingsData();
        }
    }, [studentId]);

    const handleEdit = (meeting: Meeting) => {
        setEditingMeeting(meeting);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingMeeting(null);
    };

    return (
        <div className="flex-1 h-full bg-[#F8F9FB] dark:bg-[#0F0F12] flex flex-col">
            {/* Header / Actions */}
            <div className="px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Histórico de Reuniões
                </h3>
                {isAdmin && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 rounded-lg transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        Registrar Reunião
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Loader2 size={32} className="animate-spin mb-2" />
                        <p className="text-sm">Carregando reuniões...</p>
                    </div>
                ) : meetings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-zinc-600">
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                            <Calendar size={32} />
                        </div>
                        <p>Nenhuma reunião registrada.</p>
                    </div>
                ) : (
                    meetings.map((meeting) => (
                        <div
                            key={meeting.id}
                            className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group relative"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                                        {meeting.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
                                        <Calendar size={12} />
                                        <span>
                                            {new Date(meeting.created_at).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    {meeting.description && (
                                        <p className="text-sm text-gray-600 dark:text-zinc-300 mt-2 leading-relaxed">
                                            {meeting.description}
                                        </p>
                                    )}
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => handleEdit(meeting)}
                                        className="text-gray-400 hover:text-pink-500 transition-colors p-1"
                                        title="Editar reunião"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Link/Action */}
                            {meeting.link && (
                                <div className="mt-4 pt-3 border-t border-gray-50 dark:border-zinc-800/50">
                                    <a
                                        href={meeting.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium transition-colors"
                                    >
                                        <Video size={16} />
                                        Acessar Gravação / Arquivo
                                    </a>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showForm && (
                <MeetingForm
                    studentId={studentId}
                    meeting={editingMeeting}
                    onClose={handleCloseForm}
                    onSuccess={fetchMeetingsData}
                />
            )}
        </div>
    );
}
