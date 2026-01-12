type RomajiMap = { [key: string]: string[] };

/**
 * A comprehensive Romaji mapping table.
 * Supports standard Hepburn and common typing variations (Kunrei-shiki, etc.)
 */
const ROMAJI_TABLE: RomajiMap = {
    'あ': ['a'], 'い': ['i', 'yi'], 'う': ['u', 'wu', 'whu'], 'え': ['e'], 'お': ['o'],
    'か': ['ka', 'ca'], 'き': ['ki'], 'く': ['ku', 'cu', 'qu'], 'け': ['ke'], 'こ': ['ko', 'co'],
    'さ': ['sa'], 'し': ['shi', 'si', 'ci'], 'す': ['su'], 'せ': ['se', 'ce'], 'そ': ['so'],
    'た': ['ta'], 'ち': ['chi', 'ti'], 'つ': ['tsu', 'tu'], 'て': ['te'], 'と': ['to'],
    'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
    'は': ['ha'], 'ひ': ['hi'], 'ふ': ['fu', 'hu'], 'へ': ['he'], 'ほ': ['ho'],
    'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
    'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
    'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
    'わ': ['wa'], 'を': ['wo'], 'ん': ['n', 'nn', "n'"],
    'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
    'ざ': ['za'], 'じ': ['ji', 'zi'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
    'だ': ['da'], 'ぢ': ['ji', 'di'], 'づ': ['zu', 'du'], 'で': ['de'], 'ど': ['do'],
    'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
    'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],
    // Small variations
    'ぁ': ['la', 'xa'], 'ぃ': ['li', 'xi'], 'ぅ': ['lu', 'xu'], 'ぇ': ['le', 'xe'], 'ぉ': ['lo', 'xo'],
    'ゃ': ['lya', 'xya'], 'ゅ': ['lyu', 'xyu'], 'ょ': ['lyo', 'xyo'],
    'っ': ['ltu', 'xtu', 'ltsu'], // Double consonant handled dynamically
    'ー': ['-'],
    // Combined sounds (Youon + others) often typed directly
    'きゃ': ['kya'], 'きゅ': ['kyu'], 'きょ': ['kyo'],
    'しゃ': ['sha', 'sya'], 'しゅ': ['shu', 'syu'], 'しょ': ['sho', 'syo'],
    'ちゃ': ['cha', 'cya', 'tya'], 'ちゅ': ['chu', 'cyu', 'tyu'], 'ちょ': ['cho', 'cyo', 'tyo'],
    'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
    'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
    'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
    'りゃ': ['rya'], 'りゅ': ['ryu'], 'りょ': ['ryo'],
    'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'],
    'じゃ': ['ja', 'jya', 'zya'], 'じゅ': ['ju', 'jyu', 'zyu'], 'じょ': ['jo', 'jyo', 'zyo'],
    'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
    'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],
    'ふぁ': ['fa'], 'ふぃ': ['fi'], 'ふぇ': ['fe'], 'ふぉ': ['fo'],
    'ゔ': ['vu'],
    'うぃ': ['wi'], 'うぇ': ['we'],
    'ヴ': ['vu'], // Katakana
    '、': [','], '。': ['.']
};

export class RomajiCore {
    private kanaText: string;
    private currentIndex: number = 0;
    private currentInputBuffer: string = "";

    constructor(kanaText: string) {
        this.kanaText = kanaText;
    }

    /**
     * Processes a key stroke.
     * Returns true if the key advances the state (correct input).
     * Returns false if the key is incorrect.
     */
    public input(key: string): boolean {
        if (this.isFinished()) return false;

        const remainingKana = this.kanaText.substring(this.currentIndex);
        const nextInputBuffer = this.currentInputBuffer + key;

        // 1. Check direct mapping (greedy)
        // We check 1 char (き), 2 chars (きょ), etc.
        // However, since we are building input char by char, we need to find if 'nextInputBuffer' 
        // is a valid PREFIX for the target kana's romaji.

        // Attempt to match the longest possible kana sequence starting at current index
        // e.g. "しゃ" -> prioritize "sha" over "shi"+"ya"? Actually usually "sha" is mapped in table.
        // The problem is "s" matches start of "shi" AND "su" AND "sa".
        // We need to know if the current Key is valid for the target.

        const matches = this.checkMatch(remainingKana, nextInputBuffer);

        if (matches) {
            this.currentInputBuffer = nextInputBuffer;

            // If exact completed match, advance
            if (matches.completedKanaCount > 0) {
                this.currentIndex += matches.completedKanaCount;
                this.currentInputBuffer = matches.remainingBuffer; // usually empty unless we implement type-ahead
            }
            return true;
        }

        return false;
    }

    public getProgress() {
        return {
            index: this.currentIndex,
            buffer: this.currentInputBuffer,
            toType: this.getNextExpectedRomaji() // Helper for UI
        };
    }

    public isFinished(): boolean {
        return this.currentIndex >= this.kanaText.length;
    }

    /**
     * Helper to determine valid next options for UI guidelines
     */
    private getNextExpectedRomaji(): string {
        if (this.isFinished()) return "";
        const remaining = this.kanaText.substring(this.currentIndex);

        // Check for small tsu special case
        if (remaining.startsWith('っ')) {
            if (remaining.length > 1) {
                const nextChar = remaining[1];
                const nextRomaji = this.getPossibleRomaji(nextChar)[0]; // naive
                if (nextRomaji) return nextRomaji[0] + nextRomaji; // "tt" from "ta"
            }
            return "xtu"; // Fallback
        }

        // Check 2 chars (compound)
        if (remaining.length >= 2) {
            const compound = remaining.substring(0, 2);
            if (ROMAJI_TABLE[compound]) return ROMAJI_TABLE[compound][0];
        }

        // 1 char
        const char = remaining[0];
        if (ROMAJI_TABLE[char]) return ROMAJI_TABLE[char][0];

        return char; // Non-mapped
    }

    private getPossibleRomaji(kana: string): string[] {
        return ROMAJI_TABLE[kana] || [];
    }

    /**
     * Core tricky logic: Check if 'input' is a valid prefix or complete match for the start of userKana
     */
    private checkMatch(text: string, input: string): { completedKanaCount: number, remainingBuffer: string } | null {
        // Strategy: 
        // Look at the first 1, 2, or 3 chars of 'text'.
        // See if 'input' matches any of their romaji forms OR is a prefix of them.

        // Try compound first (e.g. しゃ)
        if (text.length >= 2) {
            const twoChar = text.substring(0, 2); // しゃ
            if (this.matchesAnything(twoChar, input)) {
                if (this.isComplete(twoChar, input)) {
                    return { completedKanaCount: 2, remainingBuffer: "" };
                }
                return { completedKanaCount: 0, remainingBuffer: input };
            }
        }

        // Try single char (e.g. し)
        if (text.length >= 1) {
            const oneChar = text[0];

            // Special Case: "っ" (Sokuon)
            if (oneChar === 'っ') {
                // Sokuon logic: match input == first char of NEXT romaji consonant
                // If text is "っと", next is "to", input "t" is valid.
                if (text.length >= 2) {
                    const nextChar = text[1];
                    const nextConsonants = this.getConsonants(nextChar);
                    // input matches start of any next consonant?
                    // Actually, simplified: users type 't' for 'to', so we just check if input matches the first char of valid romaji for next char, AND input length is 1?
                    // Wait, if user typed "tt", the first "t" consumes "っ".

                    // If input is "t" and next is "to" ("t" is consonant), "t" consumes "っ".
                    // But wait, our 'input' accumulates. 
                    // If buffer was empty, and user types 't', input is 't'.
                    // We accept 't' for 'っ' IF next char starts with 't'.

                    // Let's rely on recursive checking via the table if we treat "tt" as "っ" + "t"?
                    // No, "っ" is special.

                    for (const cons of nextConsonants) {
                        if (input === cons) { // Complete consumption of 'っ'
                            return { completedKanaCount: 1, remainingBuffer: "" }; // "t" consumed "っ"?? No, normally "tt" -> "っt".
                            // Actually, standard typing: type 't', "っ" appears but waits for next 't'.
                            // My engine consumes kana. 
                            // If I type 't', does 'っ' get consumed? 
                            // Yes, visually. The 't' remains for the next char.
                            // So: completedKanaCount: 1, remainingBuffer: input?? 
                            // NO, that would mean 't' is stuck in buffer.
                            // Correct behavior: 't' consumes 'っ' AND counts as start of next char?
                            // Let's say we return completed: 1, buffer: input.
                            // Next step: text starts with 'と', buffer is 't'. 't' matches 'to' prefix.
                        }
                    }
                    // Allow 'xtu'/'ltu' for isolated 'っ'
                    if (this.matchesAnything('っ', input)) {
                        if (this.isComplete('っ', input)) return { completedKanaCount: 1, remainingBuffer: "" };
                        return { completedKanaCount: 0, remainingBuffer: input };
                    }
                }
            }

            // Special Case: "ん" (n)
            if (oneChar === 'ん') {
                // 1. 'nn', 'n'' always complete
                // 2. 'n' works IF:
                //    - End of string
                //    - Next char is NOT a vowel or 'y' or 'n' (sometimes)
                //    - Actually simpler: simple 'n' enters "pending state". 
                //      If user types next consonant (e.g. 'k'), 'n' is confirmed as 'ん'.
                //      In this engine, if 'input' is 'n', it is a valid prefix.
                //      If input is 'nk' (buffer+key), 'n' consumes 'ん', 'k' starts next?

                // This engine receives ONE accumulated buffer. 
                // If input is "n", it matches prefix of "nn".
                // If input is "n" + "k" (user typed n, then k), buffer becomes "nk".
                // We check "nk". Does "nk" match "ん"? No.
                // But "n" matched "ん". So we should have consumed "n" if valid?
                // Ah, my logic above: "If exact completed match, advance".
                // "n" is NOT exact match for "nn" in table.
                // We need 'n' to be a valid COMPLETE match for 'ん' in certain contexts.
                // Let's add 'n' to 'ん' table, but handle the "next char is vowel" conflict?
                // Actually, if I map 'ん': ['n', 'nn', "n'"], then 'n' just consumes it.
                // Requirement: If text is "nan" (なん), typing 'n' -> 'な', 'n' -> 'ん'? 
                // If user types 'n', 'a', then "na" consumes "な".
                // If user types 'n', 'n', then "nn" consumes "ん".
                // If user types 'n', 'k', then ...?

                // Simplification: Require 'nn' or "n'" for 'ん' unless auto-converted?
                // Most games accept single 'n' for 'ん' if followed by consonant.
                // Implementation: if buffer is 'n' and next char is consonant, split?
                // This function 'checkMatch' takes 'input' (accum string).
                // If input is "nk" (n + k), and text is "ん...", 
                // "n" matches "ん". "k" is left over.
                // -> completed: 1, buffer: "k".
            }

            if (this.matchesAnything(oneChar, input)) {
                if (this.isComplete(oneChar, input)) {
                    return { completedKanaCount: 1, remainingBuffer: "" };
                }
                return { completedKanaCount: 0, remainingBuffer: input };
            }

            // Trying to handle "buffer overflow" into next char (e.g. n + k -> n consumes ん, k remains)
            // Iterate all valid romaji for current char
            const validRomajis = this.getPossibleRomaji(oneChar);
            for (const r of validRomajis) {
                if (input.startsWith(r)) {
                    const leftOver = input.slice(r.length);
                    return { completedKanaCount: 1, remainingBuffer: leftOver };
                }
            }

            // Special handling for 'っ' via "next consonant"
            if (oneChar === 'っ' && text.length >= 2) {
                const nextChar = text[1];
                // If input starts with a char that is valid start of nextChar
                // e.g. text="っと", input="tt". start="t".
                // "t" is valid start of "to".
                // Treat first char of input as the Sokuon consumer IF it matches start of next.
                const firstKey = input[0];
                if (this.matchesPrefix(nextChar, firstKey)) {
                    // Consumed "っ" with 't'.

                    // If input is just "t", we consumed "っ", remaining buffer should be "t"?
                    // So visually "っ" is done. 
                    return { completedKanaCount: 1, remainingBuffer: input };
                }
            }

            // Special handling for single 'n' for 'ん'
            if (oneChar === 'ん') {
                if (input.startsWith('n')) {
                    // We have 'n'. Is it safe to consume?
                    const leftOver = input.slice(1);
                    // If leftOver is not empty (e.g. 'k'), then yes, consume 'ん'.
                    if (leftOver.length > 0) {
                        // Check if 'leftOver' is NOT a vowel/y.
                        if (!['a', 'i', 'u', 'e', 'o', 'y', 'n'].includes(leftOver[0])) {
                            return { completedKanaCount: 1, remainingBuffer: leftOver };
                        }
                    }
                }
            }
        }

        return null;
    }

    private matchesAnything(kana: string, input: string): boolean {
        const romajis = ROMAJI_TABLE[kana] || [];
        return romajis.some(r => r.startsWith(input));
    }

    private matchesPrefix(kana: string, key: string): boolean {
        const romajis = ROMAJI_TABLE[kana] || [];
        return romajis.some(r => r.startsWith(key));
    }

    private isComplete(kana: string, input: string): boolean {
        const romajis = ROMAJI_TABLE[kana] || [];
        return romajis.includes(input);
    }

    private getConsonants(kana: string): string[] {
        const romajis = ROMAJI_TABLE[kana] || [];
        // Extract first char of each romaji
        return [...new Set(romajis.map(r => r[0]))];
    }
}
