---
"x402-solana": patch
---

Optional/recommended pre-signing verification adapter for `createTwzrdBeforePaymentHook` on the existing `beforePayment` seat. A block returns `{ abort: true, reason }` so the client throws its native `Payment aborted by beforePayment hook` error. Sign path unchanged.
