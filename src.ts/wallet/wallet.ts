import assert from "assert";
import { SigningKey } from "../crypto/index";
import type { ProgressCallback } from "../crypto/index";
import { TransactionLike, TransactionResponse, TronProvider, TypedDataDomain, TypedDataField, computeAddress } from "../ethers";
import { AbstractSigner, Provider, TransactionRequest } from "../providers/index";
import { ChainNamespace } from "../providers/network";
import { assertArgument } from "../utils/index";
import { HDNodeWallet } from "./hdwallet";
import { decryptCrowdsaleJson, isCrowdsaleJson } from "./json-crowdsale";
import type { CrowdsaleAccount } from "./json-crowdsale";
import {
    decryptKeystoreJson, decryptKeystoreJsonSync,
    encryptKeystoreJson, encryptKeystoreJsonSync,
    isKeystoreJson
} from "./json-keystore";
import type { KeystoreAccount } from "./json-keystore";
import { Mnemonic } from "./mnemonic";
import { Eip155Wallet } from "./wallet-eip155";
import { TronWallet } from "./wallet-tron";


function stall(duration: number): Promise<void> {
    return new Promise((resolve) => { setTimeout(() => { resolve(); }, duration); });
}

export interface IWallet {
    readonly signingKey: SigningKey
    readonly privateKey: string
    readonly address: string

    connect(provider: null | Provider): IWallet
}

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
export class Wallet extends AbstractSigner implements IWallet {
    readonly #signingKey: SigningKey;
    readonly #defaultAddress: string;
    #wallet: AbstractSigner & IWallet

    /**
     *  Create a new wallet for the %%privateKey%%, optionally connected
     *  to %%provider%%.
     */
    constructor(key: string | SigningKey, provider?: null | Provider) {
        super(provider);

        if (typeof (key) === "string" && !key.startsWith("0x")) {
            key = "0x" + key;
        }
        this.#signingKey = (typeof (key) === "string") ? new SigningKey(key) : key;

        this.#defaultAddress = computeAddress(key, ChainNamespace.eip155)

        if (provider) {
            if (provider.chainNamespace === ChainNamespace.eip155)
                this.#wallet = new Eip155Wallet(key, provider)
            else if (provider.chainNamespace === ChainNamespace.solana || provider.chainNamespace === ChainNamespace.tron) {
                assert(provider instanceof TronProvider, 'Tron Wallet can only connect with a Tron provider')
                this.#wallet = new TronWallet(key, provider)
            }
        }
    }

    /**
     *  The [[SigningKey]] used for signing payloads.
     */
    get signingKey(): SigningKey { return this.#signingKey; }

    /**
     *  The private key for this wallet.
     */
    get privateKey(): string { return this.signingKey.privateKey; }

    get address() { return this.#wallet?.address ?? this.#defaultAddress }
    async getAddress(): Promise<string> { return this.address; }

    connect(provider: null | Provider): Wallet {
        return new Wallet(this.signingKey, provider);
    }

    populateCall(tx: TransactionRequest): Promise<TransactionLike<string>> {
        return this.#wallet.populateCall(tx)
    }

    populateTransaction(tx: TransactionRequest): Promise<TransactionLike<string>> {
        return this.#wallet.populateTransaction(tx)
    }

    sendTransaction(tx: TransactionRequest): Promise<TransactionResponse> {
        return this.#wallet.sendTransaction(tx)
    }

    signTransaction(tx: TransactionRequest): Promise<string> {
        return this.#wallet.signTransaction(tx)
    }

    signMessage(message: string | Uint8Array): Promise<string> {
        return this.#wallet.signMessage(message)
    }

    signTypedData(domain: TypedDataDomain, types: Record<string, TypedDataField[]>, value: Record<string, any>): Promise<string> {
        return this.#wallet.signTypedData(domain, types, value)
    }

    /**
     *  Resolves to a [JSON Keystore Wallet](json-wallets) encrypted with
     *  %%password%%.
     *
     *  If %%progressCallback%% is specified, it will receive periodic
     *  updates as the encryption process progreses.
     */
    async encrypt(password: Uint8Array | string, progressCallback?: ProgressCallback): Promise<string> {
        const account = { address: this.address, privateKey: this.privateKey };
        return await encryptKeystoreJson(account, password, { progressCallback });
    }

    /**
     *  Returns a [JSON Keystore Wallet](json-wallets) encryped with
     *  %%password%%.
     *
     *  It is preferred to use the [async version](encrypt) instead,
     *  which allows a [[ProgressCallback]] to keep the user informed.
     *
     *  This method will block the event loop (freezing all UI) until
     *  it is complete, which may be a non-trivial duration.
     */
    encryptSync(password: Uint8Array | string): string {
        const account = { address: this.address, privateKey: this.privateKey };
        return encryptKeystoreJsonSync(account, password);
    }

    static #fromAccount(account: null | CrowdsaleAccount | KeystoreAccount): HDNodeWallet | Wallet {
        assertArgument(account, "invalid JSON wallet", "json", "[ REDACTED ]");

        if ("mnemonic" in account && account.mnemonic && account.mnemonic.locale === "en") {
            const mnemonic = Mnemonic.fromEntropy(account.mnemonic.entropy);
            const wallet = HDNodeWallet.fromMnemonic(mnemonic, account.mnemonic.path);
            if (wallet.address === account.address && wallet.privateKey === account.privateKey) {
                return wallet;
            }
            console.log("WARNING: JSON mismatch address/privateKey != mnemonic; fallback onto private key");
        }

        const wallet = new Wallet(account.privateKey);

        assertArgument(wallet.address === account.address,
            "address/privateKey mismatch", "json", "[ REDACTED ]");

        return wallet;
    }

    /**
     *  Creates (asynchronously) a **Wallet** by decrypting the %%json%%
     *  with %%password%%.
     *
     *  If %%progress%% is provided, it is called periodically during
     *  decryption so that any UI can be updated.
     */
    static async fromEncryptedJson(json: string, password: Uint8Array | string, chainNamespace: ChainNamespace, progress?: ProgressCallback): Promise<HDNodeWallet | Wallet> {
        let account: null | CrowdsaleAccount | KeystoreAccount = null;
        if (isKeystoreJson(json)) {
            account = await decryptKeystoreJson(json, password, chainNamespace, progress);

        } else if (isCrowdsaleJson(json)) {
            if (progress) { progress(0); await stall(0); }
            account = decryptCrowdsaleJson(json, password, chainNamespace);
            if (progress) { progress(1); await stall(0); }

        }

        return Wallet.#fromAccount(account);
    }

    /**
     *  Creates a **Wallet** by decrypting the %%json%% with %%password%%.
     *
     *  The [[fromEncryptedJson]] method is preferred, as this method
     *  will lock up and freeze the UI during decryption, which may take
     *  some time.
     */
    static fromEncryptedJsonSync(json: string, password: Uint8Array | string, chainNamespace: ChainNamespace): HDNodeWallet | Wallet {
        let account: null | CrowdsaleAccount | KeystoreAccount = null;
        if (isKeystoreJson(json)) {
            account = decryptKeystoreJsonSync(json, password, chainNamespace);
        } else if (isCrowdsaleJson(json)) {
            account = decryptCrowdsaleJson(json, password, chainNamespace);
        } else {
            assertArgument(false, "invalid JSON wallet", "json", "[ REDACTED ]");
        }

        return Wallet.#fromAccount(account);
    }

    /**
     *  Creates a new random [[HDNodeWallet]] using the avavilable
     *  [cryptographic random source](randomBytes).
     *
     *  If there is no crytographic random source, this will throw.
     */
    static createRandom(provider?: null | Provider): HDNodeWallet {
        const wallet = HDNodeWallet.createRandom();
        if (provider) { return wallet.connect(provider); }
        return wallet;
    }

    /**
     *  Creates a [[HDNodeWallet]] for %%phrase%%.
     */
    static fromPhrase(phrase: string, provider?: Provider): HDNodeWallet {
        const wallet = HDNodeWallet.fromPhrase(phrase);
        if (provider) { return wallet.connect(provider); }
        return wallet;
    }
}
