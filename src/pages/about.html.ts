export function GET() {
  return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta http-equiv="refresh" content="0;url=/"/><link rel="canonical" href="https://anwarxahid.github.io/"/><title>Anwar Zahid</title></head><body><a href="/">Continue to the homepage</a></body></html>', {
    headers: {'Content-Type': 'text/html; charset=utf-8'},
  });
}
