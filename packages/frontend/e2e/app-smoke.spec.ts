import { expect, test } from './fixtures';

const routes = [
    { path: '/', expected: /Decentralized Trading Protocol/i },
    { path: '/v2/trade', expected: /BTC|Order book|Market|Limit/i },
    { path: '/v2/portfolio', expected: /Connect to View Your Portfolio/i },
    { path: '/v2/referrals', expected: /Referrals/i },
    { path: '/v2/vaults', expected: /Vaults/i },
    { path: '/v2/agents', expected: /Agents/i },
    { path: '/v2/more', expected: /Links/i },
    { path: '/v2/privacy', expected: /Privacy Policy/i },
    { path: '/v2/terms', expected: /Terms of Service/i },
    { path: '/v2/definitely-not-a-real-route', expected: /Page Not Found/i },
];

test.describe('browser smoke routes', () => {
    for (const route of routes) {
        test(`${route.path} renders without runtime failures`, async ({
            page,
        }) => {
            await page.goto(route.path);

            await expect(page.getByRole('main')).toBeVisible();
            await expect(page.getByRole('main')).toContainText(route.expected);
            await expect(page.locator('body')).not.toContainText(
                /Something went wrong|Unable to load page/i,
            );
        });
    }
});
