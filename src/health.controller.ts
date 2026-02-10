import { Controller, Get, Header } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  @Header('Content-Type', 'text/html')
  root() {
    const timestamp = new Date().toISOString();
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Exam Adda API</title>
    <style>
      :root { color-scheme: light; }
      body { margin: 0; font-family: Arial, sans-serif; background: #f5f7ff; color: #0f172a; }
      .wrap { max-width: 720px; margin: 64px auto; padding: 32px; background: #fff; border-radius: 16px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12); }
      h1 { margin: 0 0 8px; }
      .pill { display: inline-block; padding: 6px 12px; border-radius: 999px; background: #2563eb; color: #fff; font-weight: 600; font-size: 12px; }
      ul { padding-left: 18px; }
      code { background: #eef2ff; padding: 2px 6px; border-radius: 6px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <span class="pill">API RUNNING</span>
      <h1>Exam Adda API</h1>
      <p>Status: <strong>OK</strong></p>
      <p>Timestamp: ${timestamp}</p>
      <p>Base URL: <code>/api</code></p>
      <h3>Auth Routes</h3>
      <ul>
        <li><code>POST /api/auth/register</code></li>
        <li><code>POST /api/auth/login</code></li>
      </ul>
      <h3>Institute Routes</h3>
      <ul>
        <li><code>POST /api/institutes</code></li>
        <li><code>GET /api/institutes/me</code></li>
      </ul>
    </div>
  </body>
</html>`;
  }

  @Get('api')
  apiRoot() {
    return {
      message: 'API is running',
      routes: ['/api/auth/login', '/api/auth/register', '/api/institutes'],
    };
  }
}
