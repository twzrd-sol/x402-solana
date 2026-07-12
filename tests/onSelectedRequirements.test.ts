/**
 * Tests for the onSelectedRequirements pre-sign hook.
 *
 * Verifies the hook fires after a Solana requirement is selected and
 * amount-checked but BEFORE signing, and that throwing from it aborts payment
 * with zero wallet signer invocations.
 */

import type { VersionedTransaction } from '@solana/web3.js';
import { createX402Client } from '../src/client';
import type { WalletAdapter, SelectedRequirementsContext } from '../src/types';
import { createV2PaymentRequiredResponse, v2PaymentRequired } from './fixtures';

/** Mock wallet that records how many times signTransaction was invoked. */
function createSignerSpyWallet(): {
  wallet: WalletAdapter;
  signerInvocationCount: () => number;
} {
  let count = 0;
  const wallet: WalletAdapter = {
    address: 'SpyWalletAddress1234567890123456789012345678',
    publicKey: {
      toString: () => 'SpyWalletAddress1234567890123456789012345678',
      toBase58: () => 'SpyWalletAddress1234567890123456789012345678',
    } as WalletAdapter['publicKey'],
    signTransaction: async (tx: VersionedTransaction): Promise<VersionedTransaction> => {
      count += 1;
      return tx;
    },
  };
  return { wallet, signerInvocationCount: () => count };
}

describe('onSelectedRequirements pre-sign hook', () => {
  it('is optional — client constructs without it', () => {
    const { wallet } = createSignerSpyWallet();
    const client = createX402Client({ wallet, network: 'solana-devnet' });
    expect(typeof client.fetch).toBe('function');
  });

  it('fires with the selected requirement before signing, and throwing aborts with zero signer invocations', async () => {
    const { wallet, signerInvocationCount } = createSignerSpyWallet();
    let received: SelectedRequirementsContext | undefined;

    const client = createX402Client({
      wallet,
      network: 'solana-devnet',
      amount: BigInt(10_000_000), // above the 1 USDC fixture amount so the amount check passes
      customFetch: async () => createV2PaymentRequiredResponse(),
      onSelectedRequirements: async (ctx) => {
        received = ctx;
        // Simulate a pre-spend BLOCK: abort before any signature is produced.
        throw new Error('blocked by policy');
      },
    });

    await expect(client.fetch('https://api.example.com/test')).rejects.toThrow(
      'blocked by policy',
    );

    // The hook observed the real selected requirement, pre-sign.
    expect(received).toBeDefined();
    expect(received!.selectedRequirements.payTo).toBe(v2PaymentRequired.accepts[0].payTo);
    expect(received!.paymentAmount).toBe(BigInt(v2PaymentRequired.accepts[0].amount));
    expect(received!.protocolVersion).toBe(2);
    expect(received!.resourceUrl).toBe('https://api.example.com/test');

    // And nothing was signed: strict block ⇒ signer invocation count 0.
    expect(signerInvocationCount()).toBe(0);
  });
});
