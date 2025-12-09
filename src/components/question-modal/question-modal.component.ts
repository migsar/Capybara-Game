
import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { Question } from '../../models';
import { TranslationService } from '../../services/translation.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-question-modal',
  templateUrl: './question-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class QuestionModalComponent {
  translationService = inject(TranslationService);
  
  question = input.required<Question>();
  title = input.required<string>();

  answeredCorrectly = output<void>();

  selectedAnswer = signal<string | null>(null);
  feedback = signal<'correct' | 'wrong' | null>(null);

  selectAnswer(option: string) {
    if (this.feedback()) return;
    this.selectedAnswer.set(option);
  }

  submit() {
    if (!this.selectedAnswer()) return;

    if (this.selectedAnswer() === this.question().correctAnswer) {
      this.feedback.set('correct');
      setTimeout(() => {
        this.answeredCorrectly.emit();
        this.reset();
      }, 1500);
    } else {
      this.feedback.set('wrong');
      setTimeout(() => {
        this.feedback.set(null);
        this.selectedAnswer.set(null);
      }, 1500);
    }
  }
  
  private reset() {
      this.selectedAnswer.set(null);
      this.feedback.set(null);
  }
}
