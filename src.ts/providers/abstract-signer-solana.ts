import { TransactionLike } from '../transaction/index'
import { resolveProperties } from '../utils/index'
import { checkProvider } from './abstract-signer'
import { TransactionResponse, copyRequest } from './provider'
import type { TransactionRequest } from './provider'
import { AbstractSigner, SolanaJsonRpcProvider } from './index'

async function populate(signer: AbstractSolanaSigner, tx: TransactionRequest): Promise<TransactionLike<string>> {
  const pop: any = copyRequest(tx)
  return await resolveProperties(pop)
}

export abstract class AbstractSolanaSigner<P extends null | SolanaJsonRpcProvider = null | SolanaJsonRpcProvider> extends AbstractSigner<P> {
  async populateCall(tx: TransactionRequest): Promise<TransactionLike<string>> {
    const pop = await populate(this, tx)
    return pop
  }

  async populateTransaction(tx: TransactionRequest): Promise<TransactionLike<string>> {
    checkProvider(this, 'populateTransaction')

    const pop = await populate(this, tx)

    return await resolveProperties(pop)
  }

  async sendTransaction(tx: TransactionRequest): Promise<TransactionResponse> {
    const provider = checkProvider(this, 'sendTransaction') as SolanaJsonRpcProvider

    const transaction = tx.solana?.transaction
    if (!transaction) throw new Error('Solana transaction not found')
    // if (tx.solana.transactionType === TransactionType.unwrap && _tx.value !== undefined) throw new Error('Unwrap will unwrap all available wSOL. Do not set value property')

    // transaction.feePayer = new PublicKey(await this.getAddress())
    const { blockhash, lastValidBlockHeight } = await this.provider.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.lastValidBlockHeight = lastValidBlockHeight

    const encodedTransaction = await this.signTransaction(tx)

    // await provider.connection.sendEncodedTransaction(encodedTransaction)

    return await provider.broadcastTransaction(encodedTransaction)
  }
}
