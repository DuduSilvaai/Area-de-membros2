'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut, User as UserIcon, Sun, Moon, Check, X, Home } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { MemberNotification } from '@/types/members';

import { supabase } from '@/lib/supabaseClient';

const StudentNavbar: React.FC = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navRef = useRef<HTMLDivElement>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<MemberNotification[]>([]);

  // Calculate Relative Time Helper
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s atrás`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  };

  // Fetch Notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        // 1. Fetch all system notifications
        const { data: allNotifs, error: notifError } = await supabase
          .from('notifications' as any)
          .select('*')
          .order('created_at', { ascending: false });

        if (notifError) throw notifError;

        // 2. Fetch read receipts for this user
        const { data: readReceipts, error: readError } = await supabase
          .from('notification_reads' as any)
          .select('notification_id')
          .eq('user_id', user.id);

        if (readError) throw readError;

        const readIds = new Set((readReceipts as any[])?.map((nr: any) => nr.notification_id) || []);

        // 3. Merge data
        const formattedNotifications: MemberNotification[] = ((allNotifs as any[]) || []).map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: getRelativeTime(n.created_at),
          isUnread: !readIds.has(n.id),
          type: n.type as 'success' | 'info' | 'alert'
        }));

        setNotifications(formattedNotifications);

      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();

    // Optional: Realtime subscription could go here

  }, [user]);

  const unreadCount = notifications.filter(n => n.isUnread).length;

  // Load read status from localStorage


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAllAsRead = async () => {
    if (!user) return;

    // Optimistic UI update
    const updatedNotifications = notifications.map(n => ({ ...n, isUnread: false }));
    setNotifications(updatedNotifications);

    // Filter notifications that were actually unread to minimize DB calls (optional optimization)
    // but upserting all visible IDs is safer to ensure consistency
    const unreadNotificationIds = notifications.filter(n => n.isUnread).map(n => n.id);

    if (unreadNotificationIds.length === 0) return;

    try {
      const updates = unreadNotificationIds.map(notifId => ({
        user_id: user.id,
        notification_id: notifId,
        read_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('notification_reads' as any)
        .upsert(updates, { onConflict: 'user_id,notification_id' });

      if (error) throw error;

    } catch (error) {
      console.error('Error marking notifications as read:', error);
      // Revert optimistic update if necessary? For now, we assume success or simple console error.
    }
  };

  const handleNotificationClick = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsDropdownOpen(false);
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setIsNotificationsOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const userName = user?.email?.split('@')[0] || 'Aluno';
  const userAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${userName}`;

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out px-4 md:px-12 py-2 ${isScrolled
        ? 'bg-[#121212]/80 backdrop-blur-xl shadow-lg border-b border-white/5'
        : 'bg-transparent'
        }`}
    >
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/members" className="flex items-center gap-3 group cursor-pointer">
          <img
            src="/assets/logopink.png"
            alt="Mozart Logo"
            className="h-60 w-auto object-contain transition-all duration-300 -mt-20"
          />
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-6">

          {/* Home Link */}
          <Link
            href="/members"
            className="group p-2.5 rounded-full text-gray-300 hover:text-white hover:bg-[#FF0080] bg-white/5 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 border border-white/10 shadow-sm hover:shadow-[0_0_15px_rgba(255,0,128,0.4)] hover:border-[#FF0080]"
          >
            <Home size={20} className="group-hover:text-white transition-colors" />
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="group p-2.5 rounded-full text-gray-300 hover:text-white hover:bg-[#FF0080] bg-white/5 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 border border-white/10 shadow-sm hover:shadow-[0_0_15px_rgba(255,0,128,0.4)] hover:border-[#FF0080]"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun size={20} className="group-hover:text-white transition-colors" />
            ) : (
              <Moon size={20} className="group-hover:text-white transition-colors" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={handleNotificationClick}
              className={`relative group p-2.5 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 border shadow-sm
                ${isNotificationsOpen
                  ? 'bg-[#FF0080] text-white border-[#FF0080] shadow-[0_0_15px_rgba(255,0,128,0.4)]'
                  : 'bg-white/5 text-gray-300 hover:bg-[#FF0080] hover:text-white hover:border-[#FF0080] hover:shadow-[0_0_15px_rgba(255,0,128,0.4)] border-white/10'
                }
              `}
            >
              <Bell size={20} className={`${isNotificationsOpen ? 'text-white' : 'group-hover:text-white'} transition-colors`} />
              {unreadCount > 0 && !isNotificationsOpen && (
                <span className="absolute top-2 right-2.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF0080] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF0080] border-2 border-white dark:border-[#0F0F12]"></span>
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-white/90 dark:bg-[#121212]/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 ring-1 ring-black/5 origin-top-right">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notificações</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] font-bold text-mozart-pink hover:text-mozart-pink-dark uppercase tracking-wider flex items-center gap-1 transition-colors"
                    >
                      <Check size={12} /> Marcar como lidas
                    </button>
                  )}
                </div>

                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-5 py-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group ${notification.isUnread ? 'bg-mozart-pink/[0.03]' : ''}`}
                      >
                        <div className="flex gap-3 items-start">
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notification.isUnread ? 'bg-mozart-pink shadow-[0_0_5px_#FF0080]' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
                          <div className="flex-1">
                            <p className={`text-sm mb-1 ${notification.isUnread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-1.5">
                              {notification.message}
                            </p>
                            <span className="text-[10px] text-gray-400 dark:text-gray-600 font-medium">
                              {notification.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <p className="text-sm">Sem notificações novas</p>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 dark:bg-white/[0.02] p-2 text-center border-t border-gray-100 dark:border-white/5">
                  <button className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Ver todas</button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative pl-4 border-l border-gray-200 dark:border-white/10">
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-3 focus:outline-none group p-1 pl-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <div className={`relative w-10 h-10 rounded-full p-[2px] border-2 transition-all duration-300 ${isDropdownOpen ? 'border-[#FF0080] shadow-[0_0_10px_#FF0080]' : 'border-transparent group-hover:border-gray-400 dark:group-hover:border-white/30'}`}>
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <ChevronDown size={16} className={`text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white transition-all duration-300 ${isDropdownOpen ? 'rotate-180 text-[#FF0080]' : ''}`} />
            </button>

            {/* Profile Dropdown */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-4 w-56 bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 overflow-hidden ring-1 ring-black/5 origin-top-right">
                <div className="px-5 py-3 border-b border-gray-100/10 dark:border-white/5 bg-white/10 dark:bg-white/5">
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{userName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Conta de Aluno</p>
                </div>
                <div className="p-1">
                  <Link
                    href="/members/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-white/10 rounded-lg transition-colors group/item"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <UserIcon size={16} className="group-hover/item:text-mozart-pink transition-colors" /> Perfil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-white/10 rounded-lg transition-colors group/item"
                  >
                    <LogOut size={16} className="group-hover/item:text-mozart-pink transition-colors" /> Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default StudentNavbar;
