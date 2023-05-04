import { SigningKey } from '../crypto'
import { AbstractSigner } from '../providers'

export interface IWallet extends AbstractSigner {
  // readonly provider: P

  readonly signingKey: SigningKey
  readonly privateKey: string
  readonly address: string

  // getAddress(): Promise<string>

  // connect(provider: null | Provider): IWallet

  // signTransaction(tx: TransactionRequest): Promise<string>
  // signMessage(message: string | Uint8Array): Promise<string>
  // signMessageSync?(message: string | Uint8Array): string
  // signTypedData(domain: TypedDataDomain, types: Record<string, TypedDataField[]>, value: Record<string, any>): Promise<string>

  // sendTransaction(tx: TransactionRequest): Promise<TransactionResponse>

  // encrypt?(password: Uint8Array | string, progressCallback?: ProgressCallback): Promise<string>
  // encryptSync?(password: Uint8Array | string): string
}
