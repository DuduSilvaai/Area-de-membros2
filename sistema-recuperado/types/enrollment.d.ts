// types/enrollment.d.ts
export interface EnrollmentPermissions {
    access_all: boolean;
    allowed_modules: string[];
    access_granted_at?: string;
    granted_by?: string;
}

export interface Enrollment {
    id: string;
    user_id: string;
    portal_id: string;
    permissions: EnrollmentPermissions;
    enrolled_at: string;
    enrolled_by: string | null;
    expires_at: string | null;
    is_active: boolean;
}

export interface UserWithEnrollments {
    id: string;
    email: string;
    created_at: string;
    raw_user_meta_data: {
        name?: string;
        avatar_url?: string;
        [key: string]: any;
    };
    enrollments: Enrollment[];
}

export interface Portal {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    created_at: string;
    updated_at?: string | null;
    created_by?: string | null;
    is_active: boolean;
    settings?: {
        primary_color: string;
        secondary_color: string;
        logo_url: string;
        favicon_url: string;
        support_email: string;
        [key: string]: any;
    } | null;
}

export interface ModuleWithChildren {
    id: string;
    title: string;
    description: string | null;
    portal_id: string;
    parent_module_id: string | null;
    order_index: number;
    is_active: boolean;
    is_released: boolean;
    release_date: string | null;
    created_at: string;
    updated_at: string | null;
    children?: ModuleWithChildren[];
}

export interface Content {
    id: string;
    title: string;
    module_id: string;
    order_index: number;
    content_type: 'video' | 'text' | 'quiz' | 'file' | 'pdf' | 'external' | 'link' | string;
    content_url?: string | null;
    video_url?: string | null;
    duration?: number | null; // Duration in seconds
    duration_seconds?: number | null; // Also support duration_seconds from DB
    is_preview?: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
}

export interface ModuleWithContents extends ModuleWithChildren {
    contents?: Content[];
}
