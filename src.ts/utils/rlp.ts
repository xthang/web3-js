/**
 *  The [[link-rlp]] (RLP) encoding is used throughout Ethereum
 *  to serialize nested structures of Arrays and data.
 *
 *  @_subsection api/utils:Recursive-Length Prefix  [about-rlp]
 */

export { decodeRlp } from "./rlp-decode";
export { encodeRlp } from "./rlp-encode";

/**
 *  An RLP-encoded structure.
 */
export type RlpStructuredData = string | Array<RlpStructuredData>;

