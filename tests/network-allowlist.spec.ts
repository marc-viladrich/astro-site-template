import { test, expect } from '@playwright/test';
import { routes } from './routes';

// Datensparsamkeit: Die Site darf ohne Nutzerinteraktion keine Requests an fremde Hosts auslösen.
// Erlaubt sind nur eigene Origin und die hier gelisteten Hosts (z. B. Medienspeicher).
const allowed = new Set<string>([
  '127.0.0.1',
  ...(process.env.MEDIA_HOST ? [process.env.MEDIA_HOST] : []),
]);

for (const route of routes) {
  test(`keine Third-Party-Requests: ${route}`, async ({ page }) => {
    const offenders: string[] = [];
    page.on('request', (req) => {
      const host = new URL(req.url()).hostname;
      if (!allowed.has(host)) offenders.push(req.url());
    });
    await page.goto(route, { waitUntil: 'networkidle' });
    expect(offenders, `Unerlaubte Requests:\n${offenders.join('\n')}`).toEqual([]);
  });
}
