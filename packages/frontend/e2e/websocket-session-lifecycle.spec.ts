import { expect, test } from './fixtures';

test.describe('websocket and session smoke', () => {
    test('trade route boots disconnected wallet state without session fallback', async ({
        page,
    }) => {
        await page.goto('/v2/trade');

        await expect(
            page.getByRole('button', { name: /Sign in/i }).first(),
        ).toBeVisible();
        await expect(page.getByRole('main')).toContainText(/Market|Limit/i);
        await expect(page.locator('body')).not.toContainText(
            /Something went wrong|Unable to load page/i,
        );
    });

    test('referrals route remains refreg-safe without wallet session', async ({
        page,
    }) => {
        await page.goto('/v2/referrals?ref=SMOKE');

        await expect(page.getByRole('main')).toContainText(/Referrals/i);
        await expect(page.locator('body')).not.toContainText(
            /connect_wallet|Something went wrong|Unable to load page/i,
        );
    });
});
