/**
 *  When interacting with Ethereum, it is necessary to use a private
 *  key authenticate actions by signing a payload.
 *
 *  Wallets are the simplest way to expose the concept of an
 *  //Externally Owner Account// (EOA) as it wraps a private key
 *  and supports high-level methods to sign common types of interaction
 *  and send transactions.
 *
 *  The class most developers will want to use is [[Wallet]], which
 *  can load a private key directly or from any common wallet format.
 *
 *  The [[HDNodeWallet]] can be used when it is necessary to access
 *  low-level details of how an HD wallets are derived, exported
 *  or imported.
 *
 *  @_section: api/wallet:Wallets  [about-wallets]
 */

export { BaseEip155Wallet } from "./base-wallet-eip155";

export {
    defaultPath,
    getAccountPath, getIndexedAccountPath,
    HDNodeWallet,
    HDNodeVoidWallet,
} from "./hdwallet";

export { isCrowdsaleJson, decryptCrowdsaleJson } from "./json-crowdsale";

export {
    isKeystoreJson,
    decryptKeystoreJsonSync, decryptKeystoreJson,
    encryptKeystoreJson, encryptKeystoreJsonSync
} from "./json-keystore";

export { Mnemonic } from "./mnemonic";

export { Wallet } from "./wallet";
export { Eip155Wallet } from "./wallet-eip155";
export { TronWallet } from "./wallet-tron";
export { TransactionType } from "./base-wallet-tron";


export type { CrowdsaleAccount } from "./json-crowdsale";
export type {
    KeystoreAccount, EncryptOptions
} from "./json-keystore"
