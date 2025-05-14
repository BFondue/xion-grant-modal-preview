---
"abstraxion-dashboard": minor
---

Modified the URL validation to support native app URIs

The `isUrlSafe` function has been updated to allow custom protocol schemes like `myapp://` or `xion://` that are commonly used in mobile and desktop applications. This enables deep linking to native applications from the web interface.

Instead of strictly allowing only HTTP and HTTPS protocols, the function now blocks a specific list of known dangerous protocols (javascript:, data:, vbscript:, file:) while allowing all other protocols to pass through.

Tests have been updated to verify that native app URIs are properly validated as safe, while maintaining security against potentially malicious URLs.
