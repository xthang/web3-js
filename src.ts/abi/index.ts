/**
 *  Explain about ABI here...
 *
 *  @_section api/abi:Application Binary Interface  [about-abi]
 *  @_navTitle: ABI
 */


//////
export { AbiCoder } from "./abi-coder";

export { decodeBytes32String, encodeBytes32String } from "./bytes32";

export {
    ConstructorFragment, ErrorFragment, EventFragment, FallbackFragment,
    Fragment, FunctionFragment, NamedFragment, ParamType, StructFragment,
} from "./fragments";

export {
    checkResultErrors,
    Indexed,
    Interface,
    ErrorDescription, LogDescription, TransactionDescription,
    Result
} from "./interface";

export { Typed } from "./typed";

export type {
    JsonFragment, JsonFragmentType,
    FormatType, FragmentType, ParamTypeWalkAsyncFunc, ParamTypeWalkFunc
} from "./fragments";

export type {
    InterfaceAbi,
} from "./interface";

