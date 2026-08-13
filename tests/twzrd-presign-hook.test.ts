/**
 * createTwzrdBeforePaymentHook-shaped hook on x402-solana@3.0.0.
 *
 * Does not import twzrd-x402-gate (optional). Locks: 3.0.0 declaredResource
 * object is flattened to .url; a block throws the native abort Error; the
 * signer is never invoked.
 */

import type { VersionedTransaction } from '@solana/web3.js';
import { createX402Client } from '../src/client';
import { createSolanaPaymentTransaction } from '../src/client/transaction-builder';
import type { BeforePaymentHook, WalletAdapter } from '../src/types';
import {
  mockWallet,
  createV2PaymentRequiredResponse,
} from './fixtures';
import {
  adaptDeclaredResource,
  asX402SolanaBeforePayment,
} from '../src/before-payment-adapter';

jest.mock('../src/client/transaction-builder', () => ({
  createSolanaPaymentTransaction: jest.fn(),
}));

const mockBuildAndSign = createSolanaPaymentTransaction as jest.MockedFunction<
  typeof createSolanaPaymentTransaction
>;

function createSpyWallet(): WalletAdapter & {
  signTransaction: jest.MockedFunction<WalletAdapter['signTransaction']>;
} {
  return {
    ...mockWallet,
    signTransaction: jest.fn(async (tx: VersionedTransaction) => tx),
  };
}

const TEST_URL = 'https://api.example.com/test';

describe('twzrd-shaped beforePayment on 3.0.0', () => {
  beforeEach(() => {
    mockBuildAndSign.mockReset();
  });

  it('flattens v2 declaredResource.url', () => {
    expect(
      adaptDeclaredResource({
        declaredResource: {
          url: 'https://api.example.com/test',
          description: 'Test endpoint',
          mimeType: 'application/json',
        },
      }),
    ).toBe('https://api.example.com/test');
    expect(adaptDeclaredResource({ declaredResource: 'https://plain.example' })).toBe(
      'https://plain.example',
    );
  });

  it('throws native Payment aborted error and does not sign', async () => {
    const wallet = createSpyWallet();
    const customFetch = jest.fn(async () => createV2PaymentRequiredResponse());

    const twzrdShaped = async (
      _requirements: unknown,
      context?: { declaredResource?: string },
    ) => {
      expect(context?.declaredResource).toBe('https://api.example.com/test');
      return {
        abort: true as const,
        reason: 'known_malicious_or_drained_paywall',
      };
    };

    const beforePayment: BeforePaymentHook = asX402SolanaBeforePayment(twzrdShaped);

    const client = createX402Client({
      wallet,
      network: 'solana-devnet',
      customFetch: customFetch as unknown as typeof fetch,
      beforePayment,
    });

    await expect(client.fetch(TEST_URL)).rejects.toThrow(
      'Payment aborted by beforePayment hook: known_malicious_or_drained_paywall',
    );
    expect(wallet.signTransaction).toHaveBeenCalledTimes(0);
    expect(mockBuildAndSign).toHaveBeenCalledTimes(0);
    expect(customFetch).toHaveBeenCalledTimes(1);
  });
});
