/**
 *  There are many simple utilities required to interact with
 *  Ethereum and to simplify the library, without increasing
 *  the library dependencies for simple functions.
 *
 *  @_section api/utils:Utilities  [about-utils]
 */

export * from "./base58";

export * from "./base64";

export {
    getBytes, getBytesCopy, isHexString, isBytesLike, hexlify, concat, dataLength, dataSlice,
    stripZerosLeft, zeroPadValue, zeroPadBytes
} from "./data";

export {
    isCallException, isError,
    assert, assertArgument, assertArgumentCount, assertPrivate, assertNormalize, makeError
} from "./errors"

export { EventPayload } from "./events";

export {
    FetchRequest, FetchResponse, FetchCancelSignal,
} from "./fetch";

export { FixedNumber } from "./fixednumber"

export {
    fromTwos, toTwos, mask,
    getBigInt, getNumber, getUint, toBigInt, toNumber, toBeHex, toBeArray, toQuantity
} from "./maths";

export { resolveProperties, defineProperties} from "./properties";

export { decodeRlp } from "./rlp-decode";
export { encodeRlp } from "./rlp-encode";

export { formatEther, parseEther, formatUnits, parseUnits } from "./units";

export {
    toUtf8Bytes,
    toUtf8CodePoints,
    toUtf8String,

    Utf8ErrorFuncs,
} from "./utf8";

export { uuidV4 } from "./uuid";

/////////////////////////////
// Types

export type { BytesLike } from "./data";

export type {

    //ErrorFetchRequestWithBody, ErrorFetchRequest,
    //ErrorFetchResponseWithBody, ErrorFetchResponse,

    ErrorCode,

    EthersError, UnknownError, NotImplementedError, UnsupportedOperationError, NetworkError,
    ServerError, TimeoutError, BadDataError, CancelledError, BufferOverrunError,
    NumericFaultError, InvalidArgumentError, MissingArgumentError, UnexpectedArgumentError,
    CallExceptionError, InsufficientFundsError, NonceExpiredError, OffchainFaultError,
    ReplacementUnderpricedError, TransactionReplacedError, UnconfiguredNameError,
    ActionRejectedError,

    CallExceptionAction, CallExceptionTransaction,

    CodedEthersError
} from "./errors"

export type { EventEmitterable, Listener } from "./events";

export type {
    GetUrlResponse,
    FetchPreflightFunc, FetchProcessFunc, FetchRetryFunc,
    FetchGatewayFunc, FetchGetUrlFunc
} from "./fetch";

export type { FixedFormat } from "./fixednumber"

export type { BigNumberish, Numeric } from "./maths";

export type { RlpStructuredData } from "./rlp";

export type {
    Utf8ErrorFunc,
    UnicodeNormalizationForm,
    Utf8ErrorReason
} from "./utf8";
