import React, { useState } from 'react';
import { ChevronDown, CheckCircle2, Play, Lock, Clock, AlertCircle } from 'lucide-react';
import { Course, Module, Lesson, LessonStatus } from '../types';
import { useNavigate } from 'react-router-dom';

interface LessonSidebarProps {
  course: Course;
  currentLessonId: string;
}

const LessonSidebar: React.FC<LessonSidebarProps> = ({ course, currentLessonId }) => {
  const navigate = useNavigate();
  // Initialize with all modules open for now
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(
    course.modules.reduce((acc, mod) => ({ ...acc, [mod.id]: true }), {})
  );

  // State to track which locked lesson was clicked to show feedback
  const [lockedWarningId, setLockedWarningId] = useState<string | null>(null);

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleLessonSelect = (lesson: Lesson) => {
      if (lesson.status === LessonStatus.LOCKED) {
          setLockedWarningId(lesson.id);
          // Clear warning after 3 seconds
          setTimeout(() => setLockedWarningId(null), 3000);
          return;
      }
      navigate(`/course/${course.id}/lesson/${lesson.id}`);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#121212] border-l border-gray-200 dark:border-white/5 transition-colors duration-500">
      <div className="p-6 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#18181b]">
        <h3 className="text-gray-900 dark:text-white font-serif font-bold text-lg tracking-tight">Course Content</h3>
        <div className="w-full bg-gray-200 dark:bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
             <div className="bg-mozart-pink h-full w-[45%] shadow-[0_0_10px_#FF0080]"></div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">45% Completed</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {course.modules.map((module) => (
          <div key={module.id} className="border-b border-gray-100 dark:border-white/5">
            <button 
              onClick={() => toggleModule(module.id)}
              className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors text-left group"
            >
              <span className="font-medium text-gray-800 dark:text-gray-200 text-sm line-clamp-1 group-hover:text-mozart-pink transition-colors">{module.title}</span>
              <ChevronDown 
                size={16} 
                className={`text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-transform duration-200 ${openModules[module.id] ? 'rotate-180' : ''}`} 
              />
            </button>

            {openModules[module.id] && (
              <div className="bg-white dark:bg-black/20 py-2">
                {module.lessons.map((lesson) => {
                  const isActive = lesson.id === currentLessonId;
                  const isLocked = lesson.status === LessonStatus.LOCKED;
                  const isCompleted = lesson.status === LessonStatus.COMPLETED;
                  const showWarning = lockedWarningId === lesson.id;

                  return (
                    <div 
                      key={lesson.id}
                      onClick={() => handleLessonSelect(lesson)}
                      className={`
                        relative flex flex-col border-l-[3px] transition-all duration-300
                        ${isActive 
                           ? 'bg-mozart-pink/5 border-mozart-pink' 
                           : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]'}
                        ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
                        ${isLocked && !showWarning ? 'opacity-60' : 'opacity-100'}
                      `}
                    >
                      <div className="flex items-start gap-3 p-3 pl-6 w-full">
                          <div className="mt-0.5 min-w-[16px]">
                            {isActive ? (
                              <Play size={16} className="text-mozart-pink animate-pulse" fill="currentColor" />
                            ) : isCompleted ? (
                              <CheckCircle2 size={16} className="text-mozart-pink" />
                            ) : isLocked ? (
                              <Lock size={16} className={`text-gray-400 ${showWarning ? 'text-red-500 animate-bounce' : ''}`} />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 group-hover:border-mozart-pink transition-colors"></div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <p className={`text-sm font-medium leading-snug ${isActive ? 'text-mozart-pink' : 'text-gray-700 dark:text-gray-400'} ${isLocked && !isActive ? 'text-gray-500 dark:text-gray-600' : ''}`}>
                                {lesson.title}
                            </p>
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400 dark:text-gray-600 font-medium">
                              <Clock size={11} />
                              <span>{lesson.duration}</span>
                            </div>
                          </div>
                      </div>

                      {/* Locked Feedback Message */}
                      {showWarning && (
                        <div className="mx-6 mb-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-md animate-in fade-in slide-in-from-top-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400">
                                <AlertCircle size={12} />
                                <span>Lesson locked</span>
                            </div>
                            <p className="text-[10px] text-red-500/80 dark:text-red-400/70 mt-0.5 pl-5">
                                Complete previous lessons to unlock.
                            </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LessonSidebar;