#!/usr/bin/env python3
"""Static file server for local prototype preview — no-cache on every response.

Plain `python -m http.server` lets browsers cache index.html and other
unversioned files (anything without a `?v=` query string, notably the
inline <style> block in index.html), which made edits appear not to have
applied until a hard cache-bypass was used. This server disables caching
entirely so every reload reflects the file on disk.
"""
import http.server
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    directory = sys.argv[2] if len(sys.argv) > 2 else "."
    handler = lambda *args, **kwargs: NoCacheHandler(*args, directory=directory, **kwargs)
    with http.server.ThreadingHTTPServer(("", port), handler) as httpd:
        print(f"Serving {directory} at http://localhost:{port} (no-cache)")
        httpd.serve_forever()
