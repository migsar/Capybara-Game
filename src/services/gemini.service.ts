
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { Question, Language } from '../models';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private genAI: GoogleGenAI;
  private readonly defaultQuestion: Question = {
    question: 'What color is an orange?',
    options: ['Blue', 'Orange', 'Green', 'Purple'],
    correctAnswer: 'Orange',
  };

  constructor() {
    // This will be populated by the environment in a real Applet
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      console.warn("API_KEY environment variable not set. Using mock data.");
    }
    this.genAI = new GoogleGenAI({ apiKey: API_KEY });
  }

  async generateQuestion(prompt: string, language: Language): Promise<Question> {
    if (!process.env.API_KEY) {
      return Promise.resolve(this.defaultQuestion);
    }

    const langMap = {
      en: 'English',
      es: 'Spanish',
      pt: 'Portuguese'
    };

    const fullPrompt = `${prompt}. The question should be in ${langMap[language]}. Provide 4 multiple choice options.`;

    try {
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.STRING }
            },
            required: ['question', 'options', 'correctAnswer']
          }
        }
      });
      
      const text = response.text.trim();
      const result = JSON.parse(text);
      
      // Basic validation
      if (result.question && Array.isArray(result.options) && result.correctAnswer && result.options.includes(result.correctAnswer)) {
          return result as Question;
      } else {
          console.error("Invalid question format received from API:", result);
          return this.defaultQuestion;
      }

    } catch (error) {
      console.error('Error generating question with Gemini API:', error);
      return this.defaultQuestion;
    }
  }
}
