import { Transaction } from '@solana/web3.js'
import type { EventFragment, FunctionFragment, Result, Typed } from '../abi/index'
import type { TransactionRequest, PreparedTransactionRequest, TopicFilter } from '../providers/index'
import { ChainNamespace } from '../providers/network'
import { TronTransactionType } from '../wallet'

import type { ContractTransactionResponse } from './wrappers'

// The types of events a Contract can listen for
export type ContractEventName = string | ContractEvent | TopicFilter | DeferredTopicFilter

export interface ContractInterface {
  [name: string]: BaseContractMethod
}

export interface DeferredTopicFilter {
  getTopicFilter(): Promise<TopicFilter>
  fragment: EventFragment
}

export interface ContractTransaction extends PreparedTransactionRequest {
  // These are populated by contract methods and cannot bu null
  to: string
  data: string

  // These are resolved
  from?: string

  // For other chain types
  solana?: {
    // transactionType: SolanaTransactionType
    transaction: Transaction
  }
  tron?: {
    transactionType: TronTransactionType
    function: string
    parameter: any[]
  }
}

// Deployment Transactions have no `to`
export type ContractDeployTransaction = Omit<ContractTransaction, 'to'>

// Overrides; cannot override `to` or `data` as Contract populates these
export type Overrides = Omit<TransactionRequest, 'to' | 'data'>

// Arguments for methods; with an optional (n+1)th Override
export type PostfixOverrides<A extends Array<any>> = A | [...A, Overrides]
export type ContractMethodArgs<A extends Array<any>> = PostfixOverrides<{ [I in keyof A]-?: A[I] | Typed }>

// A = Arguments passed in as a tuple
// R = The result type of the call (i.e. if only one return type,
//     the qualified type, otherwise Result)
// D = The type the default call will return (i.e. R for view/pure,
//     TransactionResponse otherwise)
export interface BaseContractMethod<A extends Array<any> = Array<any>, R = any, D extends R | ContractTransactionResponse = R | ContractTransactionResponse> {
  (...args: ContractMethodArgs<A>): Promise<D>

  name: string

  fragment: FunctionFragment

  getFragment(...args: ContractMethodArgs<A>): FunctionFragment

  populateTransaction(...args: ContractMethodArgs<A>): Promise<ContractTransaction>
  staticCall(...args: ContractMethodArgs<A>): Promise<R>
  send(...args: ContractMethodArgs<A>): Promise<ContractTransactionResponse>
  estimateGas(...args: ContractMethodArgs<A>): Promise<bigint>
  staticCallResult(...args: ContractMethodArgs<A>): Promise<Result>
}

export type ContractMethod<A extends Array<any> = Array<any>, R = any, D extends R | ContractTransactionResponse = R | ContractTransactionResponse> = BaseContractMethod<A, R, D>

export type ConstantContractMethod<A extends Array<any>, R = any> = ContractMethod<A, R, R>

// Arguments for events; with each element optional and/or nullable
export type ContractEventArgs<A extends Array<any>> = { [I in keyof A]?: A[I] | Typed | null }

export interface ContractEvent<A extends Array<any> = Array<any>> {
  (...args: ContractEventArgs<A>): DeferredTopicFilter

  name: string

  fragment: EventFragment
  getFragment(...args: ContractEventArgs<A>): EventFragment
}

export interface WrappedFallback {
  (overrides?: Omit<TransactionRequest, 'to'>): Promise<ContractTransactionResponse>

  populateTransaction(chainNamespace: ChainNamespace, overrides?: Omit<TransactionRequest, 'to'>): Promise<ContractTransaction>
  staticCall(chainNamespace: ChainNamespace, overrides?: Omit<TransactionRequest, 'to'>): Promise<string>
  send(chainNamespace: ChainNamespace, overrides?: Omit<TransactionRequest, 'to'>): Promise<ContractTransactionResponse>
  estimateGas(chainNamespace: ChainNamespace, overrides?: Omit<TransactionRequest, 'to'>): Promise<bigint>
}
