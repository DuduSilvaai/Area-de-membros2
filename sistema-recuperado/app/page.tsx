import PortalsList from "@/components/PortalsList";

export default function Home() {
  return (
    <main style={{ backgroundColor: "var(--bg-canvas)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto">
        <PortalsList />
      </div>
    </main>
  );
}
