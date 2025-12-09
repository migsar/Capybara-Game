
export type Language = 'en' | 'es' | 'pt';

export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}
