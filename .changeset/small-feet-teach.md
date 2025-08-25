---
"abstraxion-dashboard": patch
---

- Treasury Strategy Pattern: Implemented configurable strategy pattern for loading
  treasury configurations with three strategies:
  - DaoDao Strategy: Fetches from DaoDao indexer API with 10-minute TTL caching
  - Direct Query Strategy: Legacy approach querying blockchain directly
  - Composite Strategy (default): DaoDao with automatic fallback to Direct Query
- Performance Improvements: Treasury config loading now ~48% faster (615ms vs
  1196ms) through:
  - Optimized single API call to /all endpoint (previously 2 separate calls)
  - In-memory caching with 10-minute TTL reducing redundant API calls
  - 30-second timeout protection preventing hanging requests
- Configuration: New VITE_TREASURY_STRATEGY environment variable to control strategy
  selection
- Comprehensive Testing: Added 22 tests covering all strategies and edge cases
