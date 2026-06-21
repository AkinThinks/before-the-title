# Before the Title

An ongoing participatory art project about who people were before roles,
resumes, titles, and public identity. Participants answer one reflective prompt,
receive a personal artwork, and can submit it for curation into the public
archive and future project materials.

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and fill in the values.

Required for production:

- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_SITE_URL`

`SUPABASE_SERVICE_ROLE_KEY` is used only in API routes. Do not expose it to
client components.

## Supabase

Run `supabase-schema.sql` in the Supabase SQL editor. The schema enables RLS and
does not create public read or update policies. Production writes, reads, image
uploads, and curation actions should go through the Next.js API routes using the
service role key.

Create a public storage bucket named `artworks` for persisted generated images.

## Curation

Submissions are created with `moderation_status = pending`. The public archive
only shows approved pieces. Use `/admin` to review, approve, reject, add notes,
and export submissions.

Set `ADMIN_PASSWORD` in production. Without it, the admin API fails closed in
production.

## Verification

```bash
npm run lint
npm run build
```
