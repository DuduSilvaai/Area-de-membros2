import { Tables } from './supabase';

export type ActionResponse<T = void> = {
    data?: T;
    error?: string;
};

export type EnrollmentWithPortal = Tables<'enrollments'> & {
    portals: Pick<Tables<'portals'>, 'id' | 'name' | 'image_url'> | null;
};

export type UserWithProfile = {
    id: string;
    email?: string;
    user_metadata: {
        name?: string;
        role?: string;
        avatar_url?: string;
        [key: string]: any;
    };
    app_metadata: {
        provider?: string;
        [key: string]: any;
    };
    last_sign_in_at?: string;
    created_at: string;
    banned_until?: string | null;
} & {
    profile?: Tables<'profiles'> | null;
};
