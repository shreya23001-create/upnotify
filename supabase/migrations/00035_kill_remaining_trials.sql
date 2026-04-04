-- Kill any remaining trialing subscriptions (cleanup after removing trial creation from auth callback)
UPDATE subscriptions SET status = 'canceled', canceled_at = now()
WHERE status = 'trialing';
