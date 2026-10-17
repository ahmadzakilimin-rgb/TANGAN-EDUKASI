# Deploy Tangan Edukasi ke Vercel

## Database Daily Activity and admin account

Daily Activity uses Neon Postgres on Vercel. The API creates the `clean_logs` table automatically on its first request. The equivalent schema is in `database/schema.postgres.sql`. Public visitors can view and export records; creating or deleting records requires the admin login.

1. Create a Neon project and database.
2. Copy the database connection string from Neon.
3. In the Vercel project, open **Settings → Environment Variables**.
4. Add `DATABASE_URL` with the Neon connection string for Production, Preview, and Development as needed. Keep it server-only; do not add a `VITE_` prefix.
5. In the same Vercel environment-variable settings, set:
   - `ADMIN_USERNAME`: the admin login name.
   - `ADMIN_PASSWORD`: a unique password with at least 16 characters.
   - `ADMIN_SESSION_SECRET`: a random secret of at least 32 characters. Generate one locally with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`.
6. Redeploy the Vercel project.

Do not use a `VITE_` prefix for any of these values, and do not commit them to GitHub. The admin session is stored in an HttpOnly, Secure, SameSite cookie and expires after eight hours. Local/XAMPP builds continue to use the existing PHP endpoint.

## GitHub and Vercel

1. Push this project, including `package-lock.json`, to a GitHub repository.
2. In Vercel, import that repository as a new project.
3. Set the project name to `tanganedukasi` if that Vercel domain is available.
4. Deploy with the detected Vite settings: build command `npm run build` and output directory `dist`.
5. Add all four Vercel environment variables described above, then redeploy.

The Vercel project name determines the default `*.vercel.app` address; a custom domain can be attached in Vercel project settings.
