import React, { useState } from 'react';
import { FileText, MessageSquare, Download, CornerDownRight } from 'lucide-react';
import { Lesson, Comment, Attachment } from '../types';

interface TabSystemProps {
  lesson: Lesson;
  comments: Comment[];
  attachments: Attachment[];
}

type Tab = 'description' | 'materials' | 'comments';

const TabSystem: React.FC<TabSystemProps> = ({ lesson, comments, attachments }) => {
  const [activeTab, setActiveTab] = useState<Tab>('description');

  return (
    <div className="mt-10">
      {/* Tab Headers */}
      <div className="flex items-center border-b border-gray-200 dark:border-white/10 mb-8">
        <button
          onClick={() => setActiveTab('description')}
          className={`pb-4 px-6 text-sm font-medium transition-colors relative ${activeTab === 'description' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Overview
          {activeTab === 'description' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-mozart-pink shadow-[0_0_10px_#FF0080]"></div>}
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`pb-4 px-6 text-sm font-medium transition-colors relative ${activeTab === 'materials' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Materials ({attachments.length})
          {activeTab === 'materials' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-mozart-pink shadow-[0_0_10px_#FF0080]"></div>}
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`pb-4 px-6 text-sm font-medium transition-colors relative ${activeTab === 'comments' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Comments ({comments.length})
          {activeTab === 'comments' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-mozart-pink shadow-[0_0_10px_#FF0080]"></div>}
        </button>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in-up">
        
        {activeTab === 'description' && (
          <div className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
            <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-6">{lesson.title}</h3>
            <p className="mb-6 font-light text-lg">{lesson.description}</p>
            <p className="mb-8 font-light">
              In this lesson, we will cover the core concepts required to understand the module. 
              Please pay attention to the examples provided in the video.
            </p>
            <div className="p-6 bg-gray-50 dark:bg-[#18181b] border border-gray-200 dark:border-white/5 rounded-xl shadow-sm">
                <h4 className="text-xs font-bold text-mozart-pink mb-4 uppercase tracking-widest">Key Takeaways</h4>
                <ul className="list-disc list-inside space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <li>Understanding the basics</li>
                    <li>Implementing the pattern</li>
                    <li>Common pitfalls to avoid</li>
                </ul>
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {attachments.map(att => (
              <div key={att.id} className="flex items-center justify-between p-5 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/5 rounded-xl hover:border-mozart-pink/30 transition-all group cursor-pointer shadow-sm hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-400 group-hover:text-mozart-pink group-hover:bg-mozart-pink/10 transition-colors">
                     <FileText size={24} />
                  </div>
                  <div>
                     <p className="text-gray-900 dark:text-white font-medium text-sm group-hover:text-mozart-pink transition-colors">{att.name}</p>
                     <p className="text-gray-500 dark:text-gray-500 text-xs mt-0.5">{att.size} • {att.type}</p>
                  </div>
                </div>
                <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-mozart-pink transition-colors">
                  <Download size={20} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-8 max-w-3xl">
            {/* Input */}
            <div className="flex gap-5 mb-10">
               <img src="https://picsum.photos/seed/user1/100/100" className="w-12 h-12 rounded-full border border-gray-200 dark:border-white/10" alt="me" />
               <div className="flex-1">
                 <textarea 
                    placeholder="Ask a question or share your thoughts..." 
                    className="w-full bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white focus:outline-none focus:border-mozart-pink transition-colors min-h-[100px] placeholder-gray-400 dark:placeholder-gray-600 font-light"
                 ></textarea>
                 <div className="flex justify-end mt-3">
                    <button className="px-6 py-2.5 bg-mozart-pink hover:bg-mozart-pink-dark text-white rounded-lg text-sm font-semibold transition-all hover:shadow-[0_0_15px_#FF0080]">
                        Post Comment
                    </button>
                 </div>
               </div>
            </div>

            {/* List */}
            {comments.map(comment => (
              <div key={comment.id} className="flex gap-5">
                 <img src={comment.user.avatar} className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10" alt={comment.user.name} />
                 <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-900 dark:text-white font-semibold text-sm">{comment.user.name}</span>
                        {comment.isInstructor && (
                            <span className="bg-mozart-pink/10 text-mozart-pink text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Instructor</span>
                        )}
                        <span className="text-gray-400 dark:text-gray-500 text-xs">• {comment.date}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-light">{comment.text}</p>
                    <button className="flex items-center gap-2 mt-3 text-gray-500 dark:text-gray-500 hover:text-mozart-pink text-xs font-medium transition-colors">
                        <MessageSquare size={14} /> Reply
                    </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TabSystem;