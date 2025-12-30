'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
    className?: string;
}

const itemsPerPageOptions = [10, 20, 50, 100];

export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    className,
}: PaginationProps) {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const canGoPrevious = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    // Generate page numbers to display
    const getPageNumbers = (): (number | 'ellipsis')[] => {
        const pages: (number | 'ellipsis')[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('ellipsis');
            }

            // Show pages around current
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('ellipsis');
            }

            // Always show last page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const buttonBaseClass = cn(
        'flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium transition-all duration-200',
        'border border-white/10 bg-[var(--bg-surface)]',
        'hover:bg-white/5 hover:border-white/20',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-white/10'
    );

    return (
        <div
            className={cn(
                'flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3',
                'bg-[var(--bg-surface)] border-t border-white/5',
                className
            )}
        >
            {/* Left side: Items info and per-page selector */}
            <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                <span>
                    Mostrando <span className="font-medium text-[var(--text-primary)]">{startItem}</span> a{' '}
                    <span className="font-medium text-[var(--text-primary)]">{endItem}</span> de{' '}
                    <span className="font-medium text-[var(--text-primary)]">{totalItems}</span> resultados
                </span>

                {onItemsPerPageChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs">Por página:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                            className={cn(
                                'h-8 px-2 rounded-md text-xs font-medium',
                                'bg-[var(--bg-surface)] border border-white/10 text-[var(--text-primary)]',
                                'focus:outline-none focus:ring-2 focus:ring-[var(--primary-main)]/50 focus:border-[var(--primary-main)]',
                                'cursor-pointer'
                            )}
                        >
                            {itemsPerPageOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Right side: Pagination controls */}
            <div className="flex items-center gap-1">
                {/* First page */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={!canGoPrevious}
                    className={buttonBaseClass}
                    title="Primeira página"
                >
                    <ChevronsLeft size={16} />
                </button>

                {/* Previous page */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!canGoPrevious}
                    className={buttonBaseClass}
                    title="Página anterior"
                >
                    <ChevronLeft size={16} />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 mx-2">
                    {getPageNumbers().map((page, index) =>
                        page === 'ellipsis' ? (
                            <span key={`ellipsis-${index}`} className="px-2 text-[var(--text-secondary)]">
                                …
                            </span>
                        ) : (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={cn(
                                    buttonBaseClass,
                                    page === currentPage &&
                                    'bg-[var(--primary-main)] border-[var(--primary-main)] text-white hover:bg-[var(--primary-hover)]'
                                )}
                            >
                                {page}
                            </button>
                        )
                    )}
                </div>

                {/* Next page */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!canGoNext}
                    className={buttonBaseClass}
                    title="Próxima página"
                >
                    <ChevronRight size={16} />
                </button>

                {/* Last page */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={!canGoNext}
                    className={buttonBaseClass}
                    title="Última página"
                >
                    <ChevronsRight size={16} />
                </button>
            </div>
        </div>
    );
}

export default Pagination;
