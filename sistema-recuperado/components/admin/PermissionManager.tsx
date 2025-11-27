// components/admin/PermissionManager.tsx
'use client';

import { useState, useEffect, useReducer } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    ChevronDown,
    ChevronRight,
    Check,
    X,
    Save,
    Loader2,
    AlertCircle,
    GraduationCap,
    Lock,
    Unlock,
    Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { Portal, ModuleWithChildren, EnrollmentPermissions } from '@/types/enrollment';
import { upsertEnrollment, deleteEnrollment } from '@/app/(admin)/users/actions';

interface PermissionState {
    [portalId: string]: {
        hasAccess: boolean;
        accessAll: boolean;
        selectedModules: Set<string>;
    };
}

type PermissionAction =
    | { type: 'SET_PORTAL_ACCESS'; portalId: string; hasAccess: boolean }
    | { type: 'SET_ACCESS_ALL'; portalId: string; accessAll: boolean }
    | { type: 'TOGGLE_MODULE'; portalId: string; moduleId: string }
    | { type: 'SELECT_MODULE_TREE'; portalId: string; moduleIds: string[] }
    | { type: 'DESELECT_MODULE_TREE'; portalId: string; moduleIds: string[] }
    | { type: 'INIT_STATE'; state: PermissionState };

function permissionReducer(state: PermissionState, action: PermissionAction): PermissionState {
    switch (action.type) {
        case 'INIT_STATE':
            return action.state;

        case 'SET_PORTAL_ACCESS':
            return {
                ...state,
                [action.portalId]: {
                    ...state[action.portalId],
                    hasAccess: action.hasAccess,
                    selectedModules: action.hasAccess ? state[action.portalId]?.selectedModules || new Set() : new Set()
                }
            };

        case 'SET_ACCESS_ALL':
            return {
                ...state,
                [action.portalId]: {
                    ...state[action.portalId],
                    accessAll: action.accessAll,
                    selectedModules: action.accessAll ? new Set() : state[action.portalId]?.selectedModules || new Set()
                }
            };

        case 'TOGGLE_MODULE':
            const currentModules = new Set(state[action.portalId]?.selectedModules || []);
            if (currentModules.has(action.moduleId)) {
                currentModules.delete(action.moduleId);
            } else {
                currentModules.add(action.moduleId);
            }
            return {
                ...state,
                [action.portalId]: {
                    ...state[action.portalId],
                    selectedModules: currentModules
                }
            };

        case 'SELECT_MODULE_TREE':
            const selectedSet = new Set(state[action.portalId]?.selectedModules || []);
            action.moduleIds.forEach(id => selectedSet.add(id));
            return {
                ...state,
                [action.portalId]: {
                    ...state[action.portalId],
                    selectedModules: selectedSet
                }
            };

        case 'DESELECT_MODULE_TREE':
            const deselectedSet = new Set(state[action.portalId]?.selectedModules || []);
            action.moduleIds.forEach(id => deselectedSet.delete(id));
            return {
                ...state,
                [action.portalId]: {
                    ...state[action.portalId],
                    selectedModules: deselectedSet
                }
            };

        default:
            return state;
    }
}

interface Props {
    userId: string;
    userEmail: string;
}

export function PermissionManager({ userId, userEmail }: Props) {
    const [portals, setPortals] = useState<Portal[]>([]);
    const [modulesByPortal, setModulesByPortal] = useState<Map<string, ModuleWithChildren[]>>(new Map());
    const [expandedPortals, setExpandedPortals] = useState<Set<string>>(new Set());
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [permissions, dispatch] = useReducer(permissionReducer, {});

    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        try {
            setIsLoading(true);

            // Fetch portals
            const { data: portalsData, error: portalsError } = await supabase
                .from('portals')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (portalsError) throw portalsError;

            // Fetch all modules
            const { data: modulesData, error: modulesError } = await supabase
                .from('modules')
                .select('*')
                .eq('is_active', true)
                .order('order_index');

            if (modulesError) throw modulesError;

            // Fetch existing enrollments for this user
            const { data: enrollmentsData, error: enrollmentsError } = await supabase
                .from('enrollments')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true);

            if (enrollmentsError) throw enrollmentsError;

            // Organize modules by portal
            const moduleMap = new Map<string, ModuleWithChildren[]>();
            (modulesData || []).forEach(module => {
                if (!module.portal_id) return;

                if (!moduleMap.has(module.portal_id)) {
                    moduleMap.set(module.portal_id, []);
                }

                // Ensure portal_id is treated as string since we checked it's truthy
                const moduleWithPortalId = { ...module, portal_id: module.portal_id! };
                moduleMap.get(module.portal_id)!.push(moduleWithPortalId);
            });

            // Build hierarchical structure for each portal
            const hierarchicalMap = new Map<string, ModuleWithChildren[]>();
            moduleMap.forEach((modules, portalId) => {
                hierarchicalMap.set(portalId, buildModuleTree(modules));
            });

            setPortals(portalsData || []);
            setModulesByPortal(hierarchicalMap);

            // Initialize permission state from existing enrollments
            const initialState: PermissionState = {};
            (portalsData || []).forEach(portal => {
                const enrollment = (enrollmentsData || []).find(e => e.portal_id === portal.id);

                if (enrollment) {
                    const perms = enrollment.permissions as unknown as EnrollmentPermissions;
                    initialState[portal.id] = {
                        hasAccess: true,
                        accessAll: perms.access_all || false,
                        selectedModules: new Set(perms.allowed_modules || [])
                    };
                } else {
                    initialState[portal.id] = {
                        hasAccess: false,
                        accessAll: false,
                        selectedModules: new Set()
                    };
                }
            });

            dispatch({ type: 'INIT_STATE', state: initialState });
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setIsLoading(false);
        }
    };

    const buildModuleTree = (modules: ModuleWithChildren[]): ModuleWithChildren[] => {
        const moduleMap = new Map<string, ModuleWithChildren>();
        const rootModules: ModuleWithChildren[] = [];

        // First pass: create map
        modules.forEach(module => {
            moduleMap.set(module.id, { ...module, children: [] });
        });

        // Second pass: build tree
        modules.forEach(module => {
            const node = moduleMap.get(module.id)!;
            if (module.parent_module_id) {
                const parent = moduleMap.get(module.parent_module_id);
                if (parent) {
                    parent.children = parent.children || [];
                    parent.children.push(node);
                } else {
                    rootModules.push(node);
                }
            } else {
                rootModules.push(node);
            }
        });

        return rootModules;
    };

    const getAllModuleIds = (module: ModuleWithChildren): string[] => {
        let ids = [module.id];
        if (module.children) {
            module.children.forEach(child => {
                ids = ids.concat(getAllModuleIds(child));
            });
        }
        return ids;
    };

    const handleModuleToggle = (portalId: string, module: ModuleWithChildren) => {
        const portalPerms = permissions[portalId];
        const allIds = getAllModuleIds(module);

        // If any child is not selected, select all. Otherwise, deselect all.
        const allSelected = allIds.every(id => portalPerms?.selectedModules.has(id));

        if (allSelected) {
            dispatch({ type: 'DESELECT_MODULE_TREE', portalId, moduleIds: allIds });
        } else {
            dispatch({ type: 'SELECT_MODULE_TREE', portalId, moduleIds: allIds });
        }
    };

    const handleSavePermissions = async () => {
        try {
            setIsSaving(true);

            const savePromises = Object.entries(permissions).map(async ([portalId, perms]) => {
                if (!perms.hasAccess) {
                    // Remove enrollment if no access
                    return deleteEnrollment(userId, portalId);
                } else {
                    // Upsert enrollment
                    const enrollmentData: EnrollmentPermissions = {
                        access_all: perms.accessAll,
                        allowed_modules: Array.from(perms.selectedModules),
                        access_granted_at: new Date().toISOString()
                    };

                    return upsertEnrollment(userId, portalId, enrollmentData);
                }
            });

            const results = await Promise.all(savePromises);

            const hasErrors = results.some(r => 'error' in r && r.error);
            if (hasErrors) {
                toast.error('Erro ao salvar algumas permissões');
            } else {
                toast.success('Permissões salvas com sucesso!');
                await loadData(); // Reload to reflect changes
            }
        } catch (error) {
            console.error('Error saving permissions:', error);
            toast.error('Erro ao salvar permissões');
        } finally {
            setIsSaving(false);
        }
    };

    const renderModule = (module: ModuleWithChildren, portalId: string, level: number = 0) => {
        const portalPerms = permissions[portalId];
        const isExpanded = expandedModules.has(module.id);
        const hasChildren = module.children && module.children.length > 0;
        const allIds = getAllModuleIds(module);
        const allSelected = allIds.every(id => portalPerms?.selectedModules.has(id));
        const someSelected = allIds.some(id => portalPerms?.selectedModules.has(id));
        const isAccessAll = portalPerms?.accessAll;

        return (
            <div key={module.id} className="select-none">
                <div
                    className={`flex items-center py-2 px-3 rounded-md hover:bg-gray-50 transition-colors ${level > 0 ? 'ml-' + (level * 6) : ''
                        }`}
                    style={{ marginLeft: `${level * 24}px` }}
                >
                    {/* Expand/Collapse Button */}
                    <button
                        onClick={() => {
                            if (hasChildren) {
                                setExpandedModules(prev => {
                                    const next = new Set(prev);
                                    if (next.has(module.id)) {
                                        next.delete(module.id);
                                    } else {
                                        next.add(module.id);
                                    }
                                    return next;
                                });
                            }
                        }}
                        className={`mr-2 p-1 hover:bg-gray-200 rounded ${!hasChildren ? 'invisible' : ''}`}
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                    </button>

                    {/* Checkbox */}
                    <div className="flex items-center flex-1">
                        <button
                            onClick={() => handleModuleToggle(portalId, module)}
                            disabled={isAccessAll || !portalPerms?.hasAccess}
                            className={`flex items-center justify-center w-5 h-5 border-2 rounded mr-3 transition-colors ${isAccessAll || !portalPerms?.hasAccess
                                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                                    : allSelected
                                        ? 'border-blue-600 bg-blue-600'
                                        : someSelected
                                            ? 'border-blue-600 bg-blue-100'
                                            : 'border-gray-400 hover:border-blue-500'
                                }`}
                        >
                            {allSelected && <Check className="w-3 h-3 text-white" />}
                            {!allSelected && someSelected && <div className="w-2 h-2 bg-blue-600 rounded-sm" />}
                        </button>

                        <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">{module.title}</div>
                            {module.description && (
                                <div className="text-xs text-gray-500 mt-0.5">{module.description}</div>
                            )}
                        </div>

                        {hasChildren && (
                            <span className="text-xs text-gray-400 ml-2">
                                {module.children!.length} {module.children!.length === 1 ? 'item' : 'itens'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Render children */}
                {hasChildren && isExpanded && (
                    <div className="mt-1">
                        {module.children!.map(child => renderModule(child, portalId, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Gerenciar Acessos</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Aluno: <span className="font-medium text-gray-700">{userEmail}</span>
                        </p>
                    </div>
                    <button
                        onClick={handleSavePermissions}
                        disabled={isSaving}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Salvar Permissões
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-900">Como funciona</h3>
                        <div className="mt-1 text-sm text-blue-700">
                            <ul className="list-disc list-inside space-y-1">
                                <li><strong>Acesso Completo:</strong> O aluno vê todos os módulos e conteúdos do portal</li>
                                <li><strong>Acesso Granular:</strong> Selecione apenas os módulos específicos que o aluno pode acessar</li>
                                <li>Marcar um módulo pai automaticamente seleciona todos os sub-módulos</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Portals List */}
            <div className="space-y-4">
                {portals.map(portal => {
                    const portalPerms = permissions[portal.id];
                    const isExpanded = expandedPortals.has(portal.id);
                    const modules = modulesByPortal.get(portal.id) || [];
                    const selectedCount = portalPerms?.selectedModules.size || 0;

                    return (
                        <div key={portal.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            {/* Portal Header */}
                            <div className="p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 flex-1">
                                        <button
                                            onClick={() => {
                                                setExpandedPortals(prev => {
                                                    const next = new Set(prev);
                                                    if (next.has(portal.id)) {
                                                        next.delete(portal.id);
                                                    } else {
                                                        next.add(portal.id);
                                                    }
                                                    return next;
                                                });
                                            }}
                                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="w-5 h-5 text-gray-600" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5 text-gray-600" />
                                            )}
                                        </button>

                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                                <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                                                {portal.name}
                                            </h3>
                                            {portal.description && (
                                                <p className="text-sm text-gray-500 mt-1">{portal.description}</p>
                                            )}
                                        </div>

                                        {/* Access Status Badge */}
                                        {portalPerms?.hasAccess ? (
                                            portalPerms.accessAll ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                    <Unlock className="w-3 h-3 mr-1" />
                                                    Acesso Completo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                    <Lock className="w-3 h-3 mr-1" />
                                                    {selectedCount} {selectedCount === 1 ? 'módulo' : 'módulos'}
                                                </span>
                                            )
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                <X className="w-3 h-3 mr-1" />
                                                Sem Acesso
                                            </span>
                                        )}
                                    </div>

                                    {/* Portal Access Toggle */}
                                    <div className="ml-4">
                                        <button
                                            onClick={() => dispatch({
                                                type: 'SET_PORTAL_ACCESS',
                                                portalId: portal.id,
                                                hasAccess: !portalPerms?.hasAccess
                                            })}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${portalPerms?.hasAccess ? 'bg-blue-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${portalPerms?.hasAccess ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Portal Content (when expanded and has access) */}
                            {isExpanded && portalPerms?.hasAccess && (
                                <div className="p-5 bg-gray-50">
                                    {/* Access Mode Toggle */}
                                    <div className="mb-4 flex items-center space-x-2 bg-white rounded-lg p-3 border border-gray-200">
                                        <button
                                            onClick={() => dispatch({ type: 'SET_ACCESS_ALL', portalId: portal.id, accessAll: true })}
                                            className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${portalPerms.accessAll
                                                    ? 'bg-green-600 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            Acesso Completo
                                        </button>
                                        <button
                                            onClick={() => dispatch({ type: 'SET_ACCESS_ALL', portalId: portal.id, accessAll: false })}
                                            className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${!portalPerms.accessAll
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            Acesso Granular
                                        </button>
                                    </div>

                                    {/* Module Tree (when granular) */}
                                    {!portalPerms.accessAll && (
                                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                                            {modules.length > 0 ? (
                                                <div className="space-y-1">
                                                    {modules.map(module => renderModule(module, portal.id))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                    <p className="text-sm">Nenhum módulo disponível neste portal</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {portalPerms.accessAll && (
                                        <div className="text-center py-8 text-gray-500">
                                            <Unlock className="w-12 h-12 mx-auto mb-2 text-green-600" />
                                            <p className="text-sm font-medium">O aluno tem acesso a todo o conteúdo deste portal</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {portals.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                        <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum portal disponível</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Crie portais para começar a gerenciar acessos
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
