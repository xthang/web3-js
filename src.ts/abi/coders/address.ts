import { convertToHexAddress, formatHexAddress } from "../../address/index";
import { ChainNamespace } from "../../providers";
import { toBeHex } from "../../utils/maths";
import { Typed } from "../typed";
import { Coder } from "./abstract-coder";
import type { Reader, Writer } from "./abstract-coder";


/**
 *  @_ignore
 */
export class AddressCoder extends Coder {
    readonly #chainNamespace: ChainNamespace

    constructor(chainNamespace: ChainNamespace, localName: string) {
        super("address", "address", localName, false);

        this.#chainNamespace = chainNamespace
    }

    defaultValue(): string {
        return "0x0000000000000000000000000000000000000000";
    }

    encode(writer: Writer, _value: string | Typed): number {
        let value = Typed.dereference(_value, "string");
        try {
            value = convertToHexAddress(value, this.#chainNamespace);
        } catch (error: any) {
            return this._throwError(error.message, _value);
        }
        return writer.writeValue(value);
    }

    decode(reader: Reader): any {
        return formatHexAddress(toBeHex(reader.readValue(), 20));
    }
}
