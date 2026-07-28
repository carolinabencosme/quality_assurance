#!/usr/bin/env python3
"""Public PORT gate for Keycloak on Render free tier.

Render healthCheckPath is `/`. Keycloak can take several minutes before binding
HTTP (especially `start-dev` / first postgres boot). This gate:
  - listens on $PORT immediately
  - returns HTTP 200 for GET/HEAD `/` (and `/health*`) while Keycloak boots
  - proxies all traffic to 127.0.0.1:$INTERNAL_PORT once Keycloak answers HTTP
"""

from __future__ import annotations

import http.client
import os
import select
import socket
import socketserver
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PUBLIC_PORT = int(os.environ.get("PORT", "10000"))
INTERNAL_PORT = int(os.environ.get("INTERNAL_PORT", "8080"))
UPSTREAM = ("127.0.0.1", INTERNAL_PORT)
POLL_SECONDS = float(os.environ.get("CLOUD_GATE_POLL_SECONDS", "2"))
READY = threading.Event()


def keycloak_http_up() -> bool:
    try:
        conn = http.client.HTTPConnection("127.0.0.1", INTERNAL_PORT, timeout=2)
        conn.request("GET", "/")
        resp = conn.getresponse()
        resp.read(64)
        conn.close()
        return resp.status < 500
    except OSError:
        return False


def wait_until_ready() -> None:
    while not keycloak_http_up():
        time.sleep(POLL_SECONDS)
    READY.set()
    print(
        f"keycloak-port-gate: Keycloak ready on {INTERNAL_PORT}; proxying all traffic",
        flush=True,
    )


def is_health_path(path: str) -> bool:
    return path == "/" or path.startswith("/health")


class StartupHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt: str, *args) -> None:  # noqa: A003
        print(f"keycloak-port-gate: {self.address_string()} - {fmt % args}", flush=True)

    def _reply(self, code: int, body: bytes, content_type: str = "text/plain") -> None:
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        path = self.path.split("?", 1)[0]
        if is_health_path(path):
            self._reply(200, b"OK")
            return
        self._reply(
            503,
            b'{"status":"STARTING","message":"Keycloak still booting"}',
            "application/json",
        )

    def do_HEAD(self) -> None:  # noqa: N802
        path = self.path.split("?", 1)[0]
        self._reply(200 if is_health_path(path) else 503, b"")

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Connection", "close")
        self.end_headers()


def pipe(a: socket.socket, b: socket.socket) -> None:
    try:
        while True:
            r, _, _ = select.select([a, b], [], [], 120)
            if not r:
                break
            for src in r:
                dst = b if src is a else a
                data = src.recv(65536)
                if not data:
                    return
                dst.sendall(data)
    except OSError:
        pass
    finally:
        for s in (a, b):
            try:
                s.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass


class ProxyHandler(socketserver.BaseRequestHandler):
    def handle(self) -> None:
        client: socket.socket = self.request
        upstream = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            upstream.settimeout(60)
            upstream.connect(UPSTREAM)
            upstream.settimeout(None)
            client.settimeout(None)
            t1 = threading.Thread(target=pipe, args=(client, upstream), daemon=True)
            t2 = threading.Thread(target=pipe, args=(upstream, client), daemon=True)
            t1.start()
            t2.start()
            t1.join()
            t2.join()
        except OSError as exc:
            print(f"keycloak-port-gate: upstream error: {exc}", flush=True)
        finally:
            for s in (upstream, client):
                try:
                    s.close()
                except OSError:
                    pass


class ThreadingTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main() -> None:
    print(
        f"keycloak-port-gate: listening on 0.0.0.0:{PUBLIC_PORT} "
        f"(startup `/` until Keycloak :{INTERNAL_PORT} is up)",
        flush=True,
    )
    threading.Thread(target=wait_until_ready, name="wait-keycloak", daemon=True).start()

    httpd = ThreadingHTTPServer(("0.0.0.0", PUBLIC_PORT), StartupHandler)
    httpd.timeout = 0.5
    while not READY.is_set():
        httpd.handle_request()
    httpd.server_close()
    time.sleep(0.3)

    with ThreadingTCPServer(("0.0.0.0", PUBLIC_PORT), ProxyHandler) as server:
        print(f"keycloak-port-gate: TCP proxy active on {PUBLIC_PORT}", flush=True)
        server.serve_forever()


if __name__ == "__main__":
    main()
