#!/usr/bin/env python3
"""
Simple HTTP server to serve the OnTimely website locally
Run with: python3 serve-local.py
Then visit: http://localhost:8080
"""

import http.server
import socketserver
import os
import sys

# Change to the website directory
os.chdir(os.path.join(os.path.dirname(__file__), 'website'))

PORT = 8080

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for iframe embedding
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_GET(self):
        # Handle routing for help page
        if self.path == '/help':
            self.path = '/help.html'
        elif self.path == '/about':
            self.path = '/about.html'
        elif self.path == '/status':
            self.path = '/status.html'
        elif self.path == '/':
            self.path = '/index.html'
        
        return super().do_GET()

if __name__ == "__main__":
    try:
        with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
            print(f"🚀 Serving OnTimely website at http://localhost:{PORT}")
            print(f"📁 Serving from: {os.getcwd()}")
            print(f"🔗 Help page: http://localhost:{PORT}/help")
            print(f"🔗 About page: http://localhost:{PORT}/about")
            print("Press Ctrl+C to stop the server")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
        sys.exit(0)
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use. Please stop the existing server or use a different port.")
        else:
            print(f"❌ Error starting server: {e}")
        sys.exit(1)
