'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
    LogIn,
    LogOut,
    Plus,
    AlertTriangle,
    ShieldX,
    Eye,
    Activity,
    type LucideIcon,
} from 'lucide-react';

export type ActionType =
    | 'login'
    | 'logout'
    | 'criacao'
    | 'atualizacao'
    | 'exclusao'
    | 'erro'
    | 'acesso_negado'
    | 'visualizacao'
    | 'default';

interface ActionConfig {
    label: string;
    icon: LucideIcon;
    className: string;
}

const actionConfigs: Record<ActionType, ActionConfig> = {
    login: {
        label: 'Login',
        icon: LogIn,
        className: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    },
    logout: {
        label: 'Logout',
        icon: LogOut,
        className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
    },
    criacao: {
        label: 'Criação',
        icon: Plus,
        className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    },
    atualizacao: {
        label: 'Atualização',
        icon: Activity,
        className: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    },
    exclusao: {
        label: 'Exclusão',
        icon: AlertTriangle,
        className: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    },
    erro: {
        label: 'Erro',
        icon: AlertTriangle,
        className: 'bg-red-500/15 text-red-400 border-red-500/20',
    },
    acesso_negado: {
        label: 'Acesso Negado',
        icon: ShieldX,
        className: 'bg-red-500/15 text-red-400 border-red-500/20',
    },
    visualizacao: {
        label: 'Visualização',
        icon: Eye,
        className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    },
    default: {
        label: 'Ação',
        icon: Activity,
        className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
    },
};

// Map common action strings to ActionType
function getActionType(action: string): ActionType {
    const normalizedAction = action.toLowerCase().trim();

    if (normalizedAction.includes('login') || normalizedAction.includes('entrou')) {
        return 'login';
    }
    if (normalizedAction.includes('logout') || normalizedAction.includes('saiu')) {
        return 'logout';
    }
    if (
        normalizedAction.includes('cri') ||
        normalizedAction.includes('novo') ||
        normalizedAction.includes('create') ||
        normalizedAction.includes('cadastr')
    ) {
        return 'criacao';
    }
    if (
        normalizedAction.includes('update') ||
        normalizedAction.includes('atualiz') ||
        normalizedAction.includes('reset') ||
        normalizedAction.includes('permission') ||
        normalizedAction.includes('activate') ||
        normalizedAction.includes('ativ')
    ) {
        return 'atualizacao';
    }
    if (
        normalizedAction.includes('remove') ||
        normalizedAction.includes('delete') ||
        normalizedAction.includes('exclu') ||
        normalizedAction.includes('deactivate') ||
        normalizedAction.includes('desativ')
    ) {
        return 'exclusao';
    }
    if (normalizedAction.includes('erro') || normalizedAction.includes('error') || normalizedAction.includes('falha')) {
        return 'erro';
    }
    if (
        normalizedAction.includes('negado') ||
        normalizedAction.includes('denied') ||
        normalizedAction.includes('bloqueado') ||
        normalizedAction.includes('access_denied')
    ) {
        return 'acesso_negado';
    }
    if (
        normalizedAction.includes('visual') ||
        normalizedAction.includes('view') ||
        normalizedAction.includes('assistiu')
    ) {
        return 'visualizacao';
    }

    return 'default';
}

interface ActionBadgeProps {
    action: string;
    className?: string;
    showIcon?: boolean;
}

export function ActionBadge({ action, className, showIcon = true }: ActionBadgeProps) {
    const actionType = getActionType(action);
    const config = actionConfigs[actionType];
    const Icon = config.icon;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200',
                'font-[family-name:var(--font-mono)]',
                config.className,
                className
            )}
        >
            {showIcon && <Icon size={12} className="shrink-0" />}
            <span className="truncate max-w-[120px]" title={action}>
                {action}
            </span>
        </span>
    );
}

export default ActionBadge;
