/**
 *  Transactions..
 *
 *  @_section api/transaction:Transactions  [about-transactions]
 */

null;

/**
 *  A single [[AccessList]] entry of storage keys (slots) for an address.
 */
export type AccessListEntry = { address: string, storageKeys: Array<string> };

/**
 *  An ordered collection of [[AccessList]] entries.
 */
export type AccessList = Array<AccessListEntry>;

/**
 *  Any ethers-supported access list structure.
 */
export type AccessListish = AccessList |
                            Array<[ string, Array<string> ]> |
                            Record<string, Array<string>>;


export { accessListify } from "./accesslist";
export { computeAddress, recoverAddress } from "./address";
export { Transaction } from "./transaction";

export type { TransactionLike } from "./transaction";
