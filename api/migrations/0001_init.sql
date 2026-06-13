-- api/migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  avatar_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS surveys (
  id            TEXT PRIMARY KEY,
  owner_id      TEXT NOT NULL REFERENCES users(id),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  primary_color TEXT NOT NULL DEFAULT '#6366f1',
  logo_url      TEXT NOT NULL DEFAULT '',
  is_published  INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS questions (
  id        TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  type      TEXT NOT NULL CHECK(type IN ('short_text','multiple_choice','rating')),
  label     TEXT NOT NULL,
  required  INTEGER NOT NULL DEFAULT 0,
  position  INTEGER NOT NULL,
  options   TEXT NOT NULL DEFAULT '[]'  -- JSON array, only used for multiple_choice
);

CREATE TABLE IF NOT EXISTS responses (
  id           TEXT PRIMARY KEY,
  survey_id    TEXT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  answers      TEXT NOT NULL,  -- JSON: { [questionId]: string | number }
  submitted_at INTEGER NOT NULL DEFAULT (unixepoch())
);
