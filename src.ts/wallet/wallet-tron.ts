import { SigningKey } from "../crypto";
import type { TronProvider } from "../providers";
import { BaseTronWallet } from "./base-wallet-tron";

/**
 *  A **Wallet** manages a single private key which is used to sign
 *  transactions, messages and other common payloads.
 *
 *  This class is generally the main entry point for developers
 *  that wish to use a private key directly, as it can create
 *  instances from a large variety of common sources, including
 *  raw private key, [[link-bip-39]] mnemonics and encrypte JSON
 *  wallets.
 */
export class TronWallet extends BaseTronWallet {

    /**
     *  Create a new wallet for the %%privateKey%%, optionally connected
     *  to %%provider%%.
     */
    constructor(key: string | SigningKey, provider?: null | TronProvider) {
        if (typeof(key) === "string" && !key.startsWith("0x")) {
            key = "0x" + key;
        }

        const signingKey = (typeof(key) === "string") ? new SigningKey(key): key;
        super(signingKey, provider);
    }

    connect(provider: null | TronProvider): BaseTronWallet {
        return new BaseTronWallet(this.signingKey, provider);
    }
}
