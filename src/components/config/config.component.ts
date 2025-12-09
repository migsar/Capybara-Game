
import { Component, ChangeDetectionStrategy, output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Language } from '../../models';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule],
})
export class ConfigComponent {
  translationService = inject(TranslationService);
  
  configSaved = output<{ language: Language; prompt: string, questionsEnabled: boolean }>();

  selectedLanguage = signal<Language>(this.translationService.language());
  prompt = signal('Ask a simple question about animals for a 5-year-old.');
  questionsEnabled = signal(true);

  languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇲🇽' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
  ];

  setLanguage(lang: Language) {
    this.selectedLanguage.set(lang);
    this.translationService.setLanguage(lang);
  }

  save() {
    this.configSaved.emit({
      language: this.selectedLanguage(),
      prompt: this.prompt(),
      questionsEnabled: this.questionsEnabled()
    });
  }
}
