export interface ScoreEntry {
    wpm: number;
    accuracy: number;
    date: string;
    timestamp: number;
}

const STORAGE_KEY = 'neon_velocity_scores';

export class RankingManager {
    static getScores(): ScoreEntry[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    static saveScore(wpm: number, accuracy: number): boolean {
        const scores = this.getScores();
        const newEntry: ScoreEntry = {
            wpm,
            accuracy,
            date: new Date().toLocaleDateString(),
            timestamp: Date.now()
        };

        scores.push(newEntry);

        // Sort by WPM desc, then Accuracy desc
        scores.sort((a, b) => {
            if (b.wpm !== a.wpm) return b.wpm - a.wpm;
            return b.accuracy - a.accuracy;
        });

        // Keep top 10
        const top10 = scores.slice(0, 10);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(top10));

        // Return true if this specific timestamp is in the top 10 (i.e., it was a high score)
        return top10.some(s => s.timestamp === newEntry.timestamp);
    }
}
