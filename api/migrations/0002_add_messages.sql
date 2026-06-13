-- api/migrations/0002_add_messages.sql
ALTER TABLE surveys ADD COLUMN welcome_message TEXT NOT NULL DEFAULT 'We appreciate your time. This survey takes less than 2 minutes.';
ALTER TABLE surveys ADD COLUMN thank_you_message TEXT NOT NULL DEFAULT 'Thank you for your feedback!';
