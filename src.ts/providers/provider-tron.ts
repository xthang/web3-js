import TronWeb, { providers } from 'tronweb'
import { AddressLike, BigNumberish, ChainNamespace, FetchRequest, Listener, Network, Networkish, makeError } from '../ethers.js'
import { TronJsonRpcProvider } from './provider-jsonrpc-tron.js'
import { Block, BlockTag, FeeData, Filter, FilterByBlockHash, Log, Provider, ProviderEvent, TransactionReceipt, TransactionRequest, TransactionResponse } from './provider.js'

export class TronProvider implements Provider {
  chainNamespace = ChainNamespace.tron
  get provider(): this {
    return this
  }
  jsonRpcProvider: TronJsonRpcProvider
  tronWeb: TronWeb

  constructor(rpcUrl: string | FetchRequest, fullHostUrl: string | providers.HttpProvider, tronProApiKey: string, network?: Networkish) {
    this.jsonRpcProvider = new TronJsonRpcProvider(rpcUrl, network)
    this.tronWeb = new TronWeb({
      fullHost: fullHostUrl,
      headers: { 'TRON-PRO-API-KEY': tronProApiKey }
      // privateKey: 'your private key'
    })
  }

  destroy(): void {
    this.jsonRpcProvider.destroy()
  }

  getBlockNumber(): Promise<number> {
    return this.jsonRpcProvider.getBlockNumber()
  }

  getNetwork(): Promise<Network> {
    return this.jsonRpcProvider.getNetwork()
  }

  getFeeData(): Promise<FeeData> {
    return this.jsonRpcProvider.getFeeData()
  }

  async getBalance(address: AddressLike, blockTag?: BlockTag): Promise<bigint> {
    if (typeof address == 'object') {
      if ('then' in address) address = await address
      else address = await address.getAddress()
    }
    return this.jsonRpcProvider.getBalance(address, blockTag)
  }

  getTransactionCount(address: AddressLike, blockTag?: BlockTag): Promise<number> {
    return Promise.resolve(0)
  }

  getCode(address: AddressLike, blockTag?: BlockTag): Promise<string> {
    throw new Error('Method not implemented.')
  }

  getStorage(address: AddressLike, position: BigNumberish, blockTag?: BlockTag): Promise<string> {
    throw new Error('Method not implemented.')
  }

  estimateGas(tx: TransactionRequest): Promise<bigint> {
    // tx = {
    //     ...tx,
    //     from: tx.from ? convertToHexAddress(tx.from as string, this.chainNamespace) : undefined,
    //     to: tx.to ? convertToHexAddress(tx.to as string, this.chainNamespace) : undefined
    // }
    return this.jsonRpcProvider.estimateGas(tx)
  }

  async send(method: string, params: Array<any> | Record<string, any>): Promise<any> {
    return await this.jsonRpcProvider.send(method, params)
  }

  call(tx: TransactionRequest): Promise<string> {
    return this.jsonRpcProvider.call(tx)
  }

  async broadcastTransaction(signedTx: { txID: string }): Promise<TransactionResponse> {
    const resp = await this.tronWeb.trx.broadcast(signedTx)

    // No result; the node failed us in unexpected ways
    if (resp == null) {
      throw makeError('[TRON] no response from server', 'BAD_DATA', { value: resp, info: { signedTx } })
    }
    if ('message' in resp && resp.message) resp.message = `[decoded] ${TronWeb.toUtf8(resp.message)}`
    // The response is an error
    if (!('result' in resp) || resp.result !== true) {
      throw makeError('Error from server', 'BAD_DATA', { value: resp, info: { signedTx } })
    }
    if (signedTx.txID !== resp.txid) {
      throw new Error('@TODO: the returned txID did not match')
    }
    // console.log('<<- TRON broadcast response:', resp)

    const respTrx = resp.transaction

    // All good; send the result
    return new TransactionResponse(
      {
        blockNumber: 0,
        blockHash: respTrx.raw_data.ref_block_hash,

        hash: resp.txid,
        index: 0,

        type: 0,

        from: respTrx.raw_data.contract[0].parameter.value.owner_address,
        to: respTrx.raw_data.contract[0].parameter.value.contract_address,

        data: respTrx.raw_data.contract[0].parameter.value.data,
        value: 0n,
        chainId: (await this.getNetwork()).chainId,

        nonce: 0,

        gasLimit: 0n,
        gasPrice: 0n,

        maxPriorityFeePerGas: null,
        maxFeePerGas: null,

        signature: respTrx.signature[0] as any,

        accessList: null
      },
      this.provider
    )
  }

  getBlock(blockHashOrBlockTag: BlockTag, prefetchTxs?: boolean): Promise<Block> {
    return this.jsonRpcProvider.getBlock(blockHashOrBlockTag, prefetchTxs)
  }

  getTransaction(hash: string): Promise<TransactionResponse> {
    return this.jsonRpcProvider.getTransaction(hash)
  }

  getTransactionReceipt(hash: string): Promise<TransactionReceipt> {
    return this.jsonRpcProvider.getTransactionReceipt(hash)
  }

  getTransactionResult(hash: string): Promise<string> {
    return this.jsonRpcProvider.getTransactionResult(hash)
  }

  getLogs(filter: Filter | FilterByBlockHash): Promise<Log[]> {
    return this.jsonRpcProvider.getLogs(filter)
  }

  resolveName(ensName: string): Promise<string> {
    throw new Error('Method not implemented.')
  }

  lookupAddress(address: string): Promise<string> {
    return this.jsonRpcProvider.lookupAddress(address)
  }

  waitForTransaction(hash: string, confirms?: number, timeout?: number): Promise<TransactionReceipt> {
    throw new Error('Method not implemented.')
  }

  waitForBlock(blockTag?: BlockTag): Promise<Block> {
    throw new Error('Method not implemented.')
  }

  sendTransaction?: (tx: TransactionRequest) => Promise<TransactionResponse>

  listeners(event?: ProviderEvent): Promise<Listener[]> {
    return this.jsonRpcProvider.listeners(event)
  }

  listenerCount(event?: ProviderEvent): Promise<number> {
    return this.jsonRpcProvider.listenerCount(event)
  }

  async addListener(event: ProviderEvent, listener: Listener): Promise<this> {
    await this.jsonRpcProvider.addListener(event, listener)
    return this
  }

  async removeAllListeners(event?: ProviderEvent): Promise<this> {
    await this.jsonRpcProvider.removeAllListeners(event)
    return this
  }

  async removeListener(event: ProviderEvent, listener: Listener): Promise<this> {
    await this.jsonRpcProvider.removeListener(event, listener)
    return this
  }

  async on(event: ProviderEvent, listener: Listener): Promise<this> {
    await this.jsonRpcProvider.on(event, listener)
    return this
  }

  async once(event: ProviderEvent, listener: Listener): Promise<this> {
    await this.jsonRpcProvider.once(event, listener)
    return this
  }

  async off(event: ProviderEvent, listener?: Listener): Promise<this> {
    this.jsonRpcProvider.off(event, listener)
    return this
  }

  async emit(event: ProviderEvent, ...args: any[]): Promise<boolean> {
    return await this.jsonRpcProvider.emit(event, args)
  }
}
