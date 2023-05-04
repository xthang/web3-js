import * as ed25519 from '@noble/ed25519'
import { hexToBytes } from '@noble/hashes/utils'
import { Keypair } from '@solana/web3.js'
import { SigningKey } from '../crypto'
import { TypedDataDomain, TypedDataField } from '../hash'
import { AbstractSolanaSigner, ChainNamespace, SolanaJsonRpcProvider, TransactionRequest } from '../providers'
import { computeAddress } from '../transaction'
import { assertArgument } from '../utils'
import { IWallet } from './base'

export enum TransactionType {
  transferSOL = 1,
  transferToken,
  // createAssociatedTokenAccount,
  // closeAssociatedTokenAccount,
  wrap,
  unwrap,
  swap,
  createNonFungibleToken
}

export class SolanaWallet extends AbstractSolanaSigner implements IWallet {
  /**
   *  The wallet address.
   */
  readonly address: string

  readonly #signingKey: SigningKey
  readonly signer: Keypair

  /**
   *  Creates a new BaseWallet for %%privateKey%%, optionally
   *  connected to %%provider%%.
   *
   *  If %%provider%% is not specified, only offline methods can
   *  be used.
   */
  constructor(key: string | SigningKey, provider?: null | SolanaJsonRpcProvider) {
    super(provider)

    if (typeof key === 'string' && !key.startsWith('0x')) {
      key = '0x' + key
    }

    this.#signingKey = typeof key === 'string' ? new SigningKey(key) : key

    assertArgument(this.#signingKey && typeof this.#signingKey.sign === 'function', 'invalid private key', 'privateKey', '[ REDACTED ]')

    const privateKeyBytes = hexToBytes(this.#signingKey.privateKey.substring(2))
    const computedPublicKey = ed25519.sync.getPublicKey(privateKeyBytes).subarray(0, 32)
    const secretKey = new Uint8Array([...privateKeyBytes, ...computedPublicKey])
    this.signer = Keypair.fromSecretKey(secretKey)

    this.address = computeAddress(this.signingKey, provider?.chainNamespace ?? ChainNamespace.solana)
  }

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

  connect(provider: null | SolanaJsonRpcProvider): SolanaWallet {
    return new SolanaWallet(this.signingKey, provider)
  }

  async signTransaction(tx: TransactionRequest): Promise<string> {
    const transaction = tx.solana!.transaction

    transaction.sign(this.signer)
    if (!transaction.signature) {
      throw new Error('!signature') // should never happen
    }

    return transaction.serialize().toString('base64')
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    throw new Error('Method not implemented.')
  }
  signMessageSync(message: string | Uint8Array): string {
    throw new Error('Method not implemented.')
  }
  async signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string> {
    throw new Error('Method not implemented.')
  }
}
