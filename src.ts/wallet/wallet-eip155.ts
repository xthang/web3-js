import { resolveAddressToHex, getAddress } from '../address/index.js'
import { SigningKey } from '../crypto/index.js'
import { hashMessage, TypedDataDomain, TypedDataField, TypedDataEncoder } from '../hash/index.js'
import { AbstractEip155Signer, ChainNamespace, Provider, TransactionRequest } from '../providers/index.js'
import { Transaction, TransactionLike, computeAddress } from '../transaction/index.js'
import { assert, assertArgument, resolveProperties } from '../utils/index.js'
import { IWallet } from './base.js'

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
export class Eip155Wallet extends AbstractEip155Signer implements IWallet {
  /**
   *  The wallet address.
   */
  readonly address!: string

  readonly #signingKey: SigningKey

  /**
   *  Create a new wallet for the %%privateKey%%, optionally connected
   *  to %%provider%%.
   */
  constructor(key: string | SigningKey, provider?: null | Provider) {
    super(provider)

    if (typeof key === 'string' && !key.startsWith('0x')) {
      key = '0x' + key
    }
    const privateKey = typeof key === 'string' ? new SigningKey(key) : key

    assertArgument(privateKey && typeof privateKey.sign === 'function', 'invalid private key', 'privateKey', '[ REDACTED ]')

    this.#signingKey = privateKey

    this.address = computeAddress(this.signingKey.publicKey, provider?.chainNamespace ?? ChainNamespace.eip155)
  }

  connect(provider: null | Provider): Eip155Wallet {
    return new Eip155Wallet(this.signingKey, provider)
  }

  // Store private values behind getters to reduce visibility
  // in console.log

  /**
   *  The [[SigningKey]] used for signing payloads.
   */
  get signingKey(): SigningKey {
    return this.#signingKey
  }

  /**
   *  The private key for this wallet.
   */
  get privateKey(): string {
    return this.signingKey.privateKey
  }

  async getAddress(): Promise<string> {
    return this.address
  }

  async signTransaction(tx: TransactionRequest): Promise<string> {
    // Replace any Addressable or ENS name with an address
    const { to, from } = await resolveProperties({
      to: tx.to ? resolveAddressToHex(tx.to, this.provider!.chainNamespace, this.provider) : undefined,
      from: tx.from ? resolveAddressToHex(tx.from, this.provider!.chainNamespace, this.provider) : undefined
    })

    if (to != null) {
      tx.to = to
    }
    if (from != null) {
      tx.from = from
    }

    if (tx.from != null) {
      assertArgument(getAddress(<string>tx.from, this.provider!.chainNamespace) === this.address, 'transaction from address mismatch', 'tx.from', tx.from)
      delete tx.from
    }

    // Build the transaction
    const btx = Transaction.from(<TransactionLike<string>>tx, this.provider!.chainNamespace)
    btx.signature = this.signingKey.sign(btx.unsignedHash)

    return btx.serialized
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    return this.signMessageSync(message)
  }

  // @TODO: Add a secialized signTx and signTyped sync that enforces
  // all parameters are known?
  /**
   *  Returns the signature for %%message%% signed with this wallet.
   */
  signMessageSync(message: string | Uint8Array): string {
    return this.signingKey.sign(hashMessage(message)).serialized
  }

  async signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string> {
    // Populate any ENS names
    const populated = await TypedDataEncoder.resolveNames(domain, types, value, async (name: string) => {
      // @TODO: this should use resolveName; addresses don't
      //        need a provider

      assert(this.provider != null, 'cannot resolve ENS names without a provider', 'UNSUPPORTED_OPERATION', {
        operation: 'resolveName',
        info: { name }
      })

      const address = await this.provider.resolveName(name)
      assert(address != null, 'unconfigured ENS name', 'UNCONFIGURED_NAME', {
        value: name
      })

      return address
    })

    return this.signingKey.sign(TypedDataEncoder.hash(populated.domain, types, populated.value)).serialized
  }
}
