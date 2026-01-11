import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, CheckCircle, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import VideoPlayer from '../components/VideoPlayer';
import LessonSidebar from '../components/LessonSidebar';
import TabSystem from '../components/TabSystem';
import { COURSES, CURRENT_USER, MOCK_COMMENTS, MOCK_ATTACHMENTS } from '../constants';
import { Course, Lesson, Module, LessonStatus } from '../types';

const Player: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [showNextOverlay, setShowNextOverlay] = useState(false);

  useEffect(() => {
    // Simulate Data Fetching
    const foundCourse = COURSES.find(c => c.id === courseId);
    if (foundCourse) {
      setCourse(foundCourse);
      // Flatten lessons to find current
      let foundLesson: Lesson | undefined;
      foundCourse.modules.forEach(m => {
        const l = m.lessons.find(l => l.id === lessonId);
        if (l) foundLesson = l;
      });
      setCurrentLesson(foundLesson || null);
    }
    // Reset overlay when lesson changes
    setShowNextOverlay(false);
  }, [courseId, lessonId]);

  const handleVideoEnded = () => {
    setShowNextOverlay(true);
    // In a real app, this would auto-redirect after 5s
  };

  const toggleLessonCompletion = () => {
    if (!course || !currentLesson) return;

    const isComplete = currentLesson.status === LessonStatus.COMPLETED;
    const newStatus = isComplete ? LessonStatus.IN_PROGRESS : LessonStatus.COMPLETED;

    // Create deep copy of course to trigger re-renders properly and update sidebar
    const updatedCourse = {
        ...course,
        modules: course.modules.map(m => ({
            ...m,
            lessons: m.lessons.map(l => 
                l.id === currentLesson.id ? { ...l, status: newStatus } : l
            )
        }))
    };

    setCourse(updatedCourse);
    setCurrentLesson({ ...currentLesson, status: newStatus });
  };

  if (!course || !currentLesson) {
    return <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center text-gray-900 dark:text-white transition-colors duration-500">Loading Classroom...</div>;
  }

  // Find module title for breadcrumb
  const currentModule = course.modules.find(m => m.lessons.some(l => l.id === lessonId));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col overflow-hidden transition-colors duration-500">
      {/* Navbar - Sticky and Solid in Player */}
      <div className="bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/5 z-50">
        <div className="max-w-[1920px] mx-auto px-4 h-16 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Link to="/lobby" className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full">
                 <ArrowLeft size={20} />
              </Link>
              <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-2 hidden sm:block"></div>
              <div className="flex flex-col">
                 <h1 className="text-sm font-serif font-bold text-gray-900 dark:text-white tracking-wide">{course.title}</h1>
                 <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                    <span>{currentModule?.title}</span>
                    <ChevronRight size={10} />
                    <span className="text-gray-700 dark:text-gray-300">{currentLesson.title}</span>
                 </div>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <button 
                onClick={toggleLessonCompletion}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  currentLesson.status === LessonStatus.COMPLETED
                    ? 'bg-green-500 text-white border border-green-600 shadow-lg shadow-green-500/20 hover:bg-green-600'
                    : 'bg-mozart-pink/10 hover:bg-mozart-pink/20 text-mozart-pink border border-mozart-pink/30 hover:shadow-lg hover:shadow-mozart-pink/10'
                }`}
              >
                  <CheckCircle size={14} className={currentLesson.status === LessonStatus.COMPLETED ? "fill-white/20" : ""} /> 
                  {currentLesson.status === LessonStatus.COMPLETED ? 'Completed' : 'Mark Complete'}
              </button>
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden border border-gray-200 dark:border-white/10">
                 <img src={CURRENT_USER.avatar} alt="User" className="w-full h-full object-cover" />
              </div>
           </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Video & Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="max-w-6xl mx-auto p-6 md:p-10">
            
            {/* Theater Container */}
            <div className="mb-8 relative">
               <VideoPlayer 
                 key={currentLesson.id}
                 poster={course.thumbnail} 
                 onEnded={handleVideoEnded}
               />
               
               {/* Next Lesson Overlay */}
               {showNextOverlay && (
                 <div className="absolute bottom-8 right-8 bg-white dark:bg-[#18181b] border border-mozart-pink/30 p-5 rounded-xl shadow-2xl animate-in slide-in-from-right fade-in flex items-center gap-5 z-20">
                    <div className="flex flex-col">
                       <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-1">Up Next</span>
                       <span className="text-gray-900 dark:text-white font-serif font-bold text-lg">Next Lesson</span>
                       <span className="text-xs text-mozart-pink font-medium mt-1">Starting in 5s...</span>
                    </div>
                    <button className="w-12 h-12 rounded-full bg-mozart-pink flex items-center justify-center hover:scale-110 transition-transform text-white shadow-lg">
                        <ChevronRight size={28} />
                    </button>
                 </div>
               )}
            </div>

            <div className="flex items-start justify-between mb-2">
               <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-white">{currentLesson.title}</h1>
            </div>
            
            <TabSystem 
              lesson={currentLesson} 
              comments={MOCK_COMMENTS} 
              attachments={MOCK_ATTACHMENTS} 
            />
          </div>
        </div>

        {/* Right Column: Sidebar (Fixed width) */}
        {/* Changed from xl:block to lg:block to ensure sidebar is visible on more laptop screens */}
        <div className="w-[380px] hidden lg:block h-full border-l border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#121212]">
           <LessonSidebar 
             key={course.id} // Forces reset when course changes
             course={course} 
             currentLessonId={lessonId!} 
           />
        </div>

      </div>
    </div>
  );
};

export default Player;