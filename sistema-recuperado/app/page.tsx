import PortalsList from "@/components/PortalsList";

export default function Home() {
  return (
    <main style={{ backgroundColor: "#F8F9FB", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto">
        <PortalsList />
      </div>
    </main>
  );
}
