'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Pagination } from '@/components/admin/Pagination';

interface PaginationWrapperProps {
    totalPages: number;
    totalItems: number;
    itemsPerPage?: number;
}

export function PaginationWrapper({
    totalPages,
    totalItems,
    itemsPerPage = 20
}: PaginationWrapperProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentPage = Number(searchParams.get('page')) || 1;

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
        />
    );
}
