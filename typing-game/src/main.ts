import './style.css';
import { GameEngine } from './game/GameEngine';
import { RankingManager } from './game/RankingManager';

class App {
  private game: GameEngine;
  private menuScreen = document.getElementById('menu-screen')!;
  private gameScreen = document.getElementById('game-screen')!;
  private resultScreen = document.getElementById('result-screen')!;
  private leaderboardList = document.getElementById('leaderboard-list')!;

  constructor() {
    this.game = new GameEngine();
    this.initEventListeners();
    this.updateLeaderboard();
  }

  private initEventListeners() {
    document.getElementById('start-btn')?.addEventListener('click', () => this.startGame());
    document.getElementById('retry-btn')?.addEventListener('click', () => this.startGame());
    document.getElementById('home-btn')?.addEventListener('click', () => this.showMenu());

    this.game.setOnFinish((wpm, acc) => this.showResult(wpm, acc));
  }

  private startGame() {
    this.switchScreen('game');
    this.game.start();
  }

  private showMenu() {
    this.updateLeaderboard();
    this.switchScreen('menu');
  }

  private showResult(wpm: number, acc: number) {
    const isNewRecord = RankingManager.saveScore(wpm, acc);

    document.getElementById('final-wpm')!.innerText = wpm.toString();
    document.getElementById('final-accuracy')!.innerText = `${acc}%`;

    const newRecordMsg = document.getElementById('new-record-msg')!;
    newRecordMsg.style.display = isNewRecord ? 'block' : 'none';

    this.switchScreen('result');
  }

  private switchScreen(screen: 'menu' | 'game' | 'result') {
    this.menuScreen.classList.remove('active');
    this.gameScreen.classList.remove('active');
    this.resultScreen.classList.remove('active');

    if (screen === 'menu') this.menuScreen.classList.add('active');
    if (screen === 'game') this.gameScreen.classList.add('active');
    if (screen === 'result') this.resultScreen.classList.add('active');
  }

  private updateLeaderboard() {
    const scores = RankingManager.getScores();
    if (scores.length === 0) {
      this.leaderboardList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No records yet. Be the first!</p>';
      return;
    }

    this.leaderboardList.innerHTML = scores.map((s, i) => `
      <div class="ranking-item">
        <span class="ranking-rank">#${i + 1}</span>
        <span class="ranking-name">Agent Typist</span>
        <span class="ranking-score">${s.wpm} WPM / ${s.accuracy}%</span>
      </div>
    `).join('');
  }
}

new App();
