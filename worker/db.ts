// Values are bound parameters on prepared statements. They are never
// concatenated into the SQL text.

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export interface StoredPost {
  slug: string;
  title: string;
  date: string;
  summary: string;
  markdown: string;
  updated_at: string;
}

export async function insertContactMessage(
  db: D1Database,
  name: string,
  email: string,
  message: string,
): Promise<void> {
  await db
    .prepare("INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)")
    .bind(name, email, message)
    .run();
}

export async function listContactMessages(db: D1Database): Promise<ContactMessage[]> {
  const result = await db
    .prepare(
      "SELECT id, name, email, message, created_at FROM contact_messages ORDER BY id DESC LIMIT 200",
    )
    .all<ContactMessage>();
  return result.results;
}

export async function listPosts(db: D1Database): Promise<StoredPost[]> {
  const result = await db
    .prepare(
      "SELECT slug, title, date, summary, markdown, updated_at FROM posts ORDER BY date DESC, slug ASC LIMIT 100",
    )
    .all<StoredPost>();
  return result.results;
}

export async function getPost(db: D1Database, slug: string): Promise<StoredPost | null> {
  return db
    .prepare(
      "SELECT slug, title, date, summary, markdown, updated_at FROM posts WHERE slug = ?",
    )
    .bind(slug)
    .first<StoredPost>();
}

export async function savePost(
  db: D1Database,
  post: {
    slug: string;
    title: string;
    date: string;
    summary: string;
    markdown: string;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO posts (slug, title, date, summary, markdown, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(slug) DO UPDATE SET
         title = excluded.title,
         date = excluded.date,
         summary = excluded.summary,
         markdown = excluded.markdown,
         updated_at = excluded.updated_at`,
    )
    .bind(post.slug, post.title, post.date, post.summary, post.markdown)
    .run();
}

export async function deletePost(db: D1Database, slug: string): Promise<void> {
  await db.prepare("DELETE FROM posts WHERE slug = ?").bind(slug).run();
}
