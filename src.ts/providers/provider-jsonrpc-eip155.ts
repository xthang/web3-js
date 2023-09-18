/**
 *  About JSON-RPC...
 *
 * @_section: api/providers/jsonrpc:JSON-RPC Provider  [about-jsonrpcProvider]
 */

// @TODO:
// - Add the batching API

// https://playground.open-rpc.org/?schemaUrl=https://raw.githubusercontent.com/ethereum/eth1.0-apis/assembled-spec/openrpc.json&uiSchema%5BappBar%5D%5Bui:splitView%5D=true&uiSchema%5BappBar%5D%5Bui:input%5D=false&uiSchema%5BappBar%5D%5Bui:examplesDropdown%5D=false

import { AbiCoder } from '../abi/index.js'
import { accessListify, TransactionLike } from '../transaction/index.js'
import { toQuantity, getBigInt, hexlify, makeError, isHexString } from '../utils/index.js'
import { PerformActionRequest } from './abstract-provider.js'
import { JsonRpcError, JsonRpcPayload, JsonRpcProvider, JsonRpcTransactionRequest } from './provider-jsonrpc.js'
import { TransactionRequest } from './provider.js'

function getLowerCase(value: string): string {
  if (value) {
    return value.toLowerCase()
  }
  return value
}

function spelunkData(value: any): null | { message: string; data: string } {
  if (value == null) {
    return null
  }

  // These *are* the droids we're looking for.
  if (typeof value.message === 'string' && value.message.match('reverted') && isHexString(value.data)) {
    return { message: value.message, data: value.data }
  }

  // Spelunk further...
  if (typeof value === 'object') {
    for (const key in value) {
      const result = spelunkData(value[key])
      if (result) {
        return result
      }
    }
    return null
  }

  // Might be a JSON string we can further descend...
  if (typeof value === 'string') {
    try {
      return spelunkData(JSON.parse(value))
    } catch (error) {
      /* empty */
    }
  }

  return null
}

function _spelunkMessage(value: any, result: Array<string>): void {
  if (value == null) {
    return
  }

  // These *are* the droids we're looking for.
  if (typeof value.message === 'string') {
    result.push(value.message)
  }

  // Spelunk further...
  if (typeof value === 'object') {
    for (const key in value) {
      _spelunkMessage(value[key], result)
    }
  }

  // Might be a JSON string we can further descend...
  if (typeof value === 'string') {
    try {
      return _spelunkMessage(JSON.parse(value), result)
    } catch (error) {
      /* empty */
    }
  }
}

function spelunkMessage(value: any): Array<string> {
  const result: Array<string> = []
  _spelunkMessage(value, result)
  return result
}

export class Eip155JsonRpcProvider extends JsonRpcProvider {
  /**
   *  Returns %%tx%% as a normalized JSON-RPC transaction request,
   *  which has all values hexlified and any numeric values converted
   *  to Quantity values.
   */
  getRpcTransaction(tx: TransactionRequest): JsonRpcTransactionRequest {
    const result: JsonRpcTransactionRequest = {}

    // JSON-RPC now requires numeric values to be "quantity" values
    ;['chainId', 'gasLimit', 'gasPrice', 'type', 'maxFeePerGas', 'maxPriorityFeePerGas', 'nonce', 'value'].forEach((key) => {
      if ((<any>tx)[key] == null) {
        return
      }
      let dstKey = key
      if (key === 'gasLimit') {
        dstKey = 'gas'
      }
      ;(<any>result)[dstKey] = toQuantity(getBigInt((<any>tx)[key], `tx.${key}`))
    })

    // Make sure addresses and data are lowercase
    ;['from', 'to', 'data'].forEach((key) => {
      if ((<any>tx)[key] == null) {
        return
      }
      ;(<any>result)[key] = hexlify((<any>tx)[key])
    })

    // Normalize the access list object
    if (tx.accessList) {
      result['accessList'] = accessListify(tx.accessList)
    }

    return result
  }

  /**
   *  Returns the request method and arguments required to perform
   *  %%req%%.
   */
  getRpcRequest(req: PerformActionRequest): null | { method: string; args: Array<any> } {
    switch (req.method) {
      case 'chainId':
        return { method: 'eth_chainId', args: [] }

      case 'getBlockNumber':
        return { method: 'eth_blockNumber', args: [] }

      case 'getGasPrice':
        return { method: 'eth_gasPrice', args: [] }

      case 'getBalance':
        return {
          method: 'eth_getBalance',
          args: [getLowerCase(req.address), req.blockTag]
        }

      case 'getTransactionCount':
        return {
          method: 'eth_getTransactionCount',
          args: [getLowerCase(req.address), req.blockTag]
        }

      case 'getCode':
        return {
          method: 'eth_getCode',
          args: [getLowerCase(req.address), req.blockTag]
        }

      case 'getStorage':
        return {
          method: 'eth_getStorageAt',
          args: [getLowerCase(req.address), '0x' + req.position.toString(16), req.blockTag]
        }

      case 'broadcastTransaction':
        return {
          method: 'eth_sendRawTransaction',
          args: [req.signedTransaction]
        }

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

      case 'getTransaction':
        return {
          method: 'eth_getTransactionByHash',
          args: [req.hash]
        }

      case 'getTransactionReceipt':
        return {
          method: 'eth_getTransactionReceipt',
          args: [req.hash]
        }

      case 'call':
        return {
          method: 'eth_call',
          args: [this.getRpcTransaction(req.transaction), req.blockTag]
        }

      case 'estimateGas': {
        return {
          method: 'eth_estimateGas',
          args: [this.getRpcTransaction(req.transaction)]
        }
      }

      case 'getLogs':
        if (req.filter && req.filter.address != null) {
          if (Array.isArray(req.filter.address)) {
            req.filter.address = req.filter.address.map(getLowerCase)
          } else {
            req.filter.address = getLowerCase(req.filter.address)
          }
        }
        return { method: 'eth_getLogs', args: [req.filter] }
    }

    return null
  }

  /**
   *  Returns an ethers-style Error for the given JSON-RPC error
   *  %%payload%%, coalescing the various strings and error shapes
   *  that different nodes return, coercing them into a machine-readable
   *  standardized error.
   */
  getRpcError(payload: JsonRpcPayload, _error: JsonRpcError): Error {
    const { method } = payload
    const { error } = _error

    if (method === 'eth_estimateGas' && error.message) {
      const msg = error.message
      if (!msg.match(/revert/i) && msg.match(/insufficient funds/i)) {
        return makeError('insufficient funds', 'INSUFFICIENT_FUNDS', {
          transaction: (<any>payload).params[0],
          info: { payload, error }
        })
      }
    }

    if (method === 'eth_call' || method === 'eth_estimateGas') {
      const result = spelunkData(error)

      const e = AbiCoder.getBuiltinCallException(this.chainNamespace, method === 'eth_call' ? 'call' : 'estimateGas', (<any>payload).params[0], result ? result.data : null)
      e.info = { error, payload }
      return e
    }

    // Only estimateGas and call can return arbitrary contract-defined text, so now we
    // we can process text safely.

    const message = JSON.stringify(spelunkMessage(error))

    if (typeof error.message === 'string' && error.message.match(/user denied|ethers-user-denied/i)) {
      const actionMap: Record<string, 'requestAccess' | 'sendTransaction' | 'signMessage' | 'signTransaction' | 'signTypedData'> = {
        eth_sign: 'signMessage',
        personal_sign: 'signMessage',
        eth_signTypedData_v4: 'signTypedData',
        eth_signTransaction: 'signTransaction',
        eth_sendTransaction: 'sendTransaction',
        eth_requestAccounts: 'requestAccess',
        wallet_requestAccounts: 'requestAccess'
      }

      return makeError(`user rejected action`, 'ACTION_REJECTED', {
        action: actionMap[method] || 'unknown',
        reason: 'rejected',
        info: { payload, error }
      })
    }

    if (method === 'eth_sendRawTransaction' || method === 'eth_sendTransaction') {
      const transaction = <TransactionLike<string>>(<any>payload).params[0]

      if (message.match(/insufficient funds|base fee exceeds gas limit/i)) {
        return makeError('insufficient funds for intrinsic transaction cost', 'INSUFFICIENT_FUNDS', {
          transaction,
          info: { error }
        })
      }

      if (message.match(/nonce/i) && message.match(/too low/i)) {
        return makeError('nonce has already been used', 'NONCE_EXPIRED', { transaction, info: { error } })
      }

      // "replacement transaction underpriced"
      if (message.match(/replacement transaction/i) && message.match(/underpriced/i)) {
        return makeError('replacement fee too low', 'REPLACEMENT_UNDERPRICED', { transaction, info: { error } })
      }

      if (message.match(/only replay-protected/i)) {
        return makeError('legacy pre-eip-155 transactions not supported', 'UNSUPPORTED_OPERATION', {
          operation: method,
          info: { transaction, info: { error } }
        })
      }
    }

    if (message.match(/the method .* does not exist/i)) {
      return makeError('unsupported operation', 'UNSUPPORTED_OPERATION', {
        operation: payload.method,
        info: { error }
      })
    }

    return makeError('could not coalesce error', 'UNKNOWN_ERROR', { payload, error })
  }
}
