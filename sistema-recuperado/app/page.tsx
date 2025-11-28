import PortalsList from "@/components/PortalsList";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <PortalsList />
      </div>
    </main>
  );
}