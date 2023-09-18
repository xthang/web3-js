import { resolveAddressToHex, getAddress } from '../address/index.js'
import { TRON_ADDRESS_PREFIX } from '../constants/addresses.js'
import { SigningKey } from '../crypto/index.js'
import { hashMessage, TypedDataDomain, TypedDataField, TypedDataEncoder } from '../hash/index.js'
import { AbstractTronSigner, ChainNamespace, TransactionRequest, TronProvider } from '../providers/index.js'
import { computeAddress } from '../transaction/index.js'
import { assertArgument, resolveProperties, assert } from '../utils/index.js'
import { IWallet } from './base.js'

export enum TransactionType {
  sendTrx = 1,
  triggerSmartContract
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
export class TronWallet extends AbstractTronSigner implements IWallet {
  /**
   *  The wallet address.
   */
  readonly address!: string
  readonly addressHex: string
  readonly addressBase58: string

  readonly #signingKey: SigningKey

  /**
   *  Creates a new BaseWallet for %%privateKey%%, optionally
   *  connected to %%provider%%.
   *
   *  If %%provider%% is not specified, only offline methods can
   *  be used.
   */
  constructor(key: string | SigningKey, provider?: null | TronProvider) {
    super(provider)

    if (typeof key === 'string' && !key.startsWith('0x')) {
      key = '0x' + key
    }

    this.#signingKey = typeof key === 'string' ? new SigningKey(key) : key

    assertArgument(this.#signingKey && typeof this.#signingKey.sign === 'function', 'invalid private key', 'privateKey', '[ REDACTED ]')

    this.addressHex = computeAddress(this.signingKey.publicKey, ChainNamespace.eip155)
    this.addressBase58 = computeAddress(this.signingKey.publicKey, ChainNamespace.tron)
    this.address = computeAddress(this.signingKey.publicKey, provider?.chainNamespace ?? ChainNamespace.tron)
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
    return this.signingKey.privateKey.substring(2)
  }

  async getAddress(): Promise<string> {
    return this.address
  }

  connect(provider: null | TronProvider): TronWallet {
    return new TronWallet(this.signingKey, provider)
  }

  async signTransaction(tx: TransactionRequest): Promise<string> {
    // Replace any Addressable or ENS name with an address
    const { to, from } = await resolveProperties({
      to: tx.to ? resolveAddressToHex(tx.to, this.provider!.chainNamespace, this.provider) : undefined,
      from: tx.from ? resolveAddressToHex(tx.from, this.provider!.chainNamespace, this.provider) : undefined
    })

    if (to) tx.to = TRON_ADDRESS_PREFIX + to.substring(2)
    if (from != null) tx.from = TRON_ADDRESS_PREFIX + from.substring(2)

    if (tx.from != null) {
      assertArgument(getAddress(<string>tx.from, this.provider!.chainNamespace) === this.address, 'transaction from address mismatch', 'tx.from', tx.from)
    }

    // Build the transaction
    let transaction: any
    switch (tx.tron.transactionType) {
      case TransactionType.sendTrx:
        transaction = await this.provider!.tronWeb.transactionBuilder.sendTrx(
          tx.to as string,
          typeof tx.value === 'string' ? parseInt(tx.value, 16) : tx.value,
          (tx.from as string) ?? TRON_ADDRESS_PREFIX + this.addressHex.substring(2)
        )
        break
      case TransactionType.triggerSmartContract:
        transaction = await this.provider!.tronWeb.transactionBuilder.triggerSmartContract(
          tx.to,
          tx.tron.function,
          {
            feeLimit: (tx.gasLimit as number) * (tx.gasPrice as number),
            callValue: typeof tx.value === 'string' ? parseInt(tx.value, 16) : tx.value
            // tokenValue: tx.tron.tokenValue,
            // tokenId: tx.tron.tokenId
          },
          tx.tron.parameter,
          tx.from ?? TRON_ADDRESS_PREFIX + this.addressHex.substring(2)
        )
        transaction = transaction.transaction
        break
      default:
        throw new Error('Invalid tx type: ' + tx.type)
    }

    return this.provider!.tronWeb.trx.sign(transaction, this.privateKey)
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
