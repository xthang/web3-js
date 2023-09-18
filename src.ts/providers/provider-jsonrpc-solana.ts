import { Connection, Finality, Transaction, TransactionResponse as SolanaWeb3TransactionResponse } from '@solana/web3.js'
import bs58 from 'bs58'

import { AddressLike } from '../address'
import { FetchRequest, getBigInt, resolveProperties } from '../utils'
import { PerformActionRequest, PerformActionTransaction } from './abstract-provider'
import { BlockParams } from './formatting'
import { ChainNamespace, Networkish } from './network'
import { Network } from './network'
import { Block, BlockTag, FeeData, TransactionReceipt, TransactionRequest, TransactionResponse } from './provider'
import { JsonRpcApiProviderOptions } from './provider-jsonrpc'
import { Eip155JsonRpcProvider } from './provider-jsonrpc-eip155'

export class SolanaJsonRpcProvider extends Eip155JsonRpcProvider {
  readonly chainNamespace = ChainNamespace.solana

  readonly connection: Connection

  constructor(url: string | FetchRequest, network: Networkish, options?: JsonRpcApiProviderOptions) {
    const staticNetwork = Network.from(ChainNamespace.solana, network)

    super(ChainNamespace.solana, url, staticNetwork, { staticNetwork, ...options })

    this.connection = new Connection(typeof url === 'string' ? url : url.url)
  }

  _getTransactionRequest(_request: TransactionRequest): PerformActionTransaction | Promise<PerformActionTransaction> {
    throw new Error('Method not implemented.')
  }

  getRpcRequest(req: PerformActionRequest | { method: 'getLatestBlockhash' }): null | { method: string; args: Array<any> } {
    switch (req.method) {
      case 'chainId':
      case 'getGasPrice':
      case 'getTransactionCount':
      case 'getCode':
      case 'getStorage':
      case 'getLogs':
        throw new Error('Method not supported: ' + req.method)

      case 'getBlockNumber':
        return { method: 'eth_blockNumber', args: [] }

      case 'getBlock':
        if ('blockTag' in req) {
          return {
            method: 'eth_getBlockByNumber',
            args: [req.blockTag, !!req.includeTransactions]
          }
        } else if ('blockHash' in req) {
          return {
            method: 'eth_getBlockByHash',
            args: [req.blockHash, !!req.includeTransactions]
          }
        }
        break

      case 'getLatestBlockhash':
        return {
          method: 'getLatestBlockhash',
          args: [{ commitment: 'processed' }]
        }

      case 'getBalance':
        return { method: req.method, args: [req.address] }

      case 'getTransaction':
        return {
          method: 'getSignatureStatuses',
          args: [[req.hash]]
        }

      case 'getTransactionReceipt':
        return {
          method: 'getTransaction', // Returns transaction details for a confirmed transaction
          args: [req.hash]
        }

      case 'estimateGas': {
        return {
          method: 'getFeeForMessage',
          args: [req.transactionEncodedMessage]
        }
      }

      case 'call':
        return {
          method: 'simulateTransaction',
          args: [req.transactionEncodedMessage]
        }

      case 'broadcastTransaction':
        return {
          method: 'sendTransaction',
          args: [req.signedTransaction, { encoding: 'base64' }]
        }
    }

    return null
  }

  // State
  async getLatestBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
    // return (await this.perform({ method: 'getLatestBlockhash' } as any)).value
    return await this.connection.getLatestBlockhash()
  }

  async getBlockNumber(): Promise<number> {
    return (await this.getLatestBlockhash()).lastValidBlockHeight
  }

  async getBlock(slot_: number | Finality): Promise<Block> {
    const slot = typeof slot_ === 'number' ? slot_ : await this.connection.getSlot(slot_)
    const block = await this.connection.getBlock(
      slot, // NOTE: get an ealier block (- 31) to avoid this error: SolanaJSONRPCError: failed to get confirmed block: Block not available for slot 212786668
      {
        commitment: typeof slot_ === 'string' ? slot_ : undefined,
        // maxSupportedTransactionVersion: 0,
        rewards: false
      }
    )
    return this._wrapBlock({
      hash: block.blockhash,
      number: (block as any).blockHeight,
      timestamp: block.blockTime,
      parentHash: null,
      nonce: null,
      difficulty: null,
      gasLimit: null,
      gasUsed: null,
      miner: null,
      extraData: null,
      baseFeePerGas: null,
      transactions: block.transactions.map((it) => ({
        chainId: null,
        hash: it.transaction.signatures[0],
        index: null,
        type: null,
        blockHash: it.transaction.message.recentBlockhash,
        blockNumber: null,
        from: null,
        to: null,
        nonce: null,
        gasLimit: null,
        gasPrice: null,
        maxPriorityFeePerGas: null,
        maxFeePerGas: null,
        value: null,
        data: it.transaction.message.serialize().toString('base64'),
        signature: it.transaction.signatures[0] as any,
        accessList: null
      }))
    })
  }

  _wrapBlock(value: BlockParams): Block {
    return new Block(value, this)
  }

  async getBalance(address: AddressLike): Promise<bigint> {
    address = this._getAddress(address)
    if (typeof address !== 'string') {
      address = await Promise.resolve(address)
    }
    return (await this.perform({ method: 'getBalance', address, blockTag: null })).value
  }

  getTransactionCount(address: AddressLike, blockTag?: BlockTag): Promise<number> {
    throw new Error('Method not implemented.')
  }

  async getFeeData(): Promise<FeeData> {
    return new FeeData(1n)
  }

  async estimateGas(_tx: TransactionRequest): Promise<bigint> {
    const transaction = _tx.solana?.transaction

    if (!transaction) throw new Error('Solana transaction not found')
    // if (_tx.solana.transactionType === TransactionType.unwrap && _tx.value !== undefined) throw new Error('Unwrap will unwrap all available wSOL. Do not set value property')

    const { blockhash, lastValidBlockHeight } = await this.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.lastValidBlockHeight = lastValidBlockHeight

    // return BigInt((await this.connection.getFeeForMessage(transaction.compileMessage())).value)

    const base64EncodedMessage = transaction.compileMessage().serialize().toString('base64')

    const resp = await this.perform({
      method: 'estimateGas',
      transaction: null as any,
      transactionEncodedMessage: base64EncodedMessage
    })

    return getBigInt(resp.value, '%response')
  }

  async call(_tx: TransactionRequest): Promise<string> {
    const { tx, blockTag } = await resolveProperties({
      tx: this._getTransactionRequest(_tx),
      blockTag: this._getBlockTag(_tx.blockTag)
    })

    const base64EncodedMessage = _tx.solana.transaction.compileMessage().serialize().toString('base64')

    return await this._perform({
      method: 'call',
      transaction: tx,
      blockTag,
      transactionEncodedMessage: base64EncodedMessage
    })
  }

  // Write
  async broadcastTransaction(signedTx: string): Promise<TransactionResponse> {
    const blockNumber = await this.getBlockNumber()
    const hash = await this._perform({
      method: 'broadcastTransaction',
      signedTransaction: signedTx
    })
    const network = await this.getNetwork()

    const tx = Transaction.from(Buffer.from(signedTx, 'base64'))
    if (bs58.encode(tx.signature) !== hash) {
      throw new Error('@TODO: the returned hash did not match: ' + hash + ' | ' + bs58.encode(tx.signature))
    }

    return this._wrapTransactionResponse(<any>tx, network).replaceableTransaction(blockNumber)
  }

  _wrapTransactionResponse(tx: any, network: Network): TransactionResponse {
    const t = tx as Transaction
    return new TransactionResponse(
      {
        chainId: network.chainId,
        blockNumber: t.lastValidBlockHeight,
        blockHash: t.recentBlockhash,

        hash: bs58.encode(t.signature),
        index: null,

        type: null,

        to: null,
        from: t.feePayer.toBase58(),

        nonce: null,

        gasLimit: null,
        gasPrice: null,
        maxPriorityFeePerGas: null,
        maxFeePerGas: null,

        data: null,
        value: null,

        signature: bs58.encode(t.signature) as any,

        accessList: null
      },
      this
    )
  }

  async getTransactionReceipt(hash: string): Promise<null | TransactionReceipt> {
    const params: SolanaWeb3TransactionResponse = await this.perform({ method: 'getTransactionReceipt', hash })
    if (params == null) {
      return null
    }

    return new TransactionReceipt(
      {
        to: null,
        from: null,
        contractAddress: null,

        hash: params.transaction.signatures[0],
        index: null,

        blockHash: params.transaction.message.recentBlockhash,
        blockNumber: null,

        logsBloom: null,
        logs: [],

        gasUsed: BigInt(params.meta.fee),
        cumulativeGasUsed: null,

        type: null,
        //byzantium: boolean;
        status: params.meta.err ? 0 : 1,
        root: null
      },
      this
    )
  }
}
