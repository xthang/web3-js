/**
 *  About JSON-RPC...
 *
 * @_section: api/providers/jsonrpc:JSON-RPC Provider  [about-jsonrpcProvider]
 */

// @TODO:
// - Add the batching API

// https://playground.open-rpc.org/?schemaUrl=https://raw.githubusercontent.com/ethereum/eth1.0-apis/assembled-spec/openrpc.json&uiSchema%5BappBar%5D%5Bui:splitView%5D=true&uiSchema%5BappBar%5D%5Bui:input%5D=false&uiSchema%5BappBar%5D%5Bui:examplesDropdown%5D=false

import { getAddress, resolveAddress } from '../address/index'
import { TypedDataEncoder } from '../hash/index'
import type { TypedDataDomain, TypedDataField } from '../hash/index'
import type { TransactionLike } from '../transaction/index'
import { defineProperties, getBigInt, hexlify, toUtf8Bytes, makeError, assert, assertArgument, FetchRequest, resolveProperties } from '../utils/index'
import { AbstractProvider, UnmanagedSubscriber } from './abstract-provider'
import type { PerformActionRequest, Subscriber, Subscription } from './abstract-provider'
import { AbstractSigner } from './abstract-signer'
import { ChainNamespace, Network } from './network'
import type { Networkish } from './network'
import type { Provider, TransactionRequest, TransactionResponse } from './provider'
import type { Signer } from './signer'
import { FilterIdEventSubscriber, FilterIdPendingSubscriber } from './subscriber-filterid'
import { PollingEventSubscriber } from './subscriber-polling'

type Timer = ReturnType<typeof setTimeout>

const Primitive = 'bigint,boolean,function,number,string,symbol'.split(/,/g)
//const Methods = "getAddress,then".split(/,/g);
function deepCopy<T = any>(value: T): T {
  if (value == null || Primitive.indexOf(typeof value) >= 0) {
    return value
  }

  // Keep any Addressable
  if (typeof (<any>value).getAddress === 'function') {
    return value
  }

  if (Array.isArray(value)) {
    return <any>value.map(deepCopy)
  }

  if (typeof value === 'object') {
    return Object.keys(value).reduce((accum, key) => {
      accum[key] = (<any>value)[key]
      return accum
    }, <any>{})
  }

  throw new Error(`should not happen: ${value} (${typeof value})`)
}

function stall(duration: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}

interface Pollable {
  pollingInterval: number
}

function isPollable(value: any): value is Pollable {
  return value && typeof value.pollingInterval === 'number'
}

/**
 *  A JSON-RPC payload, which are sent to a JSON-RPC server.
 */
export type JsonRpcPayload = {
  id: number
  method: string
  params: Array<any> | Record<string, any>
  jsonrpc: '2.0'
}

/**
 *  A JSON-RPC result, which are returned on success from a JSON-RPC server.
 */
export type JsonRpcResult = {
  id: number
  result: any
}

/**
 *  A JSON-RPC error, which are returned on failure from a JSON-RPC server.
 */
export type JsonRpcError = {
  id: number
  error: {
    code: number
    message?: string
    data?: any
  }
}

/**
 *  When subscribing to the ``"debug"`` event, the [[Listener]] will
 *  receive this object as the first parameter.
 */
export type DebugEventJsonRpcApiProvider =
  | {
      action: 'sendRpcPayload'
      payload: JsonRpcPayload | Array<JsonRpcPayload>
    }
  | {
      action: 'receiveRpcResult'
      result: Array<JsonRpcResult | JsonRpcError>
    }
  | {
      action: 'receiveRpcError'
      error: Error
    }

/**
 *  Options for configuring a [[JsonRpcApiProvider]]. Much of this
 *  is targetted towards sub-classes, which often will not expose
 *  any of these options to their consumers.
 *
 *  **``polling``** - use the polling strategy is used immediately
 *  for events; otherwise, attempt to use filters and fall back onto
 *  polling (default: ``false``)
 *
 *  **``staticNetwork``** - do not request chain ID on requests to
 *  validate the underlying chain has not changed (default: ``null``)
 *
 *  This should **ONLY** be used if it is **certain** that the network
 *  cannot change, such as when using INFURA (since the URL dictates the
 *  network). If the network is assumed static and it does change, this
 *  can have tragic consequences. For example, this **CANNOT** be used
 *  with MetaMask, since the used can select a new network from the
 *  drop-down at any time.
 *
 *  **``batchStallTime``** - how long (ms) to aggregate requests into a
 *  single batch. ``0`` indicates batching will only encompass the current
 *  event loop. If ``batchMaxCount = 1``, this is ignored. (default: ``10``)
 *
 *  **``batchMaxSize``** - target maximum size (bytes) to allow per batch
 *  request (default: 1Mb)
 *
 *  **``batchMaxCount``** - maximum number of requests to allow in a batch.
 *  If ``batchMaxCount = 1``, then batching is disabled. (default: ``100``)
 */
export type JsonRpcApiProviderOptions = {
  polling?: boolean
  staticNetwork?: null | Network
  batchStallTime?: number
  batchMaxSize?: number
  batchMaxCount?: number
}

const defaultOptions = {
  polling: false,
  staticNetwork: null,

  batchStallTime: 10, // 10ms
  batchMaxSize: 1 << 20, // 1Mb
  batchMaxCount: 100 // 100 requests
}

export interface JsonRpcTransactionRequest {
  from?: string
  to?: string
  data?: string

  chainId?: string
  type?: string
  gas?: string

  gasPrice?: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string

  nonce?: string
  value?: string

  accessList?: Array<{ address: string; storageKeys: Array<string> }>
}

// @TODO: Unchecked Signers

export class JsonRpcSigner extends AbstractSigner<JsonRpcApiProvider> {
  address!: string

  constructor(provider: JsonRpcApiProvider, address: string) {
    super(provider)
    address = getAddress(address, this.provider.chainNamespace)
    defineProperties<JsonRpcSigner>(this, { address })
  }

  connect(provider: null | Provider): Signer {
    assert(false, 'cannot reconnect JsonRpcSigner', 'UNSUPPORTED_OPERATION', {
      operation: 'signer.connect'
    })
  }

  async getAddress(): Promise<string> {
    return this.address
  }

  populateCall(tx: TransactionRequest): Promise<TransactionLike<string>> {
    throw new Error('Method not implemented.')
  }

  // JSON-RPC will automatially fill in nonce, etc. so we just check from
  async populateTransaction(tx: TransactionRequest): Promise<TransactionLike<string>> {
    return await this.populateCall(tx)
  }

  // Returns just the hash of the transaction after sent, which is what
  // the bare JSON-RPC API does;
  async sendUncheckedTransaction(_tx: TransactionRequest): Promise<string> {
    const tx = deepCopy(_tx)

    const promises: Array<Promise<void>> = []

    // Make sure the from matches the sender
    if (tx.from) {
      const _from = tx.from
      promises.push(
        (async () => {
          const from = await resolveAddress(_from, this.provider.chainNamespace, this.provider)
          assertArgument(from != null && from.toLowerCase() === this.address.toLowerCase(), 'from address mismatch', 'transaction', _tx)
          tx.from = from
        })()
      )
    } else {
      tx.from = this.address
    }

    // The JSON-RPC for eth_sendTransaction uses 90000 gas; if the user
    // wishes to use this, it is easy to specify explicitly, otherwise
    // we look it up for them.
    if (tx.gasLimit == null) {
      promises.push(
        (async () => {
          tx.gasLimit = await this.provider.estimateGas({ ...tx, from: this.address })
        })()
      )
    }

    // The address may be an ENS name or Addressable
    if (tx.to != null) {
      const _to = tx.to
      promises.push(
        (async () => {
          tx.to = await resolveAddress(_to, this.provider.chainNamespace, this.provider)
        })()
      )
    }

    // Wait until all of our properties are filled in
    if (promises.length) {
      await Promise.all(promises)
    }

    const hexTx = this.provider.getRpcTransaction(tx)

    return this.provider.send('eth_sendTransaction', [hexTx])
  }

  async sendTransaction(tx: TransactionRequest): Promise<TransactionResponse> {
    // This cannot be mined any earlier than any recent block
    const blockNumber = await this.provider.getBlockNumber()

    // Send the transaction
    const hash = await this.sendUncheckedTransaction(tx)

    // Unfortunately, JSON-RPC only provides and opaque transaction hash
    // for a response, and we need the actual transaction, so we poll
    // for it; it should show up very quickly
    return await new Promise((resolve, reject) => {
      const timeouts = [1000, 100]
      const checkTx = async () => {
        // Try getting the transaction
        const tx = await this.provider.getTransaction(hash)
        if (tx != null) {
          resolve(tx.replaceableTransaction(blockNumber))
          return
        }

        // Wait another 4 seconds
        this.provider._setTimeout(() => {
          checkTx()
        }, timeouts.pop() || 4000)
      }
      checkTx()
    })
  }

  async signTransaction(_tx: TransactionRequest): Promise<string> {
    const tx = deepCopy(_tx)

    // Make sure the from matches the sender
    if (tx.from) {
      const from = await resolveAddress(tx.from, this.provider.chainNamespace, this.provider)
      assertArgument(from != null && from.toLowerCase() === this.address.toLowerCase(), 'from address mismatch', 'transaction', _tx)
      tx.from = from
    } else {
      tx.from = this.address
    }

    const hexTx = this.provider.getRpcTransaction(tx)
    return await this.provider.send('eth_signTransaction', [hexTx])
  }

  async signMessage(_message: string | Uint8Array): Promise<string> {
    const message = typeof _message === 'string' ? toUtf8Bytes(_message) : _message
    return await this.provider.send('personal_sign', [hexlify(message), this.address.toLowerCase()])
  }

  async signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, _value: Record<string, any>): Promise<string> {
    const value = deepCopy(_value)

    // Populate any ENS names (in-place)
    const populated = await TypedDataEncoder.resolveNames(domain, types, value, async (value: string) => {
      const address = await resolveAddress(value, this.provider.chainNamespace)
      assertArgument(address != null, 'TypedData does not support null address', 'value', value)
      return address
    })

    return await this.provider.send('eth_signTypedData_v4', [this.address.toLowerCase(), JSON.stringify(TypedDataEncoder.getPayload(populated.domain, types, populated.value))])
  }

  async unlock(password: string): Promise<boolean> {
    return this.provider.send('personal_unlockAccount', [this.address.toLowerCase(), password, null])
  }

  // https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign
  async _legacySignMessage(_message: string | Uint8Array): Promise<string> {
    const message = typeof _message === 'string' ? toUtf8Bytes(_message) : _message
    return await this.provider.send('eth_sign', [this.address.toLowerCase(), hexlify(message)])
  }
}

type ResolveFunc = (result: JsonRpcResult) => void
type RejectFunc = (error: Error) => void

type Payload = { payload: JsonRpcPayload; resolve: ResolveFunc; reject: RejectFunc }

/**
 *  The JsonRpcApiProvider is an abstract class and **MUST** be
 *  sub-classed.
 *
 *  It provides the base for all JSON-RPC-based Provider interaction.
 *
 *  Sub-classing Notes:
 *  - a sub-class MUST override _send
 *  - a sub-class MUST call the `_start()` method once connected
 */
export abstract class JsonRpcApiProvider extends AbstractProvider {
  #options: Required<JsonRpcApiProviderOptions>

  // The next ID to use for the JSON-RPC ID field
  #nextId: number

  // Payloads are queued and triggered in batches using the drainTimer
  #payloads: Array<Payload>
  #drainTimer: null | Timer

  #notReady: null | {
    promise: Promise<void>
    resolve: null | ((v: void) => void)
  }

  #network: null | Network

  #scheduleDrain(): void {
    if (this.#drainTimer) {
      return
    }

    // If we aren't using batching, no hard in sending it immeidately
    const stallTime = this._getOption('batchMaxCount') === 1 ? 0 : this._getOption('batchStallTime')

    this.#drainTimer = setTimeout(() => {
      this.#drainTimer = null

      const payloads = this.#payloads
      this.#payloads = []

      while (payloads.length) {
        // Create payload batches that satisfy our batch constraints
        const batch = [<Payload>payloads.shift()]
        while (payloads.length) {
          if (batch.length === this.#options.batchMaxCount) {
            break
          }
          batch.push(<Payload>payloads.shift())
          const bytes = JSON.stringify(batch.map((p) => p.payload))
          if (bytes.length > this.#options.batchMaxSize) {
            payloads.unshift(<Payload>batch.pop())
            break
          }
        }

        // Process the result to each payload
        ;(async () => {
          const payload = batch.length === 1 ? batch[0].payload : batch.map((p) => p.payload)

          this.emit('debug', { action: 'sendRpcPayload', payload })

          try {
            const result = await this._send(payload)
            this.emit('debug', { action: 'receiveRpcResult', result })

            // Process results in batch order
            for (const { resolve, reject, payload } of batch) {
              // Find the matching result
              const resp = result.filter((r) => r.id === payload.id)[0]

              // No result; the node failed us in unexpected ways
              if (resp == null) {
                return reject(makeError('no response from server', 'BAD_DATA', { value: result, info: { payload } }))
              }

              // The response is an error
              if ('error' in resp) {
                return reject(this.getRpcError(payload, resp))
              }

              // All good; send the result
              resolve(resp.result)
            }
          } catch (error: any) {
            this.emit('debug', { action: 'receiveRpcError', error })

            for (const { reject } of batch) {
              // @TODO: augment the error with the payload
              reject(error)
            }
          }
        })()
      }
    }, stallTime)
  }

  constructor(chainNamespace: ChainNamespace, network?: Networkish, options?: JsonRpcApiProviderOptions) {
    super(chainNamespace, network)

    this.#nextId = 1
    this.#options = Object.assign({}, defaultOptions, options || {})

    this.#payloads = []
    this.#drainTimer = null

    this.#network = null

    {
      let resolve: null | ((value: void) => void) = null
      const promise = new Promise((_resolve: (value: void) => void) => {
        resolve = _resolve
      })
      this.#notReady = { promise, resolve }
    }

    // This could be relaxed in the future to just check equivalent networks
    const staticNetwork = this._getOption('staticNetwork')
    if (staticNetwork) {
      assertArgument(staticNetwork === network, 'staticNetwork MUST match network object', 'options', options)
      this.#network = staticNetwork
    }
  }

  /**
   *  Returns the value associated with the option %%key%%.
   *
   *  Sub-classes can use this to inquire about configuration options.
   */
  _getOption<K extends keyof JsonRpcApiProviderOptions>(key: K): JsonRpcApiProviderOptions[K] {
    return this.#options[key]
  }

  /**
   *  Gets the [[Network]] this provider has committed to. On each call, the network
   *  is detected, and if it has changed, the call will reject.
   */
  get _network(): Network {
    assert(this.#network, 'network is not available yet', 'NETWORK_ERROR')
    return this.#network
  }

  /**
   *  Sends a JSON-RPC %%payload%% (or a batch) to the underlying channel.
   *
   *  Sub-classes **MUST** override this.
   */
  abstract _send(payload: JsonRpcPayload | Array<JsonRpcPayload>): Promise<Array<JsonRpcResult | JsonRpcError>>
  /*
     {
        assert(false, "sub-classes must override _send", "UNSUPPORTED_OPERATION", {
            operation: "jsonRpcApiProvider._send"
        });
    }
    */

  /**
   *  Resolves to the non-normalized value by performing %%req%%.
   *
   *  Sub-classes may override this to modify behavior of actions,
   *  and should generally call ``super._perform`` as a fallback.
   */
  async _perform(req: PerformActionRequest): Promise<any> {
    // Legacy networks do not like the type field being passed along (which
    // is fair), so we delete type if it is 0 and a non-EIP-1559 network
    if (req.method === 'call' || req.method === 'estimateGas') {
      const tx = req.transaction
      if (tx && tx.type != null && getBigInt(tx.type)) {
        // If there are no EIP-1559 properties, it might be non-EIP-a559
        if (tx.maxFeePerGas == null && tx.maxPriorityFeePerGas == null) {
          const feeData = await this.getFeeData()
          if (feeData.maxFeePerGas == null && feeData.maxPriorityFeePerGas == null) {
            // Network doesn't know about EIP-1559 (and hence type)
            req = Object.assign({}, req, {
              transaction: Object.assign({}, tx, { type: undefined })
            })
          }
        }
      }
    }

    const request = this.getRpcRequest(req)

    if (request != null) {
      return await this.send(request.method, request.args)
    }

    return super._perform(req)
  }

  /**
   *  Sub-classes may override this; it detects the *actual* network that
   *  we are **currently** connected to.
   *
   *  Keep in mind that [[send]] may only be used once [[ready]], otherwise the
   *  _send primitive must be used instead.
   */
  async _detectNetwork(): Promise<Network> {
    const network = this._getOption('staticNetwork')
    if (network) {
      return network
    }

    // If we are ready, use ``send``, which enabled requests to be batched
    if (this.ready) {
      return Network.from(this.chainNamespace, getBigInt(await this.send('eth_chainId', [])))
    }

    // We are not ready yet; use the primitive _send

    const payload: JsonRpcPayload = {
      id: this.#nextId++,
      method: 'eth_chainId',
      params: [],
      jsonrpc: '2.0'
    }

    this.emit('debug', { action: 'sendRpcPayload', payload })

    let result: JsonRpcResult | JsonRpcError
    try {
      result = (await this._send(payload))[0]
    } catch (error) {
      this.emit('debug', { action: 'receiveRpcError', error })
      throw error
    }

    this.emit('debug', { action: 'receiveRpcResult', result })

    if ('result' in result) {
      return Network.from(this.chainNamespace, getBigInt(result.result))
    }

    throw this.getRpcError(payload, result)
  }

  /**
   *  Sub-classes **MUST** call this. Until [[_start]] has been called, no calls
   *  will be passed to [[_send]] from [[send]]. If it is overridden, then
   *  ``super._start()`` **MUST** be called.
   *
   *  Calling it multiple times is safe and has no effect.
   */
  _start(): void {
    if (this.#notReady == null || this.#notReady.resolve == null) {
      return
    }

    this.#notReady.resolve()
    this.#notReady = null

    ;(async () => {
      // Bootstrap the network
      while (this.#network == null) {
        try {
          this.#network = await this._detectNetwork()
        } catch (error) {
          console.log('JsonRpcProvider failed to startup; retry in 1s')
          await stall(1000)
        }
      }

      // Start dispatching requests
      this.#scheduleDrain()
    })()
  }

  /**
   *  Resolves once the [[_start]] has been called. This can be used in
   *  sub-classes to defer sending data until the connection has been
   *  established.
   */
  async _waitUntilReady(): Promise<void> {
    if (this.#notReady == null) {
      return
    }
    return await this.#notReady.promise
  }

  /**
   *  Return a Subscriber that will manage the %%sub%%.
   *
   *  Sub-classes may override this to modify the behavior of
   *  subscription management.
   */
  _getSubscriber(sub: Subscription): Subscriber {
    // Pending Filters aren't availble via polling
    if (sub.type === 'pending') {
      return new FilterIdPendingSubscriber(this)
    }

    if (sub.type === 'event') {
      if (this._getOption('polling')) {
        return new PollingEventSubscriber(this, sub.filter)
      }
      return new FilterIdEventSubscriber(this, sub.filter)
    }

    // Orphaned Logs are handled automatically, by the filter, since
    // logs with removed are emitted by it
    if (sub.type === 'orphan' && sub.filter.orphan === 'drop-log') {
      return new UnmanagedSubscriber('orphan')
    }

    return super._getSubscriber(sub)
  }

  /**
   *  Returns true only if the [[_start]] has been called.
   */
  get ready(): boolean {
    return this.#notReady == null
  }

  /**
   *  Returns %%tx%% as a normalized JSON-RPC transaction request,
   *  which has all values hexlified and any numeric values converted
   *  to Quantity values.
   */
  abstract getRpcTransaction(tx: TransactionRequest): JsonRpcTransactionRequest

  /**
   *  Returns the request method and arguments required to perform
   *  %%req%%.
   */
  abstract getRpcRequest(req: PerformActionRequest): null | { method: string; args: Array<any> }

  /**
   *  Returns an ethers-style Error for the given JSON-RPC error
   *  %%payload%%, coalescing the various strings and error shapes
   *  that different nodes return, coercing them into a machine-readable
   *  standardized error.
   */
  abstract getRpcError(payload: JsonRpcPayload, _error: JsonRpcError): Error

  /**
   *  Requests the %%method%% with %%params%% via the JSON-RPC protocol
   *  over the underlying channel. This can be used to call methods
   *  on the backend that do not have a high-level API within the Provider
   *  API.
   *
   *  This method queues requests according to the batch constraints
   *  in the options, assigns the request a unique ID.
   *
   *  **Do NOT override** this method in sub-classes; instead
   *  override [[_send]] or force the options values in the
   *  call to the constructor to modify this method's behavior.
   */
  send(method: string, params: Array<any> | Record<string, any>): Promise<any> {
    // @TODO: cache chainId?? purge on switch_networks

    const id = this.#nextId++
    const promise = new Promise((resolve, reject) => {
      this.#payloads.push({
        resolve,
        reject,
        payload: { method, params, id, jsonrpc: '2.0' }
      })
    })

    // If there is not a pending drainTimer, set one
    this.#scheduleDrain()

    return <Promise<JsonRpcResult>>promise
  }

  /**
   *  Resolves to the [[Signer]] account for  %%address%% managed by
   *  the client.
   *
   *  If the %%address%% is a number, it is used as an index in the
   *  the accounts from [[listAccounts]].
   *
   *  This can only be used on clients which manage accounts (such as
   *  Geth with imported account or MetaMask).
   *
   *  Throws if the account doesn't exist.
   */
  async getSigner(address?: number | string): Promise<JsonRpcSigner> {
    if (address == null) {
      address = 0
    }

    const accountsPromise = this.send('eth_accounts', [])

    // Account index
    if (typeof address === 'number') {
      const accounts = <Array<string>>await accountsPromise
      if (address >= accounts.length) {
        throw new Error('no such account')
      }
      return new JsonRpcSigner(this, accounts[address])
    }

    const { accounts } = await resolveProperties({
      network: this.getNetwork(),
      accounts: accountsPromise
    })

    // Account address
    address = getAddress(address, this.chainNamespace)
    for (const account of accounts) {
      if (getAddress(account, this.chainNamespace) === address) {
        return new JsonRpcSigner(this, address)
      }
    }

    throw new Error('invalid account')
  }

  async listAccounts(): Promise<Array<JsonRpcSigner>> {
    const accounts: Array<string> = await this.send('eth_accounts', [])
    return accounts.map((a) => new JsonRpcSigner(this, a))
  }
}

export abstract class JsonRpcApiPollingProvider extends JsonRpcApiProvider {
  #pollingInterval: number
  constructor(chainNamespace: ChainNamespace, network?: Networkish, options?: JsonRpcApiProviderOptions) {
    super(chainNamespace, network, options)

    this.#pollingInterval = 4000
  }

  _getSubscriber(sub: Subscription): Subscriber {
    const subscriber = super._getSubscriber(sub)
    if (isPollable(subscriber)) {
      subscriber.pollingInterval = this.#pollingInterval
    }
    return subscriber
  }

  /**
   *  The polling interval (default: 4000 ms)
   */
  get pollingInterval(): number {
    return this.#pollingInterval
  }
  set pollingInterval(value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error('invalid interval')
    }
    this.#pollingInterval = value
    this._forEachSubscriber((sub) => {
      if (isPollable(sub)) {
        sub.pollingInterval = this.#pollingInterval
      }
    })
  }
}

/**
 *  The JsonRpcProvider is one of the most common Providers,
 *  which performs all operations over HTTP (or HTTPS) requests.
 *
 *  Events are processed by polling the backend for the current block
 *  number; when it advances, all block-base events are then checked
 *  for updates.
 */
export abstract class JsonRpcProvider extends JsonRpcApiPollingProvider {
  #connect: FetchRequest

  constructor(chainNamespace: ChainNamespace, url: string | FetchRequest, network?: Networkish, options?: JsonRpcApiProviderOptions) {
    super(chainNamespace, network, options)

    if (typeof url === 'string') {
      this.#connect = new FetchRequest(url)
    } else {
      this.#connect = url.clone()
    }
  }

  _getConnection(): FetchRequest {
    return this.#connect.clone()
  }

  async send(method: string, params: Array<any> | Record<string, any>): Promise<any> {
    // All requests are over HTTP, so we can just start handling requests
    // We do this here rather than the constructor so that we don't send any
    // requests to the network (i.e. eth_chainId) until we absolutely have to.
    await this._start()

    return await super.send(method, params)
  }

  async _send(payload: JsonRpcPayload | Array<JsonRpcPayload>): Promise<Array<JsonRpcResult>> {
    // Configure a POST connection for the requested method
    const request = this._getConnection()
    request.body = JSON.stringify(payload)
    request.setHeader('content-type', 'application/json')

    const response = await request.send()
    response.assertOk()

    let resp = response.bodyJson
    if (!Array.isArray(resp)) {
      resp = [resp]
    }

    return resp
  }
}
