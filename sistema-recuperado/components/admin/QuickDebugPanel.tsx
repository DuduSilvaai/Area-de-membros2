'use client';

import { useState } from 'react';
import { Bug, Wrench, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { debugUserAccess, fixMissingEnrollments } from '@/app/(admin)/users/actions';

interface Props {
    userEmail: string;
    userId: string;
}

export function QuickDebugPanel({ userEmail, userId }: Props) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [message, setMessage] = useState('');

    const handleDebug = async () => {
        setLoading(true);
        setMessage('');
        
        try {
            const result = await debugUserAccess(userEmail);
            
            if (result.error) {
                setMessage(`Erro: ${result.error}`);
            } else {
                setDebugInfo(result.data);
                setMessage('Debug executado com sucesso!');
            }
        } catch (error) {
            setMessage('Erro inesperado ao executar debug');
        } finally {
            setLoading(false);
        }
    };

    const handleFix = async () => {
        setLoading(true);
        setMessage('');
        
        try {
            const result = await fixMissingEnrollments(userEmail);
            
            if (result.error) {
                setMessage(`Erro: ${result.error}`);
            } else {
                setMessage(result.message || 'Correção executada!');
                // Refresh debug info after fix
                setTimeout(() => handleDebug(), 1000);
            }
        } catch (error) {
            setMessage('Erro inesperado ao corrigir');
        } finally {
            setLoading(false);
        }
    };

    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40"
            >
                <Bug className="w-3 h-3" />
                Debug
                <ChevronDown className="w-3 h-3" />
            </button>
        );
    }

    return (
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    Debug Rápido - {userEmail}
                </h4>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                    <ChevronUp className="w-4 h-4" />
                </button>
            </div>

            <div className="flex gap-2 mb-3">
                <button
                    onClick={handleDebug}
                    disabled={loading}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                >
                    <Bug className="w-3 h-3" />
                    {loading ? 'Debugando...' : 'Debug'}
                </button>
                <button
                    onClick={handleFix}
                    disabled={loading}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                >
                    <Wrench className="w-3 h-3" />
                    {loading ? 'Corrigindo...' : 'Corrigir'}
                </button>
            </div>

            {message && (
                <div className={`mb-2 p-2 rounded text-xs ${
                    message.includes('Erro') 
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                        : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                }`}>
                    {message}
                </div>
            )}

            {debugInfo && (
                <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white dark:bg-gray-700 p-2 rounded">
                        <div className="text-sm font-bold text-blue-600">{debugInfo.totalEnrollments}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-2 rounded">
                        <div className="text-sm font-bold text-green-600">{debugInfo.activeEnrollments}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Ativos</div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-2 rounded">
                        <div className="text-sm font-bold text-purple-600">{debugInfo.expectedPortals}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Portais</div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-2 rounded">
                        <div className="text-sm font-bold text-orange-600">{debugInfo.missingPortals?.length || 0}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Faltando</div>
                    </div>
                </div>
            )}

            {debugInfo?.missingPortals && debugInfo.missingPortals.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                    <div className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                        Portais sem acesso:
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {debugInfo.missingPortals.map((portal: any) => (
                            <span key={portal.id} className="px-1 py-0.5 bg-yellow-200 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 rounded text-xs">
                                {portal.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}