
import { Injectable, signal, computed } from '@angular/core';
import { Language } from '../models';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  language = signal<Language>('en');

  private translations: Record<Language, Record<string, string>> = {
    en: {
      title: "Capybara's Orange Catch",
      settings: 'Settings',
      language: 'Language',
      questionPrompt: 'Question Prompt',
      promptPlaceholder: "e.g., Ask a simple question about animals for a 5-year-old.",
      saveAndStart: 'Save & Start Game',
      loadingAI: 'Thinking of a fun question...',
      submitAnswer: 'Submit',
      correct: 'Correct!',
      wrong: 'Try Again!',
      score: 'Score',
      letsPlay: "Let's Play!",
      answerThisFirst: "First, answer this question:",
      paused: "Game Paused",
      questionTime: "Question Time!",
      enableQuestions: "Enable Questions",
    },
    es: {
      title: 'La Cosecha de Naranjas del Capibara',
      settings: 'Configuración',
      language: 'Idioma',
      questionPrompt: 'Prompt para Preguntas',
      promptPlaceholder: 'Ej: Haz una pregunta simple sobre animales para un niño de 5 años.',
      saveAndStart: 'Guardar y Empezar Juego',
      loadingAI: 'Pensando en una pregunta divertida...',
      submitAnswer: 'Enviar',
      correct: '¡Correcto!',
      wrong: '¡Inténtalo de Nuevo!',
      score: 'Puntos',
      letsPlay: '¡A Jugar!',
      answerThisFirst: 'Primero, responde esta pregunta:',
      paused: "Juego Pausado",
      questionTime: "¡Hora de Pregunta!",
      enableQuestions: "Habilitar Preguntas",
    },
    pt: {
      title: 'A Apanha de Laranjas da Capivara',
      settings: 'Configurações',
      language: 'Língua',
      questionPrompt: 'Prompt para Perguntas',
      promptPlaceholder: 'Ex: Faça uma pergunta simples sobre animais para uma criança de 5 anos.',
      saveAndStart: 'Salvar e Iniciar Jogo',
      loadingAI: 'A pensar numa pergunta divertida...',
      submitAnswer: 'Enviar',
      correct: 'Correto!',
      wrong: 'Tenta de Novo!',
      score: 'Pontos',
      letsPlay: 'Vamos Jogar!',
      answerThisFirst: 'Primeiro, responde a esta pergunta:',
      paused: "Jogo em Pausa",
      questionTime: "Hora da Pergunta!",
      enableQuestions: "Ativar Perguntas",
    },
  };

  private currentTranslations = computed(() => this.translations[this.language()]);

  setLanguage(lang: Language) {
    this.language.set(lang);
  }

  t(key: string) {
    return computed(() => this.currentTranslations()[key] || key);
  }
}
