import { InputHandler } from './InputHandler';
import { TextGenerator, type Sentence } from './TextGenerator';


export class GameEngine {
    private inputHandler: InputHandler;
    private isRunning: boolean = false;
    private startTime: number = 0;
    private timerInterval: number = 0;

    // Current Game State
    private sentencesToType: number = 5;
    private sentencesCompletedkq: number = 0;
    private currentSentence: Sentence | null = null;

    // UI Elements
    private elDisplayText = document.getElementById('display-text')!;
    private elKanaContainer = document.getElementById('kana-container')!;
    private elRomajiGuide = document.getElementById('romaji-guide')!;
    private elInputBuffer = document.getElementById('input-buffer')!;
    private elWpm = document.getElementById('wpm-display')!;
    private elAcc = document.getElementById('accuracy-display')!;
    private elScore = document.getElementById('score-display')!;
    private elTypingArea = document.getElementById('typing-area')!;

    private onFinishCallback: (wpm: number, accuracy: number) => void = () => { };

    constructor() {
        this.inputHandler = new InputHandler();
        this.setupHandlerEvents();

        // Bind global keydown
        window.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            // Prevent default for some keys if needed, but usually typing is fine
            if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                this.inputHandler.handleKey(e.key.toLowerCase());
            }
        });
    }

    public setOnFinish(cb: (wpm: number, acc: number) => void) {
        this.onFinishCallback = cb;
    }

    public start() {
        this.isRunning = true;
        this.sentencesCompletedkq = 0;
        this.startTime = Date.now();
        this.inputHandler = new InputHandler(); // Reset stats
        this.setupHandlerEvents();

        this.nextSentence();
        this.startTimer();
    }

    private setupHandlerEvents() {
        this.inputHandler.onInputUpdate = (valid, currentRomaji) => {
            this.updateInputUI(valid, currentRomaji);
        };

        this.inputHandler.onKanaTyped = (index) => {
            this.updateKanaUI(index);
        };

        this.inputHandler.onComplete = () => {
            this.sentencesCompletedkq++;
            if (this.sentencesCompletedkq >= this.sentencesToType) {
                this.finishGame();
            } else {
                this.flashSuccess();
                this.nextSentence();
            }
        };
    }

    private nextSentence() {
        this.currentSentence = TextGenerator.getRandomSentence();
        this.inputHandler.setTarget(this.currentSentence.kana);

        this.elDisplayText.textContent = this.currentSentence.text;
        this.elScore.textContent = `${this.sentencesCompletedkq + 1}/${this.sentencesToType}`;

        this.renderKana(this.currentSentence.kana);
        this.elInputBuffer.textContent = "";
        this.renderRomajiGuide();
    }

    private renderKana(kana: string) {
        this.elKanaContainer.innerHTML = '';
        const chars = kana.split(''); // Note: This splits 'きゃ' into 'き','ゃ'. 
        // ideally we split by logical method but css styling is per char for simple logic
        // We will just update class based on index from InputHandler (which tracks logical char index)

        // Wait, InputHandler tracks logical index. 
        // The display here is just visual.
        // Let's just put textContent for now, or spans if we want granular color.

        chars.forEach((char, i) => {
            const span = document.createElement('span');
            span.textContent = char;
            span.id = `k-${i}`;
            span.className = 'kana-future';
            this.elKanaContainer.appendChild(span);
        });

        this.highlightCurrentKana(0);
    }

    private updateKanaUI(doneToIndex: number) {
        const spans = this.elKanaContainer.children;
        for (let i = 0; i < spans.length; i++) {
            if (i < doneToIndex) {
                spans[i].className = 'kana-done';
            } else if (i === doneToIndex) {
                spans[i].className = 'kana-current';
            } else {
                spans[i].className = 'kana-future';
            }
        }
    }

    private highlightCurrentKana(index: number) {
        this.updateKanaUI(index);
    }

    private updateInputUI(valid: boolean, currentRomaji: string) {
        this.elInputBuffer.textContent = currentRomaji;
        this.elInputBuffer.style.color = valid ? 'var(--text-muted)' : 'var(--error-color)';

        this.renderRomajiGuide();

        if (!valid) {
            this.shakeScreen();
        }
    }

    private renderRomajiGuide() {
        const fullRomaji = this.inputHandler.getTargetRomaji();
        const stats = this.inputHandler.getStats();

        const doneStr = fullRomaji.slice(0, stats.typed);
        const futureStr = fullRomaji.slice(stats.typed);

        this.elRomajiGuide.innerHTML =
            `<span class="romaji-done">${doneStr}</span>` +
            `<span class="romaji-future">${futureStr}</span>`;
    }

    private startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (!this.isRunning) return;
            this.updateRealtimeStats();
        }, 500);
    }

    private updateRealtimeStats() {
        const stats = this.inputHandler.getStats();
        const elapsedMin = (Date.now() - this.startTime) / 60000;

        // WPM = (TypedChars / 5) / Min
        // For Japanese, maybe just use TypedRomajiChars? InputHandler counts keys typed.
        const wpm = elapsedMin > 0 ? Math.round((stats.typed / 5) / elapsedMin) : 0;

        // Accuracy
        const totalAttempts = stats.typed + stats.misses;
        const acc = totalAttempts > 0
            ? Math.round((stats.typed / totalAttempts) * 100)
            : 100;

        this.elWpm.textContent = wpm.toString();
        this.elAcc.textContent = `${acc}%`;
    }

    private finishGame() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        this.updateRealtimeStats();

        const wpm = parseInt(this.elWpm.textContent || '0');
        const acc = parseInt(this.elAcc.textContent?.replace('%', '') || '0');

        this.onFinishCallback(wpm, acc);
    }

    private shakeScreen() {
        this.elTypingArea.classList.add('shake');
        setTimeout(() => this.elTypingArea.classList.remove('shake'), 200);
    }

    private flashSuccess() {
        // Optional visual flair
    }
}
