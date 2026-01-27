// ============================================================================
// GRID CALCULATION UTILITIES
// Shared grid calculation functions for presets
// ============================================================================

/**
 * Calculates the number of grid rows based on total dots and columns
 * Ensures all dots are distributed across the grid
 * @param totalDots - Total number of dots to distribute
 * @param gridCols - Number of columns in the grid
 * @returns Number of rows needed
 * @example
 * calculateGridRows(1024, 48) // Returns 21 rows (48 * 21 = 1008 positions)
 * calculateGridRows(1024, 32) // Returns 32 rows (32 * 32 = 1024 positions)
 */
export function calculateGridRows(totalDots: number, gridCols: number): number {
    return Math.floor(totalDots / gridCols);
}

/**
 * Calculates grid position (col, row) from a linear dot index
 * @param index - Linear index of the dot (0 to totalDots-1)
 * @param gridCols - Number of columns in the grid
 * @returns Object with col and row coordinates
 * @example
 * getGridPosition(0, 48) // Returns { col: 0, row: 0 } (top-left)
 * getGridPosition(49, 48) // Returns { col: 1, row: 1 } (second row, second column)
 * getGridPosition(100, 48) // Returns { col: 4, row: 2 } (third row, fifth column)
 */
export function getGridPosition(
    index: number,
    gridCols: number,
): { col: number; row: number } {
    return {
        col: index % gridCols,
        row: Math.floor(index / gridCols),
    };
}
