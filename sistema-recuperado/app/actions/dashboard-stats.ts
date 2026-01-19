'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function getDashboardStats() {
  const supabase = await createClient();

  try {
    // 1. Total Students
    const { count: totalStudents, error: studentsError } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true });

    if (studentsError) console.error('Error fetching students count:', JSON.stringify(studentsError, null, 2));

    // 2. Total Lessons
    const { count: totalLessons, error: lessonsError } = await supabase
      .from('contents')
      .select('*', { count: 'exact', head: true });

    if (lessonsError) console.error('Error fetching lessons count:', JSON.stringify(lessonsError, null, 2));

    // 3. Accesses Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { count: accessesToday, error: accessesError } = await supabase
      .from('access_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO);

    if (accessesError) console.error('Error fetching today accesses:', JSON.stringify(accessesError, null, 2));

    // 4. Comments Today
    const { count: commentsToday, error: commentsError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO);

    if (commentsError) console.error('Error fetching today comments:', JSON.stringify(commentsError, null, 2));

    // 5. Latest Comments
    const { data: latestCommentsData, error: latestCommentsError } = await supabase
      .from('comments')
      .select(`
        id,
        text,
        created_at,
        user_id,
        content_id,
        contents (
          title
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (latestCommentsError) console.error('Error fetching latest comments:', JSON.stringify(latestCommentsError, null, 2));

    let latestCommentsWithProfiles: any[] = [];
    if (latestCommentsData && latestCommentsData.length > 0) {
      const commentUserIds = Array.from(new Set(latestCommentsData.map(c => c.user_id).filter(Boolean)));

      const { data: commentProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email') // Assuming avatar_url might not be on profile or we use fallback
        .in('id', commentUserIds);

      latestCommentsWithProfiles = latestCommentsData.map(comment => {
        const profile = commentProfiles?.find(p => p.id === comment.user_id);
        return {
          id: comment.id,
          text: comment.text,
          created_at: comment.created_at,
          user_name: profile?.full_name || profile?.email || 'Usuário',
          user_avatar: null, // Avatar logic can be improved if we know where it is, currently fallback in UI
          lesson_title: (comment.contents as any)?.title || 'Aula desconhecida'
        };
      });
    }

    // 6. Top Active Students (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: activeLogs, error: activeLogsError } = await supabase
      .from('access_logs')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (activeLogsError) console.error('Error fetching active logs:', JSON.stringify(activeLogsError, null, 2));

    let topStudents: any[] = [];
    if (activeLogs && activeLogs.length > 0) {
      const studentCounts: Record<string, number> = {};
      activeLogs.forEach(log => {
        if (log.user_id) {
          studentCounts[log.user_id] = (studentCounts[log.user_id] || 0) + 1;
        }
      });

      const topUserIds = Object.keys(studentCounts)
        .sort((a, b) => studentCounts[b] - studentCounts[a])
        .slice(0, 5);

      if (topUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email') // Removed avatar_url if not in profiles, assuming it might be in users or profiles. Using logic from previous code.
          .in('id', topUserIds);

        // Also try to get avatars if they are in public.users metadata or stored elsewhere? 
        // In this codebase, profiles usually has basics. Let's assume standard profile fields.

        topStudents = topUserIds.map(id => {
          const profile = profiles?.find(p => p.id === id);
          return {
            id,
            name: profile?.full_name || 'Usuário',
            email: profile?.email || '',
            access_count: studentCounts[id]
          };
        });
      }
    }

    return {
      totalStudents: totalStudents || 0,
      totalLessons: totalLessons || 0,
      accessesToday: accessesToday || 0,
      commentsToday: commentsToday || 0,
      latestComments: latestCommentsWithProfiles,
      topStudents,
      recentActivity: [] // Keeping empty or removing if unused in new design
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
