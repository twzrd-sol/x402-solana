import type { BeforePaymentContext, BeforePaymentHook } from "./types";

/**
 * Flatten x402-solana@3.0.0 `declaredResource` (v2 resource object or string)
 * to a URL string for hooks that bind on a string resource.
 */
export function adaptDeclaredResource(
  context?: Pick<BeforePaymentContext, "declaredResource"> | {
    declaredResource?: string | { url?: string };
  },
): string | undefined {
  const raw = context?.declaredResource;
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object" && "url" in raw && typeof raw.url === "string") {
    return raw.url;
  }
  return undefined;
}

type TwzrdShapedHook = (
  requirements: Parameters<BeforePaymentHook>[0],
  context?: Omit<BeforePaymentContext, "declaredResource"> & {
    declaredResource?: string;
  },
) => ReturnType<BeforePaymentHook>;

/**
 * Adapter for `createTwzrdBeforePaymentHook` (optional `twzrd-x402-gate`).
 * Does not import that package. A block must be `{ abort: true, reason }`.
 */
export function asX402SolanaBeforePayment(hook: TwzrdShapedHook): BeforePaymentHook {
  return async (requirements, context) => {
    const declaredResource = adaptDeclaredResource(context);
    const hookContext: Omit<BeforePaymentContext, "declaredResource"> & {
      declaredResource?: string;
    } = {
      requestUrl: context.requestUrl,
      responseUrl: context.responseUrl,
      protocolVersion: context.protocolVersion,
    };
    if (context.signal !== undefined) hookContext.signal = context.signal;
    if (declaredResource !== undefined) hookContext.declaredResource = declaredResource;
    const decision = await hook(requirements, hookContext);
    if (decision && decision.abort === true) {
      return decision.reason !== undefined
        ? { abort: true, reason: decision.reason }
        : { abort: true };
    }
    return;
  };
}
