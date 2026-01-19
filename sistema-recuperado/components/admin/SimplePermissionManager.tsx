'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Bug, Wrench, Info } from 'lucide-react';
import { upsertEnrollment, deleteEnrollment, debugUserAccess, fixMissingEnrollments } from '@/app/(admin)/users/actions';

interface Props {
    userId: string;
    userEmail: string;
    initialPortals: any[];
    initialEnrollments: any[];
}

export function SimplePermissionManager({ userId, userEmail, initialPortals, initialEnrollments }: Props) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [showDebug, setShowDebug] = useState(false);

    const handleSavePermissions = async (portalId: string, hasAccess: boolean) => {
        try {
            setIsSaving(true);
            setMessage('');

            if (!hasAccess) {
                // Remove enrollment
                const result = await deleteEnrollment(userId, portalId);
                if (result.error) {
                    setMessage(`Erro: ${result.error}`);
                } else {
                    setMessage('Acesso removido com sucesso! As alterações serão refletidas em tempo real.');
                    
                    // Force refresh after a short delay to allow for realtime propagation
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
            } else {
                // Add enrollment with full access
                const enrollmentData = {
                    access_all: true,
                    allowed_modules: [],
                    access_granted_at: new Date().toISOString()
                };

                const result = await upsertEnrollment(userId, portalId, enrollmentData);
                if (result.error) {
                    setMessage(`Erro: ${result.error}`);
                } else {
                    setMessage('Acesso concedido com sucesso! As alterações serão refletidas em tempo real.');
                    
                    // Force refresh after a short delay to allow for realtime propagation
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Error saving permissions:', error);
            setMessage('Erro inesperado ao salvar permissões');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDebugUser = async () => {
        try {
            setIsSaving(true);
            setMessage('');
            
            const result = await debugUserAccess(userEmail);
            
            if (result.error) {
                setMessage(`Erro no debug: ${result.error}`);
            } else {
                setDebugInfo(result.data);
                setShowDebug(true);
                setMessage('Debug executado com sucesso!');
            }
        } catch (error) {
            console.error('Error debugging user:', error);
            setMessage('Erro inesperado ao executar debug');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFixMissing = async () => {
        try {
            setIsSaving(true);
            setMessage('');
            
            const result = await fixMissingEnrollments(userEmail);
            
            if (result.error) {
                setMessage(`Erro na correção: ${result.error}`);
            } else {
                setMessage(result.message || 'Correção executada com sucesso!');
                
                // Refresh the page after fixing
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        } catch (error) {
            console.error('Error fixing enrollments:', error);
            setMessage('Erro inesperado ao corrigir enrollments');
        } finally {
            setIsSaving(false);
        }
    };

    const hasEnrollment = (portalId: string) => {
        return initialEnrollments.some(e => e.portal_id === portalId);
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Gerenciar Acessos
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Aluno: {userEmail}
                </p>
            </div>

            {/* Debug and Fix Tools */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-3">
                    Ferramentas de Debug
                </h3>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={handleDebugUser}
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                        <Bug className="w-4 h-4" />
                        {isSaving ? 'Debugando...' : 'Debug Usuário'}
                    </button>
                    <button
                        onClick={handleFixMissing}
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                        <Wrench className="w-4 h-4" />
                        {isSaving ? 'Corrigindo...' : 'Corrigir Acessos'}
                    </button>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    Use "Debug Usuário" para verificar o status dos acessos e "Corrigir Acessos" para criar enrollments faltantes automaticamente.
                </p>
            </div>

            {/* Debug Info Display */}
            {showDebug && debugInfo && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            Informações de Debug
                        </h3>
                        <button
                            onClick={() => setShowDebug(false)}
                            className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                            Fechar
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="bg-white dark:bg-gray-700 p-3 rounded">
                            <div className="text-lg font-bold text-blue-600">{debugInfo.totalEnrollments}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Total Enrollments</div>
                        </div>
                        <div className="bg-white dark:bg-gray-700 p-3 rounded">
                            <div className="text-lg font-bold text-green-600">{debugInfo.activeEnrollments}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Active Enrollments</div>
                        </div>
                        <div className="bg-white dark:bg-gray-700 p-3 rounded">
                            <div className="text-lg font-bold text-purple-600">{debugInfo.expectedPortals}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Expected Portals</div>
                        </div>
                        <div className="bg-white dark:bg-gray-700 p-3 rounded">
                            <div className="text-lg font-bold text-orange-600">{debugInfo.missingPortals?.length || 0}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Missing Portals</div>
                        </div>
                    </div>
                    {debugInfo.missingPortals && debugInfo.missingPortals.length > 0 && (
                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                            <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                                Portais sem acesso:
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {debugInfo.missingPortals.map((portal: any) => (
                                    <span key={portal.id} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 rounded text-xs">
                                        {portal.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {message && (
                <div className={`mb-4 p-3 rounded-lg ${
                    message.includes('Erro') 
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                        : 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                }`}>
                    {message}
                </div>
            )}

            <div className="space-y-4">
                {initialPortals.map((portal) => {
                    const enrolled = hasEnrollment(portal.id);
                    return (
                        <div key={portal.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">
                                        {portal.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {portal.description || 'Sem descrição'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Status: {enrolled ? 'Com acesso' : 'Sem acesso'}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {enrolled ? (
                                        <button
                                            onClick={() => handleSavePermissions(portal.id, false)}
                                            disabled={isSaving}
                                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remover Acesso'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleSavePermissions(portal.id, true)}
                                            disabled={isSaving}
                                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Conceder Acesso'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {initialPortals.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500">Nenhum portal disponível</p>
                </div>
            )}
        </div>
    );
}