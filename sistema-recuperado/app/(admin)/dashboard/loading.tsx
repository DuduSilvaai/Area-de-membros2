import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
    return (
        <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-pink-600" />
                <p className="text-gray-500 animate-pulse">Carregando painel...</p>
            </div>
        </div>
    );
}
