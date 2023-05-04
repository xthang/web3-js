/**
 *  About Abstract Signer and subclassing
 *
 *  @_section: api/providers/abstract-signer: Subclassing Signer [abstract-signer]
 */
import type { TypedDataDomain, TypedDataField } from '../hash/index'
import { Transaction } from '../transaction/index'
import type { TransactionLike } from '../transaction/index'
import { defineProperties, assert } from '../utils/index'
import type { Provider, TransactionRequest, TransactionResponse } from './provider'
import type { Signer } from './signer'

export function checkProvider(signer: AbstractSigner, operation: string): Provider {
  if (signer.provider) {
    return signer.provider
  }
  assert(false, 'missing provider', 'UNSUPPORTED_OPERATION', { operation })
}

export abstract class AbstractSigner<P extends null | Provider = null | Provider> implements Signer {
  readonly provider!: P

  constructor(provider?: P) {
    defineProperties<AbstractSigner>(this, { provider: provider || null })
  }

  abstract getAddress(): Promise<string>
  abstract connect(provider: null | Provider): Signer

  abstract populateCall(tx: TransactionRequest): Promise<TransactionLike<string>>

  abstract populateTransaction(tx: TransactionRequest): Promise<TransactionLike<string>>

  async estimateGas(tx: TransactionRequest): Promise<bigint> {
    return checkProvider(this, 'estimateGas').estimateGas(await this.populateCall(tx))
  }

  async call(tx: TransactionRequest): Promise<string> {
    return checkProvider(this, 'call').call(await this.populateCall(tx))
  }

  async resolveName(name: string): Promise<null | string> {
    const provider = checkProvider(this, 'resolveName')
    return await provider.resolveName(name)
  }

  async sendTransaction(tx: TransactionRequest): Promise<TransactionResponse> {
    const provider = checkProvider(this, 'sendTransaction')

    const pop = await this.populateTransaction(tx)
    delete pop.from
    const txObj = Transaction.from(pop, this.provider.chainNamespace)
    return await provider.broadcastTransaction(await this.signTransaction(txObj))
  }

  abstract signTransaction(tx: TransactionRequest): Promise<string>
  abstract signMessage(message: string | Uint8Array): Promise<string>
  abstract signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string>
}

export class VoidSigner extends AbstractSigner {
  readonly address!: string

  constructor(address: string, provider?: null | Provider) {
    super(provider)
    defineProperties<VoidSigner>(this, { address })
  }

  async getAddress(): Promise<string> {
    return this.address
  }

  connect(provider: null | Provider): VoidSigner {
    return new VoidSigner(this.address, provider)
  }

  #throwUnsupported(suffix: string, operation: string): never {
    assert(false, `VoidSigner cannot sign ${suffix}`, 'UNSUPPORTED_OPERATION', { operation })
  }

  populateCall(tx: TransactionRequest): Promise<TransactionLike<string>> {
    throw new Error('Method not implemented.')
  }
  populateTransaction(tx: TransactionRequest): Promise<TransactionLike<string>> {
    throw new Error('Method not implemented.')
  }

  async signTransaction(tx: TransactionRequest): Promise<string> {
    this.#throwUnsupported('transactions', 'signTransaction')
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    this.#throwUnsupported('messages', 'signMessage')
  }

  async signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string> {
    this.#throwUnsupported('typed-data', 'signTypedData')
  }
}
