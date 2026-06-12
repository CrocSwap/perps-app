import { expect, test } from './fixtures';

const GLOBAL_FALLBACK_TEXT = /Something went wrong|Unable to load page/i;

test.describe('accessibility and mobile smoke', () => {
    test('desktop header and primary trade controls are keyboard focusable', async ({
        page,
    }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto('/v2/trade');

        await expect(page.getByRole('main')).toBeVisible();

        const signIn = page.getByRole('button', { name: /Sign in/i }).first();
        await signIn.focus();
        await expect(signIn).toBeFocused();

        const sizeInput = page.getByRole('textbox', {
            name: /Enter Size/i,
        });
        await sizeInput.focus();
        await expect(sizeInput).toBeFocused();

        const reduceOnly = page.getByRole('switch').first();
        await reduceOnly.focus();
        await expect(reduceOnly).toBeFocused();

        const tradeLink = page.getByRole('link', { name: /^Trade$/i }).first();
        await tradeLink.focus();
        await expect(tradeLink).toBeFocused();
        await tradeLink.press('Enter');
        await expect(page).toHaveURL(/\/v2\/trade/);

        await expect(page.locator('body')).not.toContainText(
            GLOBAL_FALLBACK_TEXT,
        );
    });

    test('settings modal opens with dialog semantics and closes from keyboard', async ({
        page,
    }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto('/v2/trade');

        const settingsButton = page
            .getByRole('button', { name: /Open settings/i })
            .first();
        await settingsButton.click();

        const dialog = page.getByRole('dialog', { name: /Settings/i });
        await expect(dialog).toBeVisible();
        await expect(
            dialog.getByRole('button', { name: /Close modal/i }),
        ).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(page.locator('body')).not.toContainText(
            GLOBAL_FALLBACK_TEXT,
        );
    });

    test('mobile trade route exposes tab navigation and footer links', async ({
        page,
    }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/v2/trade');

        await expect(page.getByRole('main')).toBeVisible();
        const tradeNavigation = page.getByRole('navigation', {
            name: /Trade navigation/i,
        });
        await expect(tradeNavigation).toBeVisible();

        const chartTab = page.getByRole('tab', { name: /Chart/i });
        await chartTab.click();
        await expect(chartTab).toHaveAttribute('aria-selected', 'true');

        const footerPortfolioLink = page
            .getByRole('link', { name: /^Portfolio$/i })
            .last();
        await expect(footerPortfolioLink).toBeVisible();
        await footerPortfolioLink.click();

        await expect(page).toHaveURL(/\/v2\/portfolio/);
        await expect(page.getByRole('main')).toContainText(
            /Connect to View Your Portfolio/i,
        );
        await expect(page.locator('body')).not.toContainText(
            GLOBAL_FALLBACK_TEXT,
        );
    });

    test('mobile protected routes remain usable without wallet session', async ({
        page,
    }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/v2/portfolio');

        await expect(page.getByRole('main')).toContainText(
            /Connect to View Your Portfolio/i,
        );
        await expect(
            page.getByRole('button', { name: /Sign in/i }).first(),
        ).toBeVisible();

        const footerTradeLink = page
            .getByRole('link', { name: /^Trade$/i })
            .last();
        await footerTradeLink.click();
        await expect(page).toHaveURL(/\/v2\/trade/);
        await expect(page.getByRole('main')).toContainText(/Market|Limit/i);
        await expect(page.locator('body')).not.toContainText(
            GLOBAL_FALLBACK_TEXT,
        );
    });
});
