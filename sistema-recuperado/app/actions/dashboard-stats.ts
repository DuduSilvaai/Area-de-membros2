'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function getDashboardStats() {
  const supabase = await createClient();

  try {
    // 1. Total Students (enrollments count)
    // Using count on enrollment table
    const { count: totalStudents, error: studentsError } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true });

    if (studentsError) console.error('Error fetching students count:', JSON.stringify(studentsError, null, 2));

    // 2. Total Lessons (contents count)
    const { count: totalLessons, error: lessonsError } = await supabase
      .from('contents')
      .select('*', { count: 'exact', head: true });

    if (lessonsError) console.error('Error fetching lessons count:', JSON.stringify(lessonsError, null, 2));

    // 3. Accesses Today (access_logs count for today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { count: accessesToday, error: accessesError } = await supabase
      .from('access_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO);

    if (accessesError) console.error('Error fetching today accesses:', JSON.stringify(accessesError, null, 2));

    // 4. Enrollments by Month (Last 6 months) for Line Chart
    // Fallback to 'created_at' often used if 'enrolled_at' is missing
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Tentativa de buscar com created_at (mais comum) já que enrolled_at falhou
    const { data: enrollmentsData, error: enrollmentsDataError } = await supabase
      .from('enrollments')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString());

    if (enrollmentsDataError) {
      console.error('Error fetching enrollments data (trying created_at):', JSON.stringify(enrollmentsDataError, null, 2));
    }

    const monthlyGrowth = processMonthlyGrowth(enrollmentsData || []);

    // 5. Popular Lessons (Based on access_logs count)
    // Manually fetch logs and then contents to avoid Foreign Key issues
    const { data: popularLogs, error: popularError } = await supabase
      .from('access_logs')
      .select('content_id')
      .not('content_id', 'is', null)
      .limit(500); // Sample size

    if (popularError) console.error('Error fetching popular logs:', JSON.stringify(popularError, null, 2));

    let popularLessons: { name: string; accesses: number }[] = [];

    interface AccessLog {
      content_id: string;
      [key: string]: any;
    }

    if (popularLogs && popularLogs.length > 0) {
      const contentCounts: Record<string, number> = {};
      const contentIds = new Set<string>();

      popularLogs.forEach((log: AccessLog) => {
        if (log.content_id) {
          contentCounts[log.content_id] = (contentCounts[log.content_id] || 0) + 1;
          contentIds.add(log.content_id);
        }
      });

      // Fetch titles for these content IDs
      const { data: contentsData, error: contentsError } = await supabase
        .from('contents')
        .select('id, title')
        .in('id', Array.from(contentIds));

      if (contentsError) console.error('Error fetching content titles:', JSON.stringify(contentsError, null, 2));

      if (contentsData) {
        popularLessons = Object.entries(contentCounts)
          .map(([id, count]) => {
            const content = contentsData.find(c => c.id === id);
            return {
              name: content?.title || 'Aula Removida',
              accesses: count
            };
          })
          .sort((a, b) => b.accesses - a.accesses)
          .slice(0, 5);
      }
    }

    // 6. Recent Activity
    // Fetch logs first
    const { data: recentLogs, error: activityError } = await supabase
      .from('access_logs')
      .select('id, action, created_at, details, user_id')
      .order('created_at', { ascending: false })
      .limit(5);

    if (activityError) console.error('Error fetching recent activity:', JSON.stringify(activityError, null, 2));

    interface ActivityItem {
      id: string;
      action: string;
      created_at: string;
      details?: any;
      user_id?: string;
      profile: {
        email: string;
        full_name?: string | null;
      };
    }

    let recentActivityWithProfiles: ActivityItem[] = [];

    if (recentLogs && recentLogs.length > 0) {
      // Fetch profiles manually
      const userIds = Array.from(new Set(recentLogs.map(l => l.user_id).filter(Boolean)));

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      recentActivityWithProfiles = recentLogs.map(log => {
        const profile = profilesData?.find(p => p.id === log.user_id);
        return {
          ...log,
          profile: profile || { email: 'Usuário Desconhecido' }
        };
      });
    }

    return {
      totalStudents: totalStudents || 0,
      totalLessons: totalLessons || 0,
      accessesToday: accessesToday || 0,
      monthlyGrowth: monthlyGrowth,
      popularLessons: popularLessons,
      recentActivity: recentActivityWithProfiles
    };

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return {
      totalStudents: 0,
      totalLessons: 0,
      accessesToday: 0,
      monthlyGrowth: [],
      popularLessons: [],
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
