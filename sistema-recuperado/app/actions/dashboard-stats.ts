'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function getDashboardStats() {
  const supabase = await createClient();

  try {
    // Run independent counts in parallel for performance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ADMIN_EMAIL = 'loveforsweet.franchising@gmail.com';

    const [
      studentsResult,
      lessonsResult,
      accessesResult,
      commentsResult,
      latestCommentsResult,
      activeLogsResult
    ] = await Promise.all([
      // 1. Total Students (Franchisees) - Count Profiles excluding Admin
      supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('email', ADMIN_EMAIL),
      // 2. Total Lessons
      supabase.from('contents').select('*', { count: 'estimated', head: true }),
      // 3. Accesses Today - Keep exact for today as it's a smaller range usually, or estimated if huge
      supabase.from('access_logs').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
      // 4. Comments Today
      supabase.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
      // 5. Latest Comments
      supabase
        .from('comments')
        .select('id, text, created_at, user_id, content_id, contents(title)')
        .order('created_at', { ascending: false })
        .limit(5),
      // 6. Active Logs Sample (Limit to prevent timeout - DB should handle aggregation in future optimization)
      supabase
        .from('access_logs')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .limit(1000) // Optimization: Limit to latest 1000 interactions to avoid fetching millions of rows
    ]);

    // Process Basic Counts
    const totalStudents = studentsResult.count || 0;
    const totalLessons = lessonsResult.count || 0;
    const accessesToday = accessesResult.count || 0;
    const commentsToday = commentsResult.count || 0;

    // Process Latest Comments
    let latestCommentsWithProfiles: any[] = [];
    const latestCommentsData = latestCommentsResult.data;

    if (latestCommentsData && latestCommentsData.length > 0) {
      const commentUserIds = Array.from(new Set(latestCommentsData.map(c => c.user_id).filter(Boolean)));
      const { data: commentProfiles } = await supabase.from('profiles').select('id, full_name, email').in('id', commentUserIds);

      latestCommentsWithProfiles = latestCommentsData.map(comment => {
        const profile = commentProfiles?.find(p => p.id === comment.user_id);
        return {
          id: comment.id,
          text: comment.text,
          created_at: comment.created_at,
          user_name: profile?.full_name || profile?.email || 'Usuário',
          user_avatar: null,
          lesson_title: (comment.contents as any)?.title || 'Aula desconhecida'
        };
      });
    }

    // Process Top Students from Sample
    let topStudents: any[] = [];
    const activeLogs = activeLogsResult.data;

    if (activeLogs && activeLogs.length > 0) {
      const studentCounts: Record<string, number> = {};
      activeLogs.forEach(log => {
        if (log.user_id) studentCounts[log.user_id] = (studentCounts[log.user_id] || 0) + 1;
      });

      const topUserIds = Object.keys(studentCounts)
        .sort((a, b) => studentCounts[b] - studentCounts[a])
        .slice(0, 10); // Fetch more initially to allow filtering

      if (topUserIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', topUserIds);

        topStudents = topUserIds
          .map(id => {
            const profile = profiles?.find(p => p.id === id);
            return {
              id,
              name: profile?.full_name || 'Usuário',
              email: profile?.email || '',
              access_count: studentCounts[id]
            };
          })
          .filter(s => s.email && s.email !== ADMIN_EMAIL) // Filter out Admin
          .slice(0, 5); // Take top 5 after filtering
      }
    }

    return {
      totalStudents,
      totalLessons,
      accessesToday,
      commentsToday,
      latestComments: latestCommentsWithProfiles,
      topStudents,
      recentActivity: []
    };

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return {
      totalStudents: 0,
      totalLessons: 0,
      accessesToday: 0,
      commentsToday: 0,
      latestComments: [],
      topStudents: [],
      recentActivity: []
    };
  }
}

interface MonthlyGrowthEnrollment {
  created_at?: string;
  enrolled_at?: string;
  [key: string]: any;
}

function processMonthlyGrowth(enrollments: MonthlyGrowthEnrollment[]) {
  const months: Record<string, number> = {};
  const now = new Date();

  // Initialize last 6 months with 0
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString('default', { month: 'short' });
    months[key] = 0;
  }

  enrollments.forEach(e => {
    // Handle both potnetial column names just in case, though we queried created_at
    const dateStr = e.created_at || e.enrolled_at;
    if (!dateStr) return;

    const date = new Date(dateStr);
    const key = date.toLocaleString('default', { month: 'short' });
    if (months[key] !== undefined) {
      months[key]++;
    }
  });

  return Object.entries(months).map(([name, students]) => ({ name, students }));
}

// Removed processPopularLessons as logic is now inline
