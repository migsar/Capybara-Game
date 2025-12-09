
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';

import { TranslationService } from './services/translation.service';
import { GeminiService } from './services/gemini.service';

import { ConfigComponent } from './components/config/config.component';
import { GameComponent } from './components/game/game.component';
import { QuestionModalComponent } from './components/question-modal/question-modal.component';

import { Language, Question } from './models';

type GameState = 'config' | 'pre-game-question' | 'loading' | 'game';
type GameConfig = { language: Language; prompt: string; questionsEnabled: boolean };

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [CommonModule, ConfigComponent, GameComponent, QuestionModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  translationService = inject(TranslationService);
  geminiService = inject(GeminiService);

  gameState = signal<GameState>('config');
  
  gameConfig = signal<GameConfig | null>(null);
  preGameQuestion = signal<Question | null>(null);

  onConfigSaved(config: GameConfig) {
    this.gameConfig.set(config);
    this.translationService.setLanguage(config.language);
    if (config.questionsEnabled) {
      this.loadPreGameQuestion();
    } else {
      this.gameState.set('game'); // Skip question if disabled
    }
  }
  
  async loadPreGameQuestion() {
    this.gameState.set('loading');
    const config = this.gameConfig();
    if (config) {
      const question = await this.geminiService.generateQuestion(config.prompt, config.language);
      this.preGameQuestion.set(question);
      this.gameState.set('pre-game-question');
    }
  }

  onPreGameQuestionAnswered() {
    this.preGameQuestion.set(null);
    this.gameState.set('game');
  }
}
