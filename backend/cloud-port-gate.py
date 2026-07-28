#!/usr/bin/env python3
"""Public PORT gate for Render free tier.

While Spring is still booting on INTERNAL_PORT, accept connections on PUBLIC_PORT and:
  - GET /actuator/health(/...) -> HTTP 200 (so Render does not kill the deploy)
  - anything else -> HTTP 503

Once Spring health is UP, transparent TCP/HTTP proxy to 127.0.0.1:INTERNAL_PORT.
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


def spring_health_up() -> bool:
    try:
        conn = http.client.HTTPConnection("127.0.0.1", INTERNAL_PORT, timeout=2)
        conn.request("GET", "/actuator/health")
        resp = conn.getresponse()
        body = resp.read(256).decode("utf-8", errors="ignore")
        conn.close()
        return resp.status == 200 and "UP" in body
    except OSError:
        return False


def wait_until_ready() -> None:
    while not spring_health_up():
        time.sleep(POLL_SECONDS)
    READY.set()
    print(f"cloud-port-gate: Spring ready on {INTERNAL_PORT}; proxying all traffic", flush=True)


class StartupHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt: str, *args) -> None:  # noqa: A003
        print(f"cloud-port-gate: {self.address_string()} - {fmt % args}", flush=True)

    def do_GET(self) -> None:  # noqa: N802
        path = self.path.split("?", 1)[0]
        if path == "/actuator/health" or path.startswith("/actuator/health/"):
            body = b'{"status":"UP","components":{"cloudGate":{"status":"UP","details":{"spring":"starting"}}}}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Connection", "close")
            self.end_headers()
            self.wfile.write(body)
            return

        body = b'{"status":"STARTING","message":"Spring Boot still booting"}'
        self.send_response(503)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(body)

    def do_HEAD(self) -> None:  # noqa: N802
        path = self.path.split("?", 1)[0]
        code = 200 if path.startswith("/actuator/health") else 503
        self.send_response(code)
        self.send_header("Content-Length", "0")
        self.send_header("Connection", "close")
        self.end_headers()

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Connection", "close")
        self.end_headers()


def pipe(a: socket.socket, b: socket.socket) -> None:
    try:
        while True:
            r, _, _ = select.select([a, b], [], [], 60)
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
        try:
            a.shutdown(socket.SHUT_RDWR)
        except OSError:
            pass
        try:
            b.shutdown(socket.SHUT_RDWR)
        except OSError:
            pass


class ProxyHandler(socketserver.BaseRequestHandler):
    def handle(self) -> None:
        client: socket.socket = self.request
        upstream = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            upstream.settimeout(30)
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
            print(f"cloud-port-gate: upstream error: {exc}", flush=True)
        finally:
            try:
                upstream.close()
            except OSError:
                pass
            try:
                client.close()
            except OSError:
                pass


class ThreadingTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main() -> None:
    print(
        f"cloud-port-gate: listening on 0.0.0.0:{PUBLIC_PORT} "
        f"(startup health until Spring :{INTERNAL_PORT} is UP)",
        flush=True,
    )
    threading.Thread(target=wait_until_ready, name="wait-spring", daemon=True).start()

    # Phase 1: HTTP stub until READY
    httpd = ThreadingHTTPServer(("0.0.0.0", PUBLIC_PORT), StartupHandler)
    httpd.timeout = 0.5

    while not READY.is_set():
        httpd.handle_request()

    httpd.server_close()
    # Brief pause so the OS releases PUBLIC_PORT before rebinding as TCP proxy.
    time.sleep(0.3)

    # Phase 2: raw TCP proxy (HTTP/1.1 keep-alive + websockets-safe enough for API)
    with ThreadingTCPServer(("0.0.0.0", PUBLIC_PORT), ProxyHandler) as server:
        print(f"cloud-port-gate: TCP proxy active on {PUBLIC_PORT}", flush=True)
        server.serve_forever()


if __name__ == "__main__":
    main()
