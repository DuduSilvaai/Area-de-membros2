// app/(admin)/portals/[portalId]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CourseBuilder } from '@/components/admin/CourseBuilder';

export default function PortalDetailPage() {
    const params = useParams();
    const router = useRouter();
    const portalId = params.portalId as string;

    const handleBack = () => {
        router.push('/portals');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto p-6">
                {/* Header with Back Button */}
                <div className="mb-6 flex items-center">
                    <button
                        onClick={handleBack}
                        className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        title="Voltar para Meus Portais"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Gerenciar Conteúdos do Portal
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Organize módulos e aulas
                        </p>
                    </div>
                </div>

                {/* CourseBuilder Component */}
                <CourseBuilder portalId={portalId} onBack={handleBack} />
            </div>
        </div>
    );
}
