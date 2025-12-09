import { Component, ChangeDetectionStrategy, ElementRef, viewChild, afterNextRender, inject, OnDestroy, signal, effect, input, output } from '@angular/core';
import { TranslationService } from '../../services/translation.service';
import { Question } from '../../models';
import { GeminiService } from '../../services/gemini.service';
import { QuestionModalComponent } from '../question-modal/question-modal.component';

declare const Zdog: any;

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [QuestionModalComponent],
  host: {
    '[class]': `'block w-full h-full'`,
  }
})
export class GameComponent implements OnDestroy {
  translationService = inject(TranslationService);
  geminiService = inject(GeminiService);

  config = input.required<{ language: 'en' | 'es' | 'pt', prompt: string, questionsEnabled: boolean }>();
  
  canvas = viewChild<ElementRef<HTMLCanvasElement>>('zdogCanvas');
  canvasContainer = viewChild<ElementRef<HTMLDivElement>>('canvasContainer');
  
  score = signal(0);
  isPaused = signal(false);
  
  currentQuestion = signal<Question | null>(null);
  
  private illu: any;
  private capy: any;
  private oranges: any[] = [];
  private animationFrameId: number;

  private sceneWidth = 400; // Default, will be updated on resize
  private readonly waterfallHeight = 160;

  private isMovingLeft = signal(false);
  private isMovingRight = signal(false);
  private readonly capySpeed = 4;
  private resizeObserver: ResizeObserver;
  
  // Zdog scene objects that need resizing/repositioning
  private pond: any;
  private waterfallRock1: any;
  private waterfallRock2: any;
  private waterStream: any;
  private greenery1: any;
  private greenery2: any;
  private lilyPad1: any;
  private lilyPad2: any;
  private pondRock1: any;
  private pondRock2: any;

  constructor() {
    afterNextRender(() => {
      this.initZdog();

      this.resizeObserver = new ResizeObserver(entries => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            this.resizeScene(width, height);
          }
        });
        
      if (this.canvasContainer()) {
        this.resizeObserver.observe(this.canvasContainer()!.nativeElement);
      }

      this.animate();
      this.setupKeyEvents();
    });

    effect(() => {
        this.isPaused.set(!!this.currentQuestion());
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private resizeScene(width: number, height: number) {
    if (!this.illu || width === 0) return;
    const canvasEl = this.canvas()!.nativeElement;
    canvasEl.width = width;
    canvasEl.height = height;
    this.illu.setSize(width, height);
    this.sceneWidth = width / this.illu.zoom;

    // Update Zdog objects
    this.pond.diameter = this.sceneWidth + 60;
    
    const waterfallWidth = this.sceneWidth * 0.3;
    this.waterfallRock1.translate.x = -waterfallWidth;
    this.waterfallRock2.translate.x = waterfallWidth;
    this.waterStream.width = waterfallWidth * 1.5;

    this.greenery1.translate.x = this.sceneWidth / 2 + 30;
    this.greenery2.translate.x = -this.sceneWidth / 2 - 30;

    this.lilyPad1.translate.x = -this.sceneWidth / 2 + 60;
    this.lilyPad2.translate.x = this.sceneWidth / 2 - 60;

    this.pondRock1.translate.x = -this.sceneWidth / 3;
    this.pondRock2.translate.x = this.sceneWidth / 3 + 30;
  }

  private initZdog() {
    const canvasEl = this.canvas()?.nativeElement;
    if (!canvasEl) return;
    
    this.illu = new Zdog.Illustration({
      element: canvasEl,
      zoom: 1.5,
      dragRotate: false,
    });

    // Pond
    this.pond = new Zdog.Ellipse({
      addTo: this.illu,
      diameter: this.sceneWidth + 60,
      stroke: 30,
      color: '#60a5fa', // blue-400
      fill: true,
    });

    // Waterfall background
    const waterfallGroup = new Zdog.Group({
        addTo: this.illu,
        translate: { y: -this.waterfallHeight, z: -80 }
    });

    // Rocks
    this.waterfallRock1 = new Zdog.Box({
        addTo: waterfallGroup,
        width: 100, height: 120, depth: 30,
        stroke: false,
        color: '#a8a29e', // stone-400
        leftFace: '#78716c', rightFace: '#78716c', topFace: '#d6d3d1',
    });
    this.waterfallRock2 = new Zdog.Box({
        addTo: waterfallGroup,
        width: 100, height: 150, depth: 40,
        stroke: false,
        color: '#a8a29e',
        leftFace: '#78716c', rightFace: '#78716c', topFace: '#d6d3d1',
        translate: { y: 15 }
    });

    // Water Stream
    this.waterStream = new Zdog.Rect({
        addTo: waterfallGroup,
        width: 80,
        height: 120,
        stroke: false,
        color: '#38bdf8', // sky-400
        fill: true,
        translate: { y: 10, z: 21}
    });

    // Greenery
    this.greenery1 = new Zdog.Hemisphere({
        addTo: this.illu,
        diameter: 60,
        color: '#16a34a', // green-600
        stroke: false,
        translate: { y: -this.waterfallHeight/2 + 20, z: -50 },
        rotate: { x: Zdog.TAU/4 }
    });
    this.greenery2 = new Zdog.Hemisphere({
        addTo: this.illu,
        diameter: 80,
        color: '#22c55e', // green-500
        stroke: false,
        translate: { y: -this.waterfallHeight/2 + 40, z: -60 },
        rotate: { x: Zdog.TAU/4 }
    });

    this.createPondDecorations();

    // Capybara
    this.capy = new Zdog.Group({
        addTo: this.illu,
        translate: { y: 20, z: 20 },
    });

    // Body
    new Zdog.RoundedRect({
      addTo: this.capy,
      width: 70, height: 45, depth: 40,
      cornerRadius: 20, stroke: false, color: '#a16207', fill: true,
    });

    // Head Group
    const head = new Zdog.Group({ addTo: this.capy, translate: { x: -35, y: -10 } });

    // Head Shape
    new Zdog.Shape({ addTo: head, path: [ { x: -15 }, { x: 15 } ], stroke: 35, color: '#a16207' });

    // Ears
    new Zdog.Ellipse({ addTo: head, diameter: 10, stroke: 5, color: '#854d0e', translate: { x: -8, y: -15, z: 10 }, rotate: { z: -Zdog.TAU/8 } });
    new Zdog.Ellipse({ addTo: head, diameter: 10, stroke: 5, color: '#854d0e', translate: { x: -8, y: -15, z: -10 }, rotate: { z: -Zdog.TAU/8 } });

    // Nose
    new Zdog.RoundedRect({ addTo: head, width: 20, height: 12, depth: 10, cornerRadius: 5, color: '#57534e', stroke: false, fill: true, translate: { x: -18, y: 5 } });

    // Eyes
    new Zdog.Shape({ addTo: head, stroke: 4, color: '#1c1917', translate: { x: -10, y: -5, z: 12 } });
    new Zdog.Shape({ addTo: head, stroke: 4, color: '#1c1917', translate: { x: -10, y: -5, z: -12 } });

    // Oranges
    for (let i = 0; i < 5; i++) {
        const orange = new Zdog.Shape({
            addTo: this.illu,
            stroke: 20,
            color: '#f97316', // orange-500
        });
        this.resetOrange(orange);
        this.oranges.push(orange);
    }
  }

  private createPondDecorations() {
    // Water lily 1
    this.lilyPad1 = new Zdog.Group({
      addTo: this.illu,
      translate: { y: 30, z: 40 },
    });
    new Zdog.Ellipse({
      addTo: this.lilyPad1,
      diameter: 30,
      stroke: false,
      fill: true,
      color: '#16a34a', // green-600
      rotate: { x: Zdog.TAU / 4 },
    });
    new Zdog.Hemisphere({
      addTo: this.lilyPad1,
      diameter: 10,
      stroke: false,
      color: '#f8fafc', // slate-50
      backface: '#fecdd3', // pink-200
      translate: { z: 3 },
    });
    
    // Water lily 2
    this.lilyPad2 = new Zdog.Group({
      addTo: this.illu,
      translate: { y: 50, z: 60 },
    });
    new Zdog.Ellipse({
      addTo: this.lilyPad2,
      diameter: 30,
      stroke: false,
      fill: true,
      color: '#16a34a',
      rotate: { x: Zdog.TAU / 4 },
    });
    new Zdog.Hemisphere({
      addTo: this.lilyPad2,
      diameter: 10,
      stroke: false,
      color: '#f8fafc',
      backface: '#fecdd3',
      translate: { z: 3 },
    });

    // Rocks in pond
    this.pondRock1 = new Zdog.Hemisphere({
      addTo: this.illu,
      diameter: 40,
      stroke: false,
      color: '#a8a29e', // stone-400
      translate: { y: this.waterfallHeight / 2 - 20, z: 20 },
    });
    this.pondRock2 = new Zdog.Hemisphere({
      addTo: this.illu,
      diameter: 30,
      stroke: false,
      color: '#a8a29e', // stone-400
      translate: { y: this.waterfallHeight / 2 - 10, z: 30 },
    });
  }

  private resetOrange(orange: any) {
    orange.translate = {
        x: (Math.random() - 0.5) * (this.sceneWidth * 0.2), // Wider spawn area from waterfall
        y: -this.waterfallHeight - Math.random() * 50, // Start from above waterfall
        z: 25, // Fall in front of waterfall
    };
    (orange as any).speed = Math.random() * 1.5 + 1;
  }
  
  private setupKeyEvents() {
    window.addEventListener('keydown', this.handleKeyDown, false);
    window.addEventListener('keyup', this.handleKeyUp, false);
  }

  private handleKeyDown = (event: KeyboardEvent) => {
      if (this.isPaused()) return;
      if (event.key === 'ArrowLeft') this.isMovingLeft.set(true);
      else if (event.key === 'ArrowRight') this.isMovingRight.set(true);
  }

  private handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') this.isMovingLeft.set(false);
      else if (event.key === 'ArrowRight') this.isMovingRight.set(false);
  }

  private animate = () => {
    if (!this.isPaused()) {
        // Capybara movement
        if (this.isMovingLeft()) this.capy.translate.x -= this.capySpeed;
        if (this.isMovingRight()) this.capy.translate.x += this.capySpeed;
        
        // Bounds check
        const halfWidth = this.sceneWidth / 2;
        this.capy.translate.x = Math.max(-halfWidth, Math.min(halfWidth, this.capy.translate.x));

        this.oranges.forEach(orange => {
            orange.translate.y += (orange as any).speed;
            orange.rotate.y += 0.03;

            // Check collision
            const dx = this.capy.translate.x - orange.translate.x;
            const dy = this.capy.translate.y - orange.translate.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance < 45) { // Collision radius
                this.score.update(s => s + 1);
                this.resetOrange(orange);
                // Trigger question randomly if enabled
                if (this.config().questionsEnabled && Math.random() < 0.2) { // 20% chance
                    this.triggerQuestion();
                }
            }

            if (orange.translate.y > this.waterfallHeight/2 + 20) {
                this.resetOrange(orange);
            }
        });
        this.illu.updateRenderGraph();
    }
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  private async triggerQuestion() {
    this.isPaused.set(true);
    const question = await this.geminiService.generateQuestion(
      this.config().prompt, 
      this.config().language
    );
    this.currentQuestion.set(question);
  }

  onQuestionAnswered() {
    this.currentQuestion.set(null);
    this.isPaused.set(false);
  }
}
