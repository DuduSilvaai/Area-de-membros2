import { getDashboardStats } from '@/app/actions/dashboard-stats';
import Dashboard from "@/components/Dashboard";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return <Dashboard stats={stats} />;
}