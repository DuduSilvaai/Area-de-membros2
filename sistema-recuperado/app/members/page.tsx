'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AuroraBackground from '@/components/members/AuroraBackground';
import HeroBanner from '@/components/members/HeroBanner';
import CourseCard from '@/components/members/CourseCard';
import StudentNavbar from '@/components/members/StudentNavbar';
import { MessageCircle, X, Send, Paperclip, Image as ImageIcon, FileText, Lock } from 'lucide-react';

interface Portal {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  progress: number;
  last_accessed?: string;
  total_lessons?: number;
  author?: string;
}

interface ChatMessage {
  sender: 'user' | 'agent';
  text: string;
  attachment?: {
    name: string;
    url: string;
    type: 'image' | 'file';
  };
}

export default function MemberDashboard() {
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCourse, setLastCourse] = useState<Portal | null>(null);
  const { user } = useAuth();

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'agent', text: 'Olá! Como podemos ajudar na sua jornada de aprendizado hoje?' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadPortals = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select(`
            portal_id,
            permissions,
            portals!inner (
              id,
              name,
              description,
              image_url,
              created_at
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (enrollmentError) throw enrollmentError;

        if (!enrollmentData || enrollmentData.length === 0) {
          setPortals([]);
          setLastCourse(null);
          setLoading(false);
          return;
        }

        const portalIds = enrollmentData.map((e: any) => e.portal_id);

        const { data: modulesData } = await supabase
          .from('modules')
          .select(`
            id,
            portal_id,
            contents (id)
          `)
          .in('portal_id', portalIds)
          .eq('is_active', true);

        const { data: progressData } = await supabase
          .from('progress')
          .select('content_id')
          .eq('user_id', user.id)
          .eq('is_completed', true);

        const completedContentIds = new Set((progressData || []).map(p => p.content_id));

        const portalStats = new Map<string, { total: number; completed: number }>();

        (modulesData || []).forEach((mod: any) => {
          const pid = mod.portal_id;
          if (!portalStats.has(pid)) portalStats.set(pid, { total: 0, completed: 0 });

          const stats = portalStats.get(pid)!;
          const contentCount = mod.contents?.length || 0;
          stats.total += contentCount;

          (mod.contents || []).forEach((c: any) => {
            if (completedContentIds.has(c.id)) stats.completed++;
          });
        });

        const formattedPortals = enrollmentData.map((enrollment: any) => {
          const portal = enrollment.portals as any;
          const stats = portalStats.get(portal.id) || { total: 0, completed: 0 };
          const progress = stats.total > 0
            ? Math.round((stats.completed / stats.total) * 100)
            : 0;

          return {
            id: portal.id,
            name: portal.name,
            description: portal.description,
            image_url: portal.image_url,
            progress,
            total_lessons: stats.total,
            created_at: portal.created_at
          };
        });

        setPortals(formattedPortals);

        const inProgress = formattedPortals.find(p => p.progress > 0 && p.progress < 100);
        setLastCourse(inProgress || formattedPortals[0] || null);

      } catch (error) {
        console.error('Erro ao buscar portais:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadPortals();
  }, [user]);

  // Auto-scroll chat
  useEffect(() => {
    if (isChatOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() && !selectedFile) return;

    const newMessage: ChatMessage = { sender: 'user', text: chatMessage };

    if (selectedFile) {
      newMessage.attachment = {
        name: selectedFile.name,
        url: URL.createObjectURL(selectedFile),
        type: selectedFile.type.startsWith('image/') ? 'image' : 'file'
      };
    }

    setMessages(prev => [...prev, newMessage]);
    setChatMessage("");
    clearFile();

    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'agent',
        text: "Obrigado! Um instrutor irá revisar e responder em breve."
      }]);
    }, 1500);
  };

  const userName = user?.email?.split('@')[0] || 'Aluno';

  if (loading) {
    return (
      <div className="min-h-screen transition-colors duration-500">
        <AuroraBackground />
        <div className="h-[60vh] bg-gray-200 dark:bg-[#18181b]/50 animate-pulse"></div>
        <div className="p-12 space-y-8">
          <div className="h-8 w-48 bg-gray-200 dark:bg-[#18181b]/50 rounded animate-pulse"></div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-[350px] aspect-video bg-gray-200 dark:bg-[#18181b]/50 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 transition-colors duration-500">
      <AuroraBackground />
      <StudentNavbar />

      <HeroBanner
        userFirstName={userName}
        featuredCourse={lastCourse ? {
          id: lastCourse.id,
          title: lastCourse.name,
          thumbnail: lastCourse.image_url || '',
          progress: lastCourse.progress
        } : null}
      />

      <main className="max-w-[1600px] mx-auto px-4 md:px-12 -mt-16 relative z-20">

        {/* Section: My Courses */}
        <section className="mb-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white flex items-center gap-2 drop-shadow-md">
                Meus Cursos
              </h2>
              <p className="text-gray-500 dark:text-gray-300 text-sm mt-2 font-light">Continue de onde parou.</p>
            </div>
          </div>

          {portals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-white/40 dark:bg-black/40 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5">
              <div className="bg-white/20 dark:bg-white/5 p-6 rounded-full mb-6">
                <Lock className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">Sem cursos disponíveis</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Você ainda não possui matrículas ativas. Entre em contato com seu administrador para liberar seu acesso.
              </p>
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-10 scrollbar-hide snap-x pt-2">
              {portals.map(portal => (
                <CourseCard
                  key={portal.id}
                  course={{
                    id: portal.id,
                    title: portal.name,
                    thumbnail: portal.image_url,
                    progress: portal.progress,
                    total_lessons: portal.total_lessons
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Section: Recommended (if we have more than one course) */}
        {portals.length > 1 && (
          <section className="mb-12">
            <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-8 border-l-4 border-mozart-pink pl-4 drop-shadow-md">Recomendados Para Você</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {portals.slice(0, 2).map((portal, idx) => (
                <Link key={`${portal.id}-rec-${idx}`} href={`/members/${portal.id}`} className="group cursor-pointer">
                  <div className="aspect-[2/1] bg-white/40 dark:bg-black/40 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 dark:border-white/5 relative shadow-lg group-hover:shadow-[0_0_30px_rgba(255,0,128,0.15)] transition-all duration-500">
                    <img src={portal.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800'} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-90"></div>
                    <div className="absolute bottom-6 left-6">
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest mb-2 block bg-mozart-pink inline-block px-2 py-1 rounded shadow-lg">Em Destaque</span>
                      <h3 className="text-xl font-bold text-white font-serif">{portal.name}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Floating Chat Widget */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">

        {/* Chat Window - Glassmorphism */}
        {isChatOpen && (
          <div className="w-[350px] h-[550px] bg-white/80 dark:bg-black/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 flex flex-col mb-4 overflow-hidden animate-fade-in-up origin-bottom-right ring-1 ring-black/5">
            {/* Header */}
            <div className="bg-white/50 dark:bg-white/5 p-4 flex items-center justify-between border-b border-gray-200/50 dark:border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-mozart-pink flex items-center justify-center text-white font-bold text-xs shadow-lg">AI</div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#18181b]"></div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Suporte</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-300">Geralmente responde em minutos</p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-transparent scrollbar-hide">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm backdrop-blur-sm border ${msg.sender === 'user'
                      ? 'bg-mozart-pink/90 border-mozart-pink text-white rounded-br-none shadow-lg'
                      : 'bg-white/60 dark:bg-white/10 border-white/20 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'
                    }`}>
                    {msg.attachment && (
                      <div className="mb-2 rounded-lg overflow-hidden bg-black/10 dark:bg-black/20">
                        {msg.attachment.type === 'image' ? (
                          <img src={msg.attachment.url} alt="Attachment" className="max-w-full h-auto object-cover max-h-[150px] w-full" />
                        ) : (
                          <div className="flex items-center gap-2 p-3">
                            <FileText size={20} className="shrink-0" />
                            <span className="truncate text-xs underline">{msg.attachment.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white/50 dark:bg-white/5 border-t border-gray-200/50 dark:border-white/10 backdrop-blur-sm">
              {selectedFile && (
                <div className="mb-2 mx-1 p-2 bg-gray-100 dark:bg-white/10 rounded-lg flex items-center justify-between animate-fade-in-up">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {selectedFile.type.startsWith('image/') ? <ImageIcon size={14} className="text-mozart-pink" /> : <FileText size={14} className="text-mozart-pink" />}
                    <span className="text-xs text-gray-700 dark:text-gray-200 truncate max-w-[180px]">{selectedFile.name}</span>
                  </div>
                  <button type="button" onClick={clearFile} className="text-gray-500 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="relative flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="relative flex-1">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder={selectedFile ? "Adicione uma legenda..." : "Digite sua mensagem..."}
                    className="w-full bg-white/50 dark:bg-black/30 text-gray-900 dark:text-white rounded-full pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-mozart-pink transition-all placeholder-gray-500 border border-transparent focus:border-mozart-pink/50"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-mozart-pink transition-colors p-1"
                    title="Anexar arquivo"
                  >
                    <Paperclip size={18} />
                  </button>

                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-mozart-pink text-white rounded-full flex items-center justify-center hover:bg-mozart-pink-dark transition-colors disabled:opacity-50 shadow-md disabled:cursor-not-allowed"
                    disabled={!chatMessage.trim() && !selectedFile}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(255,0,128,0.4)] transition-all hover:scale-110 z-50 ${isChatOpen ? 'bg-gray-800 dark:bg-white text-white dark:text-black' : 'bg-mozart-pink text-white border border-white/20'}`}
        >
          {isChatOpen ? <X size={24} /> : <MessageCircle size={26} />}
        </button>
      </div>
    </div>
  );
}
