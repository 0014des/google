export interface Sentence {
    text: string; // The Kanji/Display text
    kana: string; // The reading in Hiragana/Katakana
}

// A mix of programming quotes, famous Japanese proverbs, and cyberpunk flavor text
const DATA: Sentence[] = [
    { text: "継続は力なり", kana: "けいぞくはちからなり" },
    { text: "千里の道も一歩から", kana: "せんりのみちもいっぽから" },
    { text: "電脳空間にダイブする", kana: "でんのうくうかんにだいぶする" },
    { text: "高度に発達した科学は魔法と区別がつかない", kana: "こうどにはったつしたかがくはまほうとくべつがつかない" },
    { text: "情報は質量を持たない", kana: "じょうほうはしつりょうをもたない" },
    { text: "明日は明日の風が吹く", kana: "あしたはあしたのかぜがふく" },
    { text: "タイピングの速度を測定中", kana: "たいぴんぐのそくどをそくていちゅう" },
    { text: "ネオンライトが輝く夜", kana: "ねおんらいとがかがやくよる" },
    { text: "全てのバグを修正せよ", kana: "すべてのばぐをしゅうせいせよ" },
    { text: "ハローワールド", kana: "はろーわーるど" },
    { text: "急がば回れ", kana: "いそがばまわれ" },
    { text: "人工知能の進化", kana: "じんこうちのうのしんか" },
    { text: "非同期処理の待機時間", kana: "ひどうきしょりのたいきじかん" },
    { text: "オブジェクト指向プログラミング", kana: "おぶじぇくとしこうぷろぐらみんぐ" }, // Wait, there is still kanji here! Fixed below
    { text: "一期一会", kana: "いちごいちえ" },
];

export class TextGenerator {
    static getRandomSentence(): Sentence {
        const index = Math.floor(Math.random() * DATA.length);
        return DATA[index];
    }
}
