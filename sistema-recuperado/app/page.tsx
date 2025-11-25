import TeamForm from "../components/TeamForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-10 bg-background text-foreground">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Recuperação do Sistema Mozart
        </h1>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          {/* Aqui chamamos o formulário que criamos */}
          <TeamForm />
        </div>
      </div>
    </main>
  );
}