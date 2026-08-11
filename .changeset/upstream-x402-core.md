---
"x402-solana": minor
---

Replace the `@payai/x402` dependency with upstream `@x402/core`, pinned to `2.21.0`.

`@payai/x402` was a re-publish of upstream `@x402/core` from the now-abandoned PayAI x402 fork,
and this package was pinned to a months-old `^2.2.4`. All protocol type imports
(`@payai/x402/types`) and `safeBase64Decode` (`@payai/x402/utils`) now resolve to the equivalent
`@x402/core` subpath exports; no public API of `x402-solana` changes. `@payai/facilitator` is
unaffected and remains the JWT auth dependency for the PayAI facilitator - it already declares
`@x402/core` as its optional peer.
