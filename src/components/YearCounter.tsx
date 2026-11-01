import { useEffect, useRef, useState } from "react";

function FlipDigit({ value }: { value: string }) {
  const [state, setState] = useState({ prev: value, cur: value, n: 0 });
  if (state.cur !== value) {
    setState({ prev: state.cur, cur: value, n: state.n + 1 });
  }
  const { prev, cur, n } = state;

  return (
    <span className="flap">
      <span className="flap-half flap-top">
        <span>{cur}</span>
      </span>
      <span className="flap-half flap-bottom">
        <span>{prev}</span>
      </span>
      {n > 0 && (
        <>
          <span key={`t${n}`} className="flap-half flap-top flap-fold">
            <span>{prev}</span>
          </span>
          <span key={`b${n}`} className="flap-half flap-bottom flap-unfold">
            <span>{cur}</span>
          </span>
        </>
      )}
    </span>
  );
}

export function YearCounter({ since, label }: { since: number; label: string }) {
  const target = new Date().getFullYear() - since;
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [count, setCount] = useState(reduced ? target : 0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !ref.current) return;
    let timer: number | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        let i = 0;
        const step = () => {
          i += 1;
          setCount(i);
          // ticks slow down toward the final value
          if (i < target) timer = window.setTimeout(step, 60 + 100 * (i / target) ** 2);
        };
        timer = window.setTimeout(step, 200);
      },
      { threshold: 0.6 },
    );
    io.observe(ref.current);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [reduced, target]);

  const digits = String(count).padStart(String(target).length, "0").split("");

  return (
    <div className="year-counter" ref={ref}>
      <span className="flap-row" aria-hidden="true">
        {digits.map((d, i) => (
          <FlipDigit key={i} value={d} />
        ))}
      </span>
      <span className="year-label">
        <span className="sr-only">{target} </span>
        {label}
      </span>
    </div>
  );
}
