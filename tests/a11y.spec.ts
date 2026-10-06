import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { routes } from './routes';

// Automatisierte Barrierefreiheitsprüfung (axe-core, WCAG 2.2 A/AA). Deckt nur einen Teil ab;
// Tastatur, Screenreader und Reflow bleiben manuelle Prüfung (accessibility-inspect).
for (const route of routes) {
  test(`axe: ${route}`, async ({ page }) => {
    await page.goto(route);
    // Alle FAQ-Akkordeons öffnen, damit auch verborgener Inhalt geprüft wird.
    await page.locator('details').evaluateAll((els) => els.forEach((d) => d.setAttribute('open', '')));
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}

test('Skip-Link ist erstes fokussierbares Element', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveText(/Zum Inhalt/);
});
