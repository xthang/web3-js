/**
 *  About hashing here...
 *
 *  @_section: api/hashing:Hashing Utilities  [about-hashing]
 */

export { id } from "./id"
export { ensNormalize, isValidName, namehash, dnsEncode } from "./namehash";
export { hashMessage, verifyMessage } from "./message";
export {
    solidityPacked, solidityPackedKeccak256, solidityPackedSha256
} from "./solidity";
export { TypedDataEncoder, verifyTypedData } from "./typed-data";

export type { TypedDataDomain, TypedDataField } from "./typed-data";
