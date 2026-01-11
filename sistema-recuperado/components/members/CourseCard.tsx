'use client';

import React from 'react';
import Link from 'next/link';
import { PlayCircle } from 'lucide-react';

interface CourseCardProps {
    course: {
        id: string;
        title: string;
        thumbnail: string | null;
        progress: number;
        author?: string;
        total_lessons?: number;
    };
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
    return (
        <Link
            href={`/members/${course.id}`}
            className="group relative flex-shrink-0 w-full sm:w-[300px] md:w-[350px] cursor-pointer"
        >
            <div className="relative aspect-video rounded-xl overflow-hidden bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/5 transition-all duration-500 group-hover:scale-105 group-hover:border-mozart-pink/30 group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] shadow-sm z-0 group-hover:z-10">

                {/* Image */}
                {course.thumbnail ? (
                    <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <PlayCircle className="w-12 h-12 text-white/20" />
                    </div>
                )}

                {/* Play Overlay on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gray-900/20 dark:bg-black/40 backdrop-blur-[2px]">
                    <div className="w-14 h-14 rounded-full bg-mozart-pink/90 backdrop-blur-sm flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 border border-white/20">
                        <PlayCircle className="text-white" size={32} fill="white" stroke="none" />
                    </div>
                </div>

                {/* Progress Bar (Always visible) */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
                    <div
                        className="h-full bg-mozart-pink shadow-[0_0_10px_#FF0080]"
                        style={{ width: `${course.progress}%` }}
                    ></div>
                </div>
            </div>

            <div className="mt-4 px-1">
                <h3 className="text-gray-900 dark:text-white font-serif font-bold text-lg truncate group-hover:text-mozart-pink transition-colors drop-shadow-sm">
                    {course.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-white/50 dark:bg-white/10 backdrop-blur px-2 py-0.5 rounded border border-white/10">
                        {course.progress}% Concluído
                    </span>
                    {course.author && (
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-light">• {course.author}</p>
                    )}
                    {course.total_lessons && (
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-light">• {course.total_lessons} aulas</p>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default CourseCard;
