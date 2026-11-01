import { useEffect } from "react";
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

export function BlogPost() {
  const { slug } = useParams();
  const post = allPosts.find((p) => p.slug === slug);

  useEffect(() => {
    document.title = post
      ? `${post.title} · ${identity.name}`
      : `Not found · ${identity.name}`;
  }, [post]);

  return (
    <>
      <Backdrop />
      <Nav onBlog />

      <main>
        <section className="section">
          <div className="section-inner">
            {post ? (
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
