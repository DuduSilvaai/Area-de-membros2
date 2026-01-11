import React, { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import { CURRENT_USER } from '../constants';
import { Mail, Clock, BookOpen, Edit2, Save, Loader2, Camera } from 'lucide-react';

const Profile: React.FC = () => {
  // Local state to manage form data
  const [formData, setFormData] = useState({
    name: CURRENT_USER.name,
    email: 'alex.miller@example.com',
    phone: '+1 (555) 123-4567',
    about: 'Passionate frontend developer looking to master advanced React patterns and UI design systems. Currently working on a SaaS platform for creative professionals.'
  });

  const [avatar, setAvatar] = useState(CURRENT_USER.avatar);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      // In a real app, you would show a toast notification here
      alert("Changes saved successfully!");
    }, 1500);
  };

  return (
    <div className="min-h-screen transition-colors duration-500">
      <Navbar user={{...CURRENT_USER, name: formData.name, avatar: avatar}} />

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />

      {/* Hero / Cover */}
      <div className="h-64 md:h-80 w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 dark:from-black/60 dark:to-black/80 backdrop-blur-sm"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-[#050505] to-transparent"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-12 relative -mt-24 z-10 pb-20">
        
        {/* Header Card - Glass */}
        <div className="bg-white/70 dark:bg-black/40 backdrop-blur-xl rounded-2xl shadow-xl dark:shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/10 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-end gap-6 mb-8">
            <div className="relative group">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-[#18181b] shadow-lg overflow-hidden bg-gray-200 cursor-pointer" onClick={triggerFileInput}>
                    <img src={avatar} alt="Profile" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                        <Camera className="text-white" size={32} />
                    </div>
                </div>
                <button 
                  onClick={triggerFileInput}
                  className="absolute bottom-2 right-2 p-2 bg-mozart-pink text-white rounded-full hover:bg-mozart-pink-dark transition-colors shadow-lg z-10"
                >
                    <Edit2 size={16} />
                </button>
            </div>
            
            <div className="flex-1 mb-2">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-2">{formData.name}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <span className="flex items-center gap-1.5"><Mail size={16} /> {formData.email}</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Stats & Bio */}
            <div className="space-y-8">
                {/* Stats - Glass */}
                <div className="bg-white/70 dark:bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-white/10 shadow-sm">
                    <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white mb-6">Learning Activity</h3>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Courses Completed</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-mozart-pink/10 text-mozart-pink flex items-center justify-center border border-mozart-pink/20">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">48h</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hours Watched</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bio - Glass */}
                <div className="bg-white/70 dark:bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-white/10 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white">About</h3>
                    </div>
                    <textarea 
                        name="about"
                        value={formData.about}
                        onChange={handleInputChange}
                        rows={6}
                        className="w-full bg-transparent text-gray-600 dark:text-gray-300 leading-relaxed text-sm resize-none focus:outline-none focus:ring-1 focus:ring-mozart-pink/50 rounded-lg p-2 -ml-2 transition-all"
                    />
                </div>
            </div>

            {/* Right Col: Personal Info Form */}
            <div className="lg:col-span-2">
                <div className="bg-white/70 dark:bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-sm">
                    <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100/50 dark:border-white/5">Personal Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Full Name</label>
                            <input 
                                type="text" 
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full bg-white/50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-mozart-pink transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email Address</label>
                            <input 
                                type="email" 
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full bg-white/50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-mozart-pink transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</label>
                            <input 
                                type="tel" 
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full bg-white/50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-mozart-pink transition-colors"
                            />
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-100/50 dark:border-white/5 flex justify-end">
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-8 py-3 bg-mozart-pink text-white rounded-lg font-bold shadow-lg shadow-mozart-pink/20 hover:bg-mozart-pink-dark transition-all transform hover:-translate-y-1 flex items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} /> Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;