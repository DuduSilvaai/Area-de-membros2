# Middleware Update Instructions (Free Preview Support)

## Context
We need to allow unauthenticated access to lessons that are marked as `is_free_preview`. The current middleware redirects all unauthenticated users to `/login`.

## Logic to Implement
1.  **Detect Lesson Route**: Check if the `pathname` matches the pattern `/members/[portalId]/lesson/[lessonId]`.
2.  **Bypass Login on Match**: If the user is NOT authenticated, but the route is a lesson route:
    *   Create a Supabase client (using Service Role key if needed, or Anon key with public read access if RLS allows public `contents` read). **Recommendation**: Use `createClient` with `SUPABASE_SERVICE_ROLE_KEY` inside middleware specifically for this check to avoid exposing public read access to all contents if not desired.
    *   Query `contents` table for the `lessonId`.
    *   Check if `config->is_free_preview` is `true`.
    *   If `true`, allow the request to proceed (`return response`).
    *   If `false` or error, redirect to `/login`.

## Pseudocode / Implementation Snippet

Add this logic *before* the catch-all redirect in `middleware.ts`:

```typescript
// ... existing imports
import { createClient } from '@supabase/supabase-js';

// ... inside middleware function, after user check ...

// Check for Free Preview Lesson Access
const lessonMatch = request.nextUrl.pathname.match(/\/members\/[\w-]+\/lesson\/([\w-]+)/);
if (!user && lessonMatch) {
    const lessonId = lessonMatch[1];
    
    // Create a temporary client for this check
    // Note: Middleware edge runtime limits might apply, ensure supabase-js is compatible.
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: lesson } = await supabaseAdmin
        .from('contents')
        .select('config')
        .eq('id', lessonId)
        .single();

    const config = lesson?.config as any;
    if (config?.is_free_preview) {
        return response; // Allow data access
    }
}
```

## Security Note
Ensure that the page component (`/lesson/[lessonId]/page.tsx`) also handles unauthenticated states gracefully (e.g., hiding comments, download buttons) if `user` is null.
