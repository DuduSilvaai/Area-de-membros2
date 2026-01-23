import { Suspense } from 'react';
import { createAdminClient } from '@/lib/supabase/server';
import { AdminChatClient } from './AdminChatClient';
import { ConversationWithStudent } from '@/types/chat';
import { Loader2 } from 'lucide-react';

async function ChatContent() {
    const adminSupabase = await createAdminClient();

    // 1. Fetch conversations
    const { data: conversations, error } = await adminSupabase
        .from('conversations')
        .select('*')
        .order('unread_count_admin', { ascending: false })
        .order('last_message_at', { ascending: false });

    if (error) {
        console.error('Error fetching conversations:', error);
        return <AdminChatClient initialConversations={[]} />;
    }

    // 2. Fetch profiles for these students manually (since FK join is unreliable)
    const studentIds = (conversations || []).map(c => c.student_id);

    // Fetch profiles
    const { data: profiles, error: profilesError } = await adminSupabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .in('id', studentIds);

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
    }

    // 3. Merge data
    const transformedConversations: ConversationWithStudent[] = (conversations || []).map(conv => {
        const studentProfile = profiles?.find(p => p.id === conv.student_id);
        return {
            ...conv,
            student: studentProfile || {
                id: conv.student_id,
                full_name: 'Desconhecido', // Fallback
                avatar_url: null,
                email: null
            }
        };
    });

    return <AdminChatClient initialConversations={transformedConversations} />;
}

export default function AdminChatPage() {
    return (
        <div className="h-[calc(100vh-6rem)]">
            <Suspense
                fallback={
                    <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
                            <p className="text-gray-500 animate-pulse">Carregando conversas...</p>
                        </div>
                    </div>
                }
            >
                <ChatContent />
            </Suspense>
        </div>
    );
}
