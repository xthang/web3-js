
import { LangEn } from "./lang-en";

import type { Wordlist } from "./wordlist";

export const wordlists: Record<string, Wordlist> = {
  en: LangEn.wordlist(),
};
