---
"x402-solana": minor
---

Add optional `onSelectedRequirements` pre-sign hook to the client. It fires after a Solana payment requirement is selected and amount-checked but before the wallet signs, enabling observability or pre-spend policy checks. Throwing from the hook aborts payment before any signature is produced. Fully backward-compatible: the hook is optional and no default behavior changes.
