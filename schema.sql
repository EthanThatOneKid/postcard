-- Postcard Database Schema

CREATE TABLE analyses (
    id          TEXT PRIMARY KEY,
    status      TEXT NOT NULL CHECK (status IN ('QUEUED', 'PROCESSING', 'SUCCEEDED', 'FAILED')),
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    error       TEXT
);

CREATE TABLE screenshots (
    id           TEXT PRIMARY KEY,
    analysis_id  TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    filename     TEXT NOT NULL,
    content_type TEXT NOT NULL,
    data         BLOB NOT NULL,
    sha256       TEXT UNIQUE,
    created_at   TEXT NOT NULL
);

CREATE TABLE posts (
    id            TEXT PRIMARY KEY,
    analysis_id   TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    url           TEXT NOT NULL,
    platform      TEXT CHECK (platform IN ('instagram', 'twitter', 'facebook', 'other')),
    author_handle TEXT,
    author_name   TEXT,
    post_text     TEXT,
    fetched_at    TEXT NOT NULL
);

CREATE TABLE sources (
    id           TEXT PRIMARY KEY,
    analysis_id  TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    url          TEXT NOT NULL,
    title        TEXT,
    snippet      TEXT,
    domain       TEXT,
    is_vetted    INTEGER NOT NULL DEFAULT 0 CHECK (is_vetted IN (0, 1)),
    fetched_at   TEXT NOT NULL
);

CREATE TABLE judgments (
    id            TEXT PRIMARY KEY,
    analysis_id   TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    subscore_type TEXT NOT NULL CHECK (subscore_type IN ('corroboration', 'bias', 'temporal')),
    score         REAL NOT NULL CHECK (score >= 0.0 AND score <= 1.0),
    reasoning     TEXT,
    created_at    TEXT NOT NULL
);
