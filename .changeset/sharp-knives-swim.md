---
"abstraxion-dashboard": minor
---

The removed checks for `account?.id`, `client`, `redirect_uri`, and `chainInfo` were unnecessary as their presence is guaranteed elsewhere in the code or application flow. This improves code readability and eliminates redundant error handling.
