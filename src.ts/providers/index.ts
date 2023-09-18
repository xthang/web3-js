/**
 *  About providers.
 *
 *  @_section: api/providers:Providers  [about-providers]
 */

export { AbstractProvider as AbstractProvider, UnmanagedSubscriber } from './abstract-provider.js'

export { AbstractSigner, VoidSigner } from './abstract-signer.js'
export { AbstractEip155Signer } from './abstract-signer-eip155.js'
export { AbstractSolanaSigner } from './abstract-signer-solana.js'
export { AbstractTronSigner } from './abstract-signer-tron.js'

export { showThrottleMessage } from './community.js'

// export { getDefaultProvider } from "./default-provider.js";

export { EnsResolver } from './ens-resolver.js'

export { Network, ChainNamespace } from './network.js'

export { NonceManager } from './signer-noncemanager.js'

export { NetworkPlugin, GasCostPlugin, EnsPlugin, FeeDataNetworkPlugin } from './plugins-network.js'

export {
  Block,
  FeeData,
  Log,
  TransactionReceipt,
  TransactionResponse,
  copyRequest
  //resolveTransactionRequest,
} from './provider.js'

// export { FallbackProvider } from "./provider-fallback.js";
export { JsonRpcApiProvider, JsonRpcProvider, JsonRpcSigner } from './provider-jsonrpc.js'

// export { BrowserProvider } from "./provider-browser";

// export { AlchemyProvider } from "./provider-alchemy";
// export { AnkrProvider } from "./provider-ankr";
// export { CloudflareProvider } from "./provider-cloudflare";
// export { EtherscanProvider, EtherscanPlugin } from "./provider-etherscan";
// export { InfuraProvider, InfuraWebSocketProvider } from "./provider-infura";
// export { PocketProvider } from "./provider-pocket";
// export { QuickNodeProvider } from "./provider-quicknode";

// import { IpcSocketProvider } from "./provider-ipcsocket"; /*-browser*/
// export { IpcSocketProvider };
// export { SocketProvider } from "./provider-socket";
// export { WebSocketProvider } from "./provider-websocket";

// export {
//     SocketSubscriber, SocketBlockSubscriber, SocketPendingSubscriber,
//     SocketEventSubscriber
// } from "./provider-socket";

export type { Subscription, Subscriber, AbstractProviderPlugin, PerformActionFilter, PerformActionTransaction, PerformActionRequest } from './abstract-provider.js'

export type { ContractRunner } from './contracts.js'

export type { BlockParams, LogParams, TransactionReceiptParams, TransactionResponseParams } from './formatting.js'

/*
export type {
    CommunityResourcable
} from "./community";

export type {
    AvatarLinkageType, AvatarLinkage, AvatarResult
} from "./ens-resolver";
*/
export type { Networkish } from './network.js'

export type { GasCostParameters } from './plugins-network.js'

export type {
  BlockTag,
  TransactionRequest,
  PreparedTransactionRequest,
  EventFilter,
  Filter,
  FilterByBlockHash,
  OrphanFilter,
  ProviderEvent,
  TopicFilter,
  Provider,
  MinedBlock,
  MinedTransactionResponse
} from './provider.js'

// export type {
//     DebugEventBrowserProvider, Eip1193Provider
// } from "./provider-browser";

export type { JsonRpcPayload, JsonRpcResult, JsonRpcError, JsonRpcApiProviderOptions, JsonRpcTransactionRequest } from './provider-jsonrpc.js'

// export type {
//     WebSocketCreator, WebSocketLike
// } from "./provider-websocket";

export { Eip155JsonRpcProvider } from './provider-jsonrpc-eip155.js'
export { TronProvider } from './provider-tron.js'
export { SolanaJsonRpcProvider } from './provider-jsonrpc-solana.js'

export type { Signer } from './signer.js'
