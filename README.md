# Diary of Us

A couples journal PWA – dark mode, dashboard widgets, Notion-style pages, and optional cloud sync with Supabase.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser. The app works **without Supabase** (pages and widgets are stored in the browser). To save in the cloud and share with your partner, set up Supabase below.

## Supabase setup (optional)

1. **Create a project** at [supabase.com](https://supabase.com) → New project. Note your **Project URL** and **anon public** key (Project Settings → API).

2. **Copy env file** and add your keys:
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon public key  

3. **Run the database schema** in Supabase: Dashboard → SQL Editor → New query. Paste the contents of `supabase/schema.sql` and run it. This creates `journals`, `journal_members`, `pages`, and `widgets` with RLS.

4. **Restart the dev server** (`npm run dev`). You’ll see a sign-in screen. Create an account; you’ll get a **journal** and an **invite code** in the sidebar. Share the code with your partner so they can “Join with code” and use the same journal.

## Install on your phone (PWA)

The app is a Progressive Web App: you can add it to your home screen and use it like a native app.

**On iPhone (Safari):** Open the app in Safari → tap the **Share** button (square with arrow) → **Add to Home Screen** → name it “Diary of Us” → Add.

**On Android (Chrome):** Open the app → menu (⋮) → **Install app** or **Add to Home screen**.

When offline, the app will show the last loaded screen; new data syncs when you’re back online.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
