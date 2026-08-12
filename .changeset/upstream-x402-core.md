---
"x402-solana": major
---

Replace the `@payai/x402` dependency with upstream `@x402/core`, pinned to `2.21.0`.

`@payai/x402` was a re-publish of upstream `@x402/core` from the now-abandoned PayAI x402 fork,
and this package was pinned to a months-old `^2.2.4`. All protocol type imports
(`@payai/x402/types`) and `safeBase64Decode` (`@payai/x402/utils`) now resolve to the equivalent
`@x402/core` subpath exports.

`x402-solana`'s own functions, classes and signatures are unchanged. **However, the protocol types
re-exported from `x402-solana/types` come straight from upstream, and four of them changed shape
between `2.2.4` and `2.21.0`.** Code that only calls this package's API is unaffected; code that
imports these types directly may need edits.

### Breaking: re-exported protocol types

- **`VerifyRequest` and `SettleRequest` gained a required `x402Version: number`.** If you build
  these objects yourself, add the field. This matches what the facilitator has always required on
  the wire.
- **`PaymentPayload.resource` is now optional** (`resource?: ResourceInfo`). Reading it yields
  `ResourceInfo | undefined`; guard before dereferencing.
- **`ResourceInfo.description` and `ResourceInfo.mimeType` are now optional**, and the type gained
  optional `serviceName`, `tags` and `iconUrl`. This cascades into `PaymentRequired["resource"]`
  and therefore into `BeforePaymentContext.declaredResource` — a `beforePayment` hook reading
  `declaredResource.description` now gets `string | undefined`.

These are upstream corrections rather than regressions: a facilitator may legitimately omit all
three fields, so the old required-everywhere types were overstating what arrives at runtime. They
are deliberately **not** papered over with compatibility aliases, which would keep downstream code
compiling while leaving it wrong at runtime.

`PaymentRequirements`, `Network`, `Money`, `Price`, `AssetAmount`, `VerifyResponse`,
`SettleResponse` and `SupportedResponse` are unchanged in both directions.

`@payai/facilitator` is unaffected and remains the JWT auth dependency for the PayAI facilitator -
it already declares `@x402/core` as its optional peer.
