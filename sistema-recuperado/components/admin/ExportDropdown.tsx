'use client';

import React from 'react';
import { Download, FileText, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExportDropdownProps {
    onExportCSV: () => Promise<void>;
    onExportPDF: () => Promise<void>;
    disabled?: boolean;
    isLoading?: boolean;
}

export default function ExportDropdown({
    onExportCSV,
    onExportPDF,
    disabled = false,
    isLoading = false
}: ExportDropdownProps) {
    const [isExporting, setIsExporting] = React.useState(false);

    const handleAction = async (action: () => Promise<void>) => {
        setIsExporting(true);
        try {
            await action();
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className="gap-2 border-primary/20 hover:border-primary/50 text-primary"
                    disabled={disabled || isExporting || isLoading}
                >
                    {isExporting ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                        <Download className="w-4 h-4" />
                    )}
                    Exportar
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAction(onExportCSV)} className="gap-2 cursor-pointer">
                    <Table className="w-4 h-4" />
                    Exportar CSV (Excel)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction(onExportPDF)} className="gap-2 cursor-pointer">
                    <FileText className="w-4 h-4" />
                    Exportar PDF
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
