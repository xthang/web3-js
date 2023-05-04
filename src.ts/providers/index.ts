/**
 *  About providers.
 *
 *  @_section: api/providers:Providers  [about-providers]
 */

export { AbstractProvider as AbstractProvider, UnmanagedSubscriber } from "./abstract-provider";

export { AbstractSigner, VoidSigner } from "./abstract-signer";
export { AbstractEip155Signer } from "./abstract-signer-eip155";
export { AbstractSolanaSigner } from "./abstract-signer-solana";
export { AbstractTronSigner, } from "./abstract-signer-tron";

export { showThrottleMessage } from "./community";

// export { getDefaultProvider } from "./default-provider";

export { EnsResolver } from "./ens-resolver";

export { Network, ChainNamespace } from "./network";

export { NonceManager } from "./signer-noncemanager";

export {
    NetworkPlugin,
    GasCostPlugin,
    EnsPlugin,
    FeeDataNetworkPlugin,
} from "./plugins-network";

export {
    Block,
    FeeData,
    Log,
    TransactionReceipt,
    TransactionResponse,

    copyRequest,
    //resolveTransactionRequest,
} from "./provider";

// export { FallbackProvider } from "./provider-fallback";
export { JsonRpcApiProvider, JsonRpcProvider, JsonRpcSigner } from "./provider-jsonrpc"

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

export type {
    Subscription, Subscriber,
    AbstractProviderPlugin,
    PerformActionFilter, PerformActionTransaction, PerformActionRequest,
} from "./abstract-provider"

export type { ContractRunner } from "./contracts";

export type {
    BlockParams, LogParams, TransactionReceiptParams,
    TransactionResponseParams,
} from "./formatting";

/*
export type {
    CommunityResourcable
} from "./community";

export type {
    AvatarLinkageType, AvatarLinkage, AvatarResult
} from "./ens-resolver";
*/
export type { Networkish } from "./network";

export type { GasCostParameters } from "./plugins-network";

export type {
    BlockTag,
    TransactionRequest, PreparedTransactionRequest,
    EventFilter, Filter, FilterByBlockHash, OrphanFilter, ProviderEvent,
    TopicFilter,
    Provider,
    MinedBlock, MinedTransactionResponse
} from "./provider";

// export type {
//     DebugEventBrowserProvider, Eip1193Provider
// } from "./provider-browser";

export type {
    JsonRpcPayload, JsonRpcResult, JsonRpcError,
    JsonRpcApiProviderOptions,
    JsonRpcTransactionRequest,
} from "./provider-jsonrpc";

// export type {
//     WebSocketCreator, WebSocketLike
// } from "./provider-websocket";

export { TronProvider } from './provider-tron'
export { SolanaJsonRpcProvider } from './provider-jsonrpc-solana'

export type { Signer } from "./signer";

