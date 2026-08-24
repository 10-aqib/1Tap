# 1Tap

**Share instantly. No accounts.**

1Tap is an instant cross-device sharing application that allows users to temporarily connect devices and share text, links, and files without creating an account.

## Features

- **Instant Temporary Rooms**: Create a secure room with a 6-digit code or shareable URL.
- **No Accounts Required**: Connect and share instantly.
- **Real-Time Sync**: Text, links, and files appear instantly across all connected devices using Supabase Realtime.
- **File Sharing**: Upload and download files up to 100MB directly to secure storage.
- **Device Presence**: See how many devices are connected in real-time.
- **Auto-Expiration**: Rooms expire automatically after a set duration (15m, 30m, 1h, 24h) for security and privacy.

## Tech Stack

- **Frontend**: React, Vite, TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **Backend & Database**: Supabase (PostgreSQL, Realtime, Storage)
- **Deployment**: Vercel (Frontend), Supabase (Backend)

## Local Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd dropshare
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add your Supabase credentials (see `.env.example`):
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Supabase Setup

1. **Create a Supabase Project**: Go to [Supabase](https://supabase.com/) and create a new project.
2. **Run Migrations**: 
   - Go to the SQL Editor in your Supabase Dashboard.
   - Run the SQL script found in `supabase/migrations/20240101000000_initial_schema.sql` to create the tables, storage bucket, and RLS policies.
3. **Configure Cleanup (Cron Job)**:
   - Run the script in `supabase/migrations/20240101000001_cleanup_cron.sql` to schedule automatic room expiration and deletion.
   - *Alternative*: If `pg_cron` is not supported on your tier, deploy the Edge Function found in `supabase/functions/cleanup/index.ts` and set up a Cron Trigger via the Supabase Dashboard.
4. **Configure Realtime**: Ensure Realtime is enabled for the `room_items` table (this is handled by the migration script).

## Run Locally

Start the Vite development server:
```bash
npm run dev
```

## Production Build

Build the application for production:
```bash
npm run build
```

## Deployment

### Vercel
1. Connect your GitHub repository to Vercel.
2. In the Vercel project settings, add the following Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy! Vercel will automatically build and deploy your app.
