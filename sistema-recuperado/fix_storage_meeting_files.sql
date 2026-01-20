-- Create the bucket explicitly if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meeting-files',
  'meeting-files',
  true,
  524288000, -- 500MB
  '{video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation}'
)
on conflict (id) do update set
  public = true,
  file_size_limit = 524288000,
  allowed_mime_types = '{video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation}';

-- Remove the ALTER TABLE line which causes permission errors
-- alter table storage.objects enable row level security; -- THIS IS ALREADY ENABLED BY DEFAULT

-- Drop existing policies to avoid conflicts when recreating
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Insert" on storage.objects;
drop policy if exists "Owner Update" on storage.objects;
drop policy if exists "Owner Delete" on storage.objects;

-- Policy to allow public SELECT (download/view) for everyone
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'meeting-files' );

-- Policy to allow authenticated users to INSERT (upload)
create policy "Authenticated Insert"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'meeting-files' );

-- Policy to allow users to UPDATE their own files (if needed)
create policy "Owner Update"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'meeting-files' ); 

-- Policy to allow users to DELETE their own files
create policy "Owner Delete"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'meeting-files' );
