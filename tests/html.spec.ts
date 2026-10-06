import { test, expect } from '@playwright/test';
import { routes } from './routes';

// Grundhygiene, die Zod nicht sieht: genau eine h1, Meta-Description, lang-Attribut, keine leeren Links.
for (const route of routes) {
  test(`html-hygiene: ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('lang', /.+/);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc?.length ?? 0).toBeGreaterThanOrEqual(50);
    expect(await page.locator('a:not([href]), a[href=""], a[href="#"]').count()).toBe(0);
  });
}
