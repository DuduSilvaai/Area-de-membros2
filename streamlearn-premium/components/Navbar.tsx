import React, { useState, useEffect, useRef } from 'react';
import { Bell, ChevronDown, LogOut, User as UserIcon, Sun, Moon, Check, X } from 'lucide-react';
import { User } from '../types';
import { Link } from 'react-router-dom';
import { BRAND_LOGO } from '../constants';
import { useTheme } from '../ThemeContext';

interface NavbarProps {
  user: User;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  isUnread: boolean;
  type: 'info' | 'success' | 'alert';
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  // Ref for closing dropdowns when clicking outside
  const navRef = useRef<HTMLDivElement>(null);

  // Mock Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: 'New Lesson Unlocked', message: 'Advanced Hooks module is now available.', time: '2m ago', isUnread: true, type: 'success' },
    { id: 2, title: 'Instructor Reply', message: 'Mike replied to your comment on "Virtual DOM".', time: '1h ago', isUnread: true, type: 'info' },
    { id: 3, title: 'System Maintenance', message: 'Scheduled maintenance tonight at 2 AM.', time: '5h ago', isUnread: false, type: 'alert' },
  ]);

  const unreadCount = notifications.filter(n => n.isUnread).length;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
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

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
  };

  const handleNotificationClick = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsDropdownOpen(false);
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setIsNotificationsOpen(false);
  };

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out px-4 md:px-12 py-4 ${
        isScrolled 
          ? 'bg-white/70 dark:bg-black/40 backdrop-blur-xl shadow-lg border-b border-white/20 dark:border-white/5' 
          : 'bg-transparent'
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link to="/lobby" className="flex items-center gap-3 group cursor-pointer">
          <img 
            src={BRAND_LOGO} 
            alt="Mozart Logo" 
            className={`w-8 h-8 object-contain transition-all duration-300 ${theme === 'dark' ? 'filter brightness-0 invert' : 'filter brightness-0 opacity-80'}`} 
          />
          <span className="text-gray-900 dark:text-white font-serif font-bold text-xl tracking-wide hidden sm:block opacity-90 group-hover:opacity-100 transition-opacity">
            Mozart<span className="font-sans font-light text-mozart-pink">Academy</span>
          </span>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white/20 dark:bg-white/5 backdrop-blur-md transition-all hover:scale-110 active:scale-95 border border-white/10 shadow-sm"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={handleNotificationClick}
              className={`relative text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors focus:outline-none ${isNotificationsOpen ? 'text-mozart-pink dark:text-mozart-pink' : ''}`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-mozart-pink rounded-full animate-pulse shadow-[0_0_8px_#FF0080] border-2 border-white dark:border-[#0a0a0a]"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-white/90 dark:bg-[#121212]/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 ring-1 ring-black/5 origin-top-right">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] font-bold text-mozart-pink hover:text-mozart-pink-dark uppercase tracking-wider flex items-center gap-1 transition-colors"
                    >
                      <Check size={12} /> Mark all read
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
                      <p className="text-sm">No new notifications</p>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 dark:bg-white/[0.02] p-2 text-center border-t border-gray-100 dark:border-white/5">
                   <button className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">View All Activity</button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button 
              onClick={handleProfileClick}
              className="flex items-center gap-3 focus:outline-none group"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className={`w-9 h-9 rounded-full object-cover border-2 transition-all shadow-md ${isDropdownOpen ? 'border-mozart-pink' : 'border-transparent group-hover:border-mozart-pink'}`}
              />
              <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Glass Profile Dropdown */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-4 w-56 bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 overflow-hidden ring-1 ring-black/5 origin-top-right">
                <div className="px-5 py-3 border-b border-gray-100/10 dark:border-white/5 bg-white/10 dark:bg-white/5">
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Student Account</p>
                </div>
                <div className="p-1">
                  <Link 
                    to="/profile" 
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-white/10 rounded-lg transition-colors group/item"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <UserIcon size={16} className="group-hover/item:text-mozart-pink transition-colors" /> Profile
                  </Link>
                  <Link 
                    to="/" 
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-white/10 rounded-lg transition-colors group/item"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <LogOut size={16} className="group-hover/item:text-mozart-pink transition-colors" /> Switch Portal
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;