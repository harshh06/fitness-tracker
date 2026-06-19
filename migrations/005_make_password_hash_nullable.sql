-- Migration 005: Make password_hash nullable on users table for external/social auth
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
