import { SigningKey } from "../crypto/index";
import type { Provider } from "../providers/index";
import { BaseEip155Wallet } from "./base-wallet-eip155";

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
export class Eip155Wallet extends BaseEip155Wallet {

    /**
     *  Create a new wallet for the %%privateKey%%, optionally connected
     *  to %%provider%%.
     */
    constructor(key: string | SigningKey, provider?: null | Provider) {
        if (typeof(key) === "string" && !key.startsWith("0x")) {
            key = "0x" + key;
        }

        const signingKey = (typeof(key) === "string") ? new SigningKey(key): key;
        super(signingKey, provider);
    }

    connect(provider: null | Provider): Eip155Wallet {
        return new Eip155Wallet(this.signingKey, provider);
    }
}
