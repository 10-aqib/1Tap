-- Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup function to run every minute
SELECT cron.schedule(
  'cleanup_expired_rooms_job',
  '* * * * *',
  $$
    SELECT public.cleanup_expired_rooms();
  $$
);
