import { expect, test } from './fixtures';

test.describe('table and form regressions', () => {
    test('trade route keeps no-wallet order form in a guarded state', async ({
        page,
    }) => {
        await page.goto('/v2/trade');

        await expect(page.getByRole('main')).toContainText(/Market|Limit/i);
        await expect(
            page.getByRole('textbox', { name: /Enter Size/i }),
        ).toBeVisible();
        await expect(page.getByLabel(/Leverage amount/i)).toBeVisible();
        await expect(
            page.getByRole('heading', { name: /Reduce Only/i }),
        ).toBeVisible();
        await expect(page.getByRole('switch').first()).toHaveAttribute(
            'aria-checked',
            'false',
        );
        await expect(page.getByTestId('submit-order-button')).toHaveCount(0);
        await expect(page.locator('body')).not.toContainText(
            /Something went wrong|Unable to load page/i,
        );
    });

    test('order form reduce-only toggle starts in a safe default state', async ({
        page,
    }) => {
        await page.goto('/v2/trade');

        const reduceOnly = page.getByRole('switch').first();
        await expect(reduceOnly).toHaveAttribute('aria-checked', 'false');
    });

    test('protected portfolio table state stays disconnected without wallet session', async ({
        page,
    }) => {
        await page.goto('/v2/portfolio');

        await expect(page.getByRole('main')).toContainText(
            /Connect to View Your Portfolio/i,
        );
        await expect(page.locator('body')).not.toContainText(
            /Something went wrong|Unable to load page/i,
        );
    });
});
