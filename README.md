# Tangan Edukasi Indonesia

Website Tangan Edukasi Indonesia, built with React and Vite. The Daily Activity dashboard stores shared records in Neon Postgres and protects write operations with an admin login when deployed on Vercel.

## Run locally

```sh
npm install
npm run dev
```

Build the site with `npm run build`.

## Deploy to Vercel

Import this GitHub repository into Vercel. Use the Vite build command `npm run build` and output directory `dist`. Add these server-only environment variables in the Vercel project settings:

- `DATABASE_URL`: Neon Postgres connection string.
- `ADMIN_USERNAME`: admin login name.
- `ADMIN_PASSWORD`: unique password of at least 16 characters.
- `ADMIN_SESSION_SECRET`: random secret of at least 32 characters.

Never commit these credentials or use a `VITE_` prefix for them. See [VERCEL_SETUP.md](./VERCEL_SETUP.md) for full setup instructions.
