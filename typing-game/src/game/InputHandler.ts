/**
 * Simple Romaji to Kana mapping helper.
 * This is a simplified version. For a full production IME, you'd need a more complex state machine.
 * However, for a typing game, we usually just need to validate if the user's input *prefixes* match the target kana's romaji.
 */

// Mapping of Romaji to Hiragana (Small subset for demo, should be expanded)
const KANA_ROMAJI_MAP: Record<string, string[]> = {
    'あ': ['a'], 'い': ['i'], 'う': ['u'], 'え': ['e'], 'お': ['o'],
    'か': ['ka', 'ca'], 'き': ['ki'], 'く': ['ku', 'cu', 'qu'], 'け': ['ke'], 'こ': ['ko', 'co'],
    'さ': ['sa'], 'し': ['shi', 'si', 'ci'], 'す': ['su'], 'せ': ['se', 'ce'], 'そ': ['so'],
    'た': ['ta'], 'ち': ['chi', 'ti'], 'つ': ['tsu', 'tu'], 'て': ['te'], 'と': ['to'],
    'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
    'は': ['ha'], 'ひ': ['hi'], 'ふ': ['fu', 'hu'], 'へ': ['he'], 'ほ': ['ho'],
    'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
    'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
    'ら': ['ra'], 'り': ['ri'], 'ru': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
    'わ': ['wa'], 'を': ['wo'], 'ん': ['nn', 'xn', 'n'],
    'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
    'ざ': ['za'], 'じ': ['ji', 'zi'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
    'だ': ['da'], 'ぢ': ['ji', 'di'], 'づ': ['zu', 'du'], 'で': ['de'], 'ど': ['do'],
    'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
    'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],
    'ゃ': ['xy'], 'ゅ': ['xyu'], 'ょ': ['xyo'],
    'っ': ['xtu', 'xtsu'],
    'ー': ['-'],
};

// Expanded map for combo characters usually handled by the game logic
// e.g. 'shu' -> 'しゅ', 'kya' -> 'きゃ', etc.
// For simplicity in this game, we will treat the target string as a sequence of Kana,
// and match the user input against valid romaji expansions for the *current* kana.

export class InputHandler {
    private targetKana: string = "";
    private currentInput: string = ""; // What the user has typed for the current *Kana character*
    private currentIndex: number = 0; // Index in targetKana
    private totalTyped: number = 0;
    private totalMisses: number = 0;

    // Callback when a full kana is typed
    onKanaTyped: (index: number) => void = () => { };
    // Callback when input updates (valid key press)
    onInputUpdate: (valid: boolean, currentRomaji: string) => void = () => { };
    // Callback when user completes the whole sentence
    onComplete: () => void = () => { };

    setTarget(kana: string) {
        this.targetKana = kana;
        this.currentIndex = 0;
        this.currentInput = "";
    }

    // Returns true if the key was valid (part of the correct sequence)
    handleKey(key: string): boolean {
        if (this.currentIndex >= this.targetKana.length) return false;

        // Ignore non-char keys
        if (key.length !== 1) return false;


        // Simplification: We will just try to match the *current kana's* possible romaji.
        // If we have "ka", valid inputs are 'k'. Then logic waits for 'a'.

        // Complex logic:
        // We need to look ahead. 'kyo' -> 'き' 'ょ'. 
        // If user types 'k', it could be 'ka', 'ki', 'ky'...
        // If next is 'き' and after is 'ょ', we can accept 'k', 'y', 'o' for 'kyo'.
        // Or 'k', 'i', 'x', 'y', 'o' for 'kixyo'.

        // Let's implement a greedy approach with a lookup for the current "pending" chunk.

        // Since implementing a full Romaji automata is hard in one go, 
        // let's assume strict simple romaji for now, or just validate character by character if possible.
        // BUT, 'shi' vs 'si' is common.

        // Let's try to find *any* valid romaji for the char at currentIndex that starts with (currentInput + key).

        const possibleRomajis = this.getPossibleRomajis(this.currentIndex);
        const nextInput = this.currentInput + key;

        // Check if nextInput is a valid prefix of ANY possible romaji
        const isValidPrefix = possibleRomajis.some(r => r.startsWith(nextInput));

        if (isValidPrefix) {
            this.currentInput = nextInput;
            this.totalTyped++;

            // Check if we effectively completed one of the valid romajis
            const exactMatch = possibleRomajis.find(r => r === this.currentInput);
            if (exactMatch) {
                // We finished this char!
                // Wait, what if 'n' (ん) vs 'na'? 
                // If we have 'ん', valid is 'nn'. 'n' is prefix.
                // If user types 'n', it is prefix. 
                // If next char is NOT valid continuation for 'n' (implied 'nn'), we might accept 'n'.
                // But for simplicity, let's force strict matches from the map.

                // Special handling for small tsu (っ): it doubles the next consonant.
                // This requires lookahead.

                this.advanceChar(exactMatch.length);
            } else {
                this.onInputUpdate(true, this.currentInput);
            }
            return true;
        } else {
            this.totalMisses++;
            this.onInputUpdate(false, this.currentInput);
            return false;
        }
    }

    private advanceChar(_romajiLen: number) {
        // Advance logic
        // Check if we were handling a combo (not implemented well in this simple version, 
        // but let's assume 1 KANA = 1 unit of work for now, ignoring combinations like 'kya' being 2 chars in string 'きゃ')

        // Improvements for combinations:
        // If target is 'き' and next is 'ゃ', we should treat them as one unit 'きゃ'.

        let advanceCount = 1;
        const currentChar = this.targetKana[this.currentIndex];
        const nextChar = this.targetKana[this.currentIndex + 1];

        if (this.isCombo(currentChar, nextChar)) {
            advanceCount = 2;
        }

        this.currentIndex += advanceCount;
        this.currentInput = "";

        this.onKanaTyped(this.currentIndex);
        this.onInputUpdate(true, "");

        if (this.currentIndex >= this.targetKana.length) {
            this.onComplete();
        }
    }

    private isCombo(_c1: string, c2: string): boolean {
        const smalls = ['ゃ', 'ゅ', 'ょ', 'aa', 'ee', 'ii', 'oo', 'uu']; // Simplified
        return smalls.includes(c2);
    }

    private getPossibleRomajis(index: number): string[] {
        const c1 = this.targetKana[index];
        const c2 = this.targetKana[index + 1];

        // Handle double consonant (っ)
        if (c1 === 'っ') {
            if (!c2) return ['xtu', 'xtsu']; // Trailing small tsu
            // It can be 'xtu' OR the first char of the next romaji consonant
            const nextRomajis = this.getPossibleRomajis(index + 1);
            const doubled = nextRomajis.map(r => r[0] + r); // e.g. k+ka = kka
            return [...doubled, 'xtu', 'xtsu'];
        }

        // Handle combos
        if (this.isCombo(c1, c2)) {
            // e.g. き + ゃ = kya
            // Naive map:
            // We need a specific map for compounds if we want to support smooth 'kya' typing.
            // For now, let's just map c1 romaji + c2 romaji, avoiding 'ly' 'xy' if possible if 'kya' exists.
            // Actually, let's hardcode some common combos or they will be typed as 'ki' then 'xya' which is annoying.

            const combo = c1 + c2;
            if (COMBO_MAP[combo]) {
                return COMBO_MAP[combo];
            }
            // If a combo is detected by isCombo but not found in COMBO_MAP,
            // it's an unknown combo, so return a placeholder.
            return ['?'];
        }

        return KANA_ROMAJI_MAP[c1] || ['?'];
    }

    public getTargetRomaji(): string {
        let result = "";
        let i = 0;
        while (i < this.targetKana.length) {
            const c1 = this.targetKana[i];
            const c2 = this.targetKana[i + 1];

            // Handle double consonant (っ)
            if (c1 === 'っ') {
                if (!c2) {
                    result += "xtu";
                    i++;
                    continue;
                }
                // Look ahead to get the consonant to double
                // Reuse getPossibleRomajis logic for the next char
                // Note: getPossibleRomajis is private/instance based but takes index, so it works.
                const nextCandidates = this.getPossibleRomajis(i + 1);
                const nextRomaji = nextCandidates[0] || "?";
                result += nextRomaji.charAt(0);
                i++;
                continue;
            }

            // Handle combos
            if (this.isCombo(c1, c2)) {
                const combo = c1 + c2;
                const candidates = COMBO_MAP[combo] || ['?'];
                result += candidates[0];
                i += 2;
                continue;
            }

            // Normal
            const candidates = KANA_ROMAJI_MAP[c1] || ['?'];
            result += candidates[0];
            i++;
        }
        return result;
    }

    getStats() {
        return { typed: this.totalTyped, misses: this.totalMisses };
    }
}

const COMBO_MAP: Record<string, string[]> = {
    'きゃ': ['kya'], 'きゅ': ['kyu'], 'きょ': ['kyo'],
    'しゃ': ['sha', 'sya'], 'しゅ': ['shu', 'syu'], 'しょ': ['sho', 'syo'],
    'ちゃ': ['cha', 'tya'], 'ちゅ': ['chu', 'tyu'], 'ちょ': ['cho', 'tyo'],
    'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
    'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
    'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
    'りゃ': ['rya'], 'りゅ': ['ryu'], 'りょ': ['ryo'],
    'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'],
    'じゃ': ['ja', 'jya', 'zya'], 'じゅ': ['ju', 'jyu', 'zyu'], 'じょ': ['jo', 'jyo', 'zyo'],
    'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
    'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],
};
