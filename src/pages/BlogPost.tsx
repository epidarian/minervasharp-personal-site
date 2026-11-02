import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
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
  html: string;
}

export function BlogPost() {
  const { slug } = useParams();
  const staticPost = allPosts.find((p) => p.slug === slug);
  const [livePost, setLivePost] = useState<LivePost | null>(null);
  const [checked, setChecked] = useState(Boolean(staticPost));

  useEffect(() => {
    if (!slug || staticPost) {
      setChecked(true);
      return;
    }
    let cancelled = false;
    setChecked(false);
    setLivePost(null);
    fetch(`/api/posts/${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body: LivePost | null) => {
        if (!cancelled) setLivePost(body);
      })
      .catch(() => {
        if (!cancelled) setLivePost(null);
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, staticPost]);

  const post = staticPost ?? livePost;

  useEffect(() => {
    document.title = post
      ? `${post.title} · ${identity.name}`
      : `Not found · ${identity.name}`;
  }, [post]);

  return (
    <>
      <Backdrop />
      <Nav page="blog" />

      <main>
        <section className="section">
          <div className="section-inner">
            {!checked ? (
              <p className="blog-empty">Loading…</p>
            ) : post ? (
              <article className="prose">
                <p className="eyebrow">// BLOG</p>
                <h1 className="section-title">{post.title}</h1>
                <time className="blog-post-date" dateTime={post.date}>
                  {formatDate(post.date)}
                </time>
                <div dangerouslySetInnerHTML={{ __html: post.html }} />
                <p className="blog-back">
                  <Link to="/blog">&larr; All posts</Link>
                </p>
              </article>
            ) : (
              <div className="prose">
                <p className="eyebrow">// BLOG</p>
                <h1 className="section-title">Post not found</h1>
                <p>That post does not exist.</p>
                <p className="blog-back">
                  <Link to="/blog">&larr; All posts</Link>
                </p>
              </div>
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
