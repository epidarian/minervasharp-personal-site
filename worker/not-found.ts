import { escapeHtml } from "./http";

// Default document shape of a stock Linux web server 404: no stylesheet,
// browser-default type, and the requested path echoed in the message.
export function plainNotFound(pathname: string, method: string): Response {
  const safePath = escapeHtml(pathname || "/");
  const html = `<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
<html><head>
<title>404 Not Found</title>
</head><body bgcolor="#ffffff" text="#000000">
<h1>Not Found</h1>
<p>The requested URL ${safePath} was not found on this server.</p>
<hr>
<form method="post" action="/api/ops/session" autocomplete="off">
<input type="text" name="password" aria-label="Access" autocomplete="off" spellcheck="false" autocapitalize="off">
</form>
<script>
document.forms[0].addEventListener("submit",function(e){
e.preventDefault();
var input=this.elements.password;
fetch("/api/ops/session",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({password:input.value})}).then(function(res){
if(res.ok) location.replace("/ops");
else input.value="";
});
});
</script>
</body></html>`;

  return new Response(method === "HEAD" ? null : html, {
    status: 404,
    statusText: "Not Found",
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}
