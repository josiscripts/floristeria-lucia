create policy "Anyone can read hero animation frames"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'hero-animation');