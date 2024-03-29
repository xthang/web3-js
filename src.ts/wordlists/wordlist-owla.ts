import { decodeOwlA } from './decode-owla.js'
import { WordlistOwl } from './wordlist-owl.js'

/**
 *  An OWL-A format Wordlist extends the OWL format to add an
 *  overlay onto an OWL format Wordlist to support diacritic
 *  marks.
 *
 *  This class is generally not useful to most developers as
 *  it is used mainly internally to keep Wordlists for languages
 *  based on latin-1 small.
 *
 *  If necessary, there are tools within the ``generation/`` folder
 *  to create these necessary data.
 */
export class WordlistOwlA extends WordlistOwl {
  #accent: string

  constructor(locale: string, data: string, accent: string, checksum: string) {
    super(locale, data, checksum)
    this.#accent = accent
  }

  get _accent(): string {
    return this.#accent
  }

  _decodeWords(): Array<string> {
    return decodeOwlA(this._data, this._accent)
  }
}
