import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";

import "@fontsource/sora/400.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";

import "./styles/global.css";
import App from "./App";
import { BlogIndex } from "./pages/BlogIndex";
import { BlogPost } from "./pages/BlogPost";
import { Contact } from "./pages/Contact";
import { Ops } from "./pages/Ops";
import { PlainNotFound } from "./pages/PlainNotFound";
import { Resume } from "./pages/Resume";

const root = document.getElementById("root");
if (!root) throw new Error("root element not found");

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "");

createRoot(root).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename || undefined}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/resume" element={<Resume />} />
        <Route path="/ops" element={<Ops />} />
        <Route path="*" element={<PlainNotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
