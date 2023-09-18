import { isPromise } from 'util/types'
import { AddressLike, convertToHexAddress, resolveAddress } from '../address/index.js'
import { TRON_ADDRESS_PREFIX } from '../constants/addresses.js'
import { FetchRequest } from '../utils/index.js'
import { PerformActionTransaction } from './abstract-provider.js'
import { ChainNamespace, Networkish } from './network.js'
import { Eip155JsonRpcProvider } from './provider-jsonrpc-eip155.js'
import { JsonRpcApiProviderOptions } from './provider-jsonrpc.js'
import { TransactionRequest, copyRequest } from './provider.js'

export class TronJsonRpcProvider extends Eip155JsonRpcProvider {
  readonly chainNamespace = ChainNamespace.tron

  constructor(url: string | FetchRequest, network?: Networkish, options?: JsonRpcApiProviderOptions) {
    super(ChainNamespace.tron, url, network, options)
  }

  _getAddress(address: AddressLike): string | Promise<string> {
    const resolvedAddress = resolveAddress(address, this.chainNamespace, this)
    if (typeof resolvedAddress === 'string') return convertToHexAddress(resolvedAddress, this.chainNamespace)
    else return resolvedAddress.then((it) => convertToHexAddress(it, this.chainNamespace))
  }

  _getTransactionRequest(_request: TransactionRequest): PerformActionTransaction | Promise<PerformActionTransaction> {
    const request = <PerformActionTransaction>copyRequest(_request)

    const promises: Array<Promise<void>> = []
    ;['to', 'from'].forEach((key) => {
      if ((<any>request)[key] == null) {
        return
      }

      // for call request: addr is base58
      const addr = resolveAddress((<any>request)[key], this.chainNamespace)
      if (isPromise(addr)) {
        promises.push(
          (async () => {
            ;(<any>request)[key] = '0x' + TRON_ADDRESS_PREFIX + convertToHexAddress(await addr, this.chainNamespace).substring(2)
          })()
        )
      } else {
        ;(<any>request)[key] = '0x' + TRON_ADDRESS_PREFIX + convertToHexAddress(addr, this.chainNamespace).substring(2)
      }
    })

    if (request.blockTag != null) {
      const blockTag = this._getBlockTag(request.blockTag)
      if (isPromise(blockTag)) {
        promises.push(
          (async function () {
            request.blockTag = await blockTag
          })()
        )
      } else {
        request.blockTag = blockTag
      }
    }

    if (promises.length) {
      return (async function () {
        await Promise.all(promises)
        return request
      })()
    }

    return request
  }
}
