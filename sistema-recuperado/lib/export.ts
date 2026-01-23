/**
 * CSV Export Utilities for Audit Logs
 */


export interface ExportableLog {
    id: string;
    created_at: string;
    user_id: string | null;
    action: string;
    details: Record<string, unknown> | null;
    user_name?: string;
    user_email?: string;
}

/**
 * Format a date to DD/MM/YYYY HH:MM format
 */
export function formatDateForExport(dateString: string): string {
    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
        return dateString;
    }
}

/**
 * Escape a value for CSV (handle commas, quotes, newlines)
 */
function escapeCSVValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

/**
 * Transform logs data to CSV format
 */
export function formatLogsForExport(logs: ExportableLog[]): string {
    // CSV Header
    const headers = ['Data/Hora', 'ID Usuário', 'Nome', 'Email', 'Ação', 'Detalhes'];

    // CSV Rows
    const rows = logs.map((log) => {
        const dateFormatted = formatDateForExport(log.created_at);
        const userId = log.user_id || 'N/A';
        const userName = log.user_name || 'Desconhecido';
        const userEmail = log.user_email || 'N/A';
        const action = log.action;
        const details = log.details ? JSON.stringify(log.details) : '';

        return [
            escapeCSVValue(dateFormatted),
            escapeCSVValue(userId),
            escapeCSVValue(userName),
            escapeCSVValue(userEmail),
            escapeCSVValue(action),
            escapeCSVValue(details),
        ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
}

/**
 * Generate filename with current date
 */
/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL
    URL.revokeObjectURL(link.href);
}

export function exportLogsToCSV(logs: ExportableLog[]): void {
    const csvContent = formatLogsForExport(logs);
    const filename = generateExportFilename('csv');
    downloadCSV(csvContent, filename);
}


/**
 * Generate filename with current date and extension
 */
export function generateExportFilename(extension: 'csv' | 'pdf'): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `audit-logs-${year}-${month}-${day}.${extension}`;
}


/**
 * Export logs to PDF using jsPDF
 */
export async function exportLogsToPDF(logs: ExportableLog[]): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const filename = generateExportFilename('pdf');

    // Add Title
    doc.setFontSize(18);
    doc.text('Relatório de Logs de Acesso', 14, 22);

    // Add Metadata
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    doc.text(`Total de registros: ${logs.length}`, 14, 35);

    // Prepare table data
    const tableHead = [['Data/Hora', 'Usuário', 'Email', 'Ação']];
    const tableBody = logs.map(log => [
        formatDateForExport(log.created_at),
        log.user_name || 'Desconhecido',
        log.user_email || 'N/A',
        log.action
    ]);

    // Generate Table
    autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [255, 45, 120] }, // Mozart Pink
        alternateRowStyles: { fillColor: [245, 245, 245] },
        theme: 'grid'
    });

    doc.save(filename);
}

