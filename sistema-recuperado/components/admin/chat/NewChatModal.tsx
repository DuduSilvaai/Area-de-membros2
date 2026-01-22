'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getUsersForChat, getOrCreateConversation, ChatUser } from '@/app/(admin)/chat/actions';
import { ConversationWithStudent } from '@/types/chat';
import { Loader2, Plus, Search, User as UserIcon, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';

interface NewChatModalProps {
    onConversationCreated: (conversation: ConversationWithStudent) => void;
}

export function NewChatModal({ onConversationCreated }: NewChatModalProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState<string | null>(null); // userId being created

    // Fetch users (debounced ideally, but simple effect for now)
    useEffect(() => {
        if (!open) return;

        const fetchUsers = async () => {
            setLoading(true);
            const { data, error } = await getUsersForChat(search);
            if (error) {
                toast.error('Erro ao buscar usuários');
            } else {
                setUsers(data || []);
            }
            setLoading(false);
        };

        const timer = setTimeout(fetchUsers, 300);
        return () => clearTimeout(timer);
    }, [search, open]);

    const handleSelectUser = async (user: ChatUser) => {
        setCreating(user.id);
        try {
            const { data, error } = await getOrCreateConversation(user.id);
            if (error || !data) {
                toast.error('Erro ao criar conversa');
            } else {
                onConversationCreated(data as ConversationWithStudent);
                setOpen(false);
                toast.success(`Conversa iniciada com ${user.full_name}`);
            }
        } catch (error) {
            toast.error('Erro inesperado');
        } finally {
            setCreating(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 bg-pink-50 text-pink-600 hover:bg-pink-100 hover:text-pink-700 dark:bg-pink-500/10 dark:text-pink-500 dark:hover:bg-pink-500/20 rounded-xl transition-all"
                    title="Nova Conversa"
                >
                    <Plus className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-[#121216] border-gray-100 dark:border-zinc-800 p-0 overflow-hidden gap-0">
                <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <div className="p-2 bg-pink-100 dark:bg-pink-500/20 rounded-lg">
                                <MessageSquarePlus className="w-5 h-5 text-pink-600 dark:text-pink-500" />
                            </div>
                            Nova Mensagem
                        </DialogTitle>
                    </DialogHeader>

                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar franqueado..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700"
                        />
                    </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin mb-2" />
                            <span className="text-sm">Buscando franqueados...</span>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p className="text-sm">Nenhum usuário encontrado</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {users.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleSelectUser(user)}
                                    disabled={creating !== null}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-left disabled:opacity-50"
                                >
                                    {user.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.full_name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                                            <UserIcon className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white truncate">
                                            {user.full_name}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                    {creating === user.id && (
                                        <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
