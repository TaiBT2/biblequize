-- Repeatable seed to ensure default admin(s)
-- Set your default admin email(s) here. Safe to run multiple times.

-- Example: primary admin
UPDATE users SET role = 'ADMIN' WHERE email = 'thanhtai18021994@gmail.com';

-- Optionally, add more admins:
-- UPDATE users SET role = 'ADMIN' WHERE email = 'another-admin@example.com';


