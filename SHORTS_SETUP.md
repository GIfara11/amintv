# AMIN TV Shorts

## Vercel setup

1. In the existing Vercel project, create a Blob store and connect it to the project.
2. Add `SHORTS_ADMIN_PASSWORD` in Project Settings > Environment Variables. Use at least 24 random characters.
3. Add `ADMIN_SESSION_SECRET` in Project Settings > Environment Variables. Use a different 32+ character random value.
4. Deploy this directory to the existing `amintv.ru` project.

Vercel creates `BLOB_READ_WRITE_TOKEN` automatically when the Blob store is connected.

## Usage

- Public feed: `https://amintv.ru/shorts.html`
- Admin page: `https://amintv.ru/amin-control-9f4c2b7a.html`

Supported formats: MP4, WebM, MOV. Maximum file size: 500 MB.

The admin page uploads video directly to Vercel Blob. The API stores public metadata under
`shorts/meta/`, and `/api/shorts` builds the public feed from those records.

Admin login is rate-limited to 8 attempts per IP per 60 minutes.
