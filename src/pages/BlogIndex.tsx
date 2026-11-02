import { useEffect, useState } from "react";
import { Link } from "react-router";
import { allPosts } from "content-collections";
import { Backdrop } from "../components/Backdrop";
import { Nav } from "../components/Nav";
import { Grain } from "../effects/Grain";
import { identity } from "../content/resume";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateFormat.format(parsed);
}

interface LivePost {
  slug: string;
  title: string;
  date: string;
  summary: string;
}

export function BlogIndex() {
  useEffect(() => {
    document.title = `Blog · ${identity.name}`;
  }, []);

  const [live, setLive] = useState<LivePost[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/posts")
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { posts?: LivePost[] } | null) => {
        if (!cancelled && body?.posts) setLive(body.posts);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const bySlug = new Map<string, LivePost>();
  for (const post of allPosts) bySlug.set(post.slug, post);
  for (const post of live) bySlug.set(post.slug, post);
  const posts = [...bySlug.values()].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <Backdrop />
      <Nav page="blog" />

      <main>
        <section className="section">
          <div className="section-inner is-wide">
            <p className="eyebrow">// BLOG</p>
            <h1 className="section-title">Writing</h1>

            {posts.length === 0 ? (
              <p className="blog-empty">No posts yet.</p>
            ) : (
              <ul className="blog-list">
                {posts.map((post) => (
                  <li key={post.slug} className="blog-list-item">
                    <Link to={`/blog/${post.slug}`} className="blog-list-link">
                      <h2 className="blog-list-title">{post.title}</h2>
                      <time className="blog-list-date" dateTime={post.date}>
                        {formatDate(post.date)}
                      </time>
                      <p className="blog-list-summary">{post.summary}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <footer className="footer">
          <p>{identity.nameMark}</p>
          <p className="footer-dim">
            &copy; {new Date().getFullYear()} {identity.name} ·{" "}
            {identity.location}
          </p>
        </footer>
      </main>

      <Grain />
    </>
  );
}
