CREATE TABLE contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE posts (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  summary TEXT NOT NULL,
  markdown TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
