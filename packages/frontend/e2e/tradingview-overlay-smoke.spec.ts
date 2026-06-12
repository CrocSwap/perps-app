import { expect, test } from './fixtures';

async function expectChartFrameReady(page: import('@playwright/test').Page) {
    await page.goto('/v2/trade');

    const chartFrameLocator = page.locator('#tv_chart iframe').first();
    await expect(chartFrameLocator).toBeVisible({ timeout: 30_000 });

    const chartFrame = chartFrameLocator.contentFrame();
    await expect(
        chartFrame.locator('canvas[data-name="pane-canvas"]').first(),
    ).toBeVisible({ timeout: 30_000 });

    return { chartFrame, chartFrameLocator };
}

async function readOverlayState(
    chartFrameLocator: import('@playwright/test').Locator,
) {
    return chartFrameLocator.evaluate((iframe) => {
        const iframeDoc = (iframe as HTMLIFrameElement).contentDocument;
        const paneCanvas = iframeDoc?.querySelector<HTMLCanvasElement>(
            'canvas[data-name="pane-canvas"]',
        );
        const orderOverlay =
            iframeDoc?.querySelector<HTMLCanvasElement>('#order-overlay');
        const limitPlacementOverlay =
            iframeDoc?.querySelector<HTMLCanvasElement>(
                '#limit-order-placement-overlay',
            );
        const yOverlay =
            iframeDoc?.querySelector<HTMLCanvasElement>('#y-overlay');

        return {
            paneCanvas: {
                found: Boolean(paneCanvas),
                width: paneCanvas?.width ?? 0,
                height: paneCanvas?.height ?? 0,
            },
            orderOverlay: {
                found: Boolean(orderOverlay),
                width: orderOverlay?.width ?? 0,
                height: orderOverlay?.height ?? 0,
            },
            limitPlacementOverlay: {
                found: Boolean(limitPlacementOverlay),
                width: limitPlacementOverlay?.width ?? 0,
                height: limitPlacementOverlay?.height ?? 0,
            },
            yOverlay: {
                found: Boolean(yOverlay),
                width: yOverlay?.width ?? 0,
                height: yOverlay?.height ?? 0,
            },
        };
    });
}

test.describe('TradingView overlay smoke', () => {
    test('trade chart boots local TradingView canvases and app overlays', async ({
        page,
    }) => {
        const { chartFrameLocator } = await expectChartFrameReady(page);

        await expect
            .poll(() => readOverlayState(chartFrameLocator), {
                timeout: 30_000,
            })
            .toMatchObject({
                paneCanvas: { found: true },
                orderOverlay: { found: true },
                limitPlacementOverlay: { found: true },
                yOverlay: { found: true },
            });

        const overlayState = await readOverlayState(chartFrameLocator);

        expect(overlayState.paneCanvas).toMatchObject({ found: true });
        expect(overlayState.paneCanvas.width).toBeGreaterThan(0);
        expect(overlayState.paneCanvas.height).toBeGreaterThan(0);
        expect(overlayState.orderOverlay).toMatchObject({ found: true });
        expect(overlayState.orderOverlay.width).toBeGreaterThan(0);
        expect(overlayState.orderOverlay.height).toBeGreaterThan(0);
        expect(overlayState.limitPlacementOverlay).toMatchObject({
            found: true,
        });
        expect(overlayState.yOverlay).toMatchObject({ found: true });
        expect(overlayState.yOverlay.height).toBeGreaterThan(0);
    });

    test('chart control intent can open and cancel quick-trade settings safely', async ({
        page,
    }) => {
        const { chartFrame } = await expectChartFrameReady(page);

        const quickControl = chartFrame
            .getByRole('button', { name: /^Quick$/i })
            .first();
        await expect(quickControl).toBeVisible({ timeout: 30_000 });
        await quickControl.click({ force: true });

        const quickModal = page
            .locator('[class*="modal"]')
            .filter({ hasText: /Quick Trade/i })
            .first();
        await expect(quickModal).toBeVisible();
        await expect(quickModal).toContainText(/Size/i);
        await quickModal.getByRole('button', { name: /Cancel/i }).click();
        await expect(quickModal).toBeHidden();
    });
});
