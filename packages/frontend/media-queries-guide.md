# Media Query Guidelines for Responsive Design

This guide provides standardized media query breakpoints to ensure consistent and responsive design across various devices. Follow these specifications when writing CSS to maintain uniformity in layouts for mobile, tablet, and desktop screens.

## Quick Reference

- **Mobile Portrait:** `(max-width: 599px) and (orientation: portrait)`
- **Mobile Landscape:** `(max-width: 599px) and (orientation: landscape)`
- **Tablet Portrait:** `(min-width: 600px) and (max-width: 1366px) and (orientation: portrait)`
- **Tablet Landscape:** `(min-width: 600px) and (max-width: 1366px) and (orientation: landscape)`
- **Desktop:** `(min-width: 1367px)`
- **Large Desktop:** `(min-width: 1920px)`

## Media Query Breakpoints

### 1. **Mobile Devices**

- **Mobile Portrait**
    - **CSS Query:**
        ```css
        @media (max-width: 599px) and (orientation: portrait) {
            /* Your styles here */
        }
        ```
    - **Description:** Targets mobile devices in portrait mode with a maximum width of 599px.

- **Mobile Landscape**
    - **CSS Query:**
        ```css
        @media (max-width: 599px) and (orientation: landscape) {
            /* Your styles here */
        }
        ```
    - **Description:** Targets mobile devices in landscape mode with a maximum width of 599px.

### 2. **Tablet Devices**

- **Tablet Portrait**
    - **CSS Query:**
        ```css
        @media (min-width: 600px) and (max-width: 1366px) and (orientation: portrait) {
            /* Your styles here */
        }
        ```
    - **Description:** Targets tablets in portrait mode with widths ranging from 600px to 1366px.

- **Tablet Landscape**
    - **CSS Query:**
        ```css
        @media (min-width: 600px) and (max-width: 1366px) and (orientation: landscape) {
            /* Your styles here */
        }
        ```
    - **Description:** Targets tablets in landscape mode with widths ranging from 600px to 1366px.

### 3. **Desktop Devices**

- **Standard Desktop**
    - **CSS Query:**
        ```css
        @media (min-width: 1367px) {
            /* Your styles here */
        }
        ```
    - **Description:** Targets standard desktop screens with a minimum width of 1367px.

- **Large Desktop**
    - **CSS Query:**
        ```css
        @media (min-width: 1920px) {
            /* Your styles here */
        }
        ```
    - **Description:** Targets large desktop screens with a minimum width of 1920px.

---

## Best Practices

1. **Mobile-First Approach:** Always start designing for the smallest screens first, then scale up using media queries.
2. **Consistent Naming Conventions:** Use the specified labels (e.g., `mobile-portrait`, `tablet-landscape`) in your comments to keep your code organized.
3. **Test Across Devices:** Ensure you test styles on actual devices or using responsive design tools in your browser.
4. **Use Logical Grouping:** Group related media queries together in your CSS files to improve readability.

By adhering to these guidelines, your CSS will be structured, maintainable, and optimized for a broad range of devices.
