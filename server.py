import http.server

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_my_headers()
        http.server.SimpleHTTPRequestHandler.end_headers(self)

    def send_my_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")

def parse_args(args=None):
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', default=8000, type=int)
    parser.add_argument('--address', default='', type=str)
    return vars(parser.parse_args(args))

if __name__ == '__main__':
    args = parse_args()
    address = (args['address'], args['port'])
    server = http.server.HTTPServer(address, NoCacheHandler)
    server.serve_forever()
