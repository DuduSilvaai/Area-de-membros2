import TeamForm from "@/components/TeamForm";

export default function NewTeamPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-10 bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-4xl">
                <TeamForm />
            </div>
        </main>
    );
}
