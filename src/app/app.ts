import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  QueryList,
  ViewChildren,
  inject,
} from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewInit, OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChildren('slideEl') slideElements!: QueryList<ElementRef<HTMLElement>>;

  activeIndex = 0;

  private slideIntervalId: number | null = null;
  private intersectionObserver?: IntersectionObserver;

  ngAfterViewInit(): void {
    this.startAutoSlide();
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.slideIntervalId !== null) {
      window.clearInterval(this.slideIntervalId);
    }
    this.intersectionObserver?.disconnect();
  }

  private startAutoSlide(): void {
    const totalSlides = 1;
    const intervalMs = 8000;

    this.ngZone.runOutsideAngular(() => {
      this.slideIntervalId = window.setInterval(() => {
        // Re-enter Angular so change detection runs even in zoneless setups
        this.ngZone.run(() => {
          this.activeIndex = (this.activeIndex + 1) % totalSlides;
          this.cdr.markForCheck();
        });
      }, intervalMs);
    });
  }

  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) {
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;

          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            target.classList.add('is-visible');
          } else {
            target.classList.remove('is-visible');
          }
        });
      },
      {
        threshold: [0.25, 0.45],
      }
    );

    this.slideElements.forEach((ref) => {
      this.intersectionObserver?.observe(ref.nativeElement);
    });

    this.slideElements.changes.subscribe((list: QueryList<ElementRef<HTMLElement>>) => {
      list.forEach((ref) => this.intersectionObserver?.observe(ref.nativeElement));
    });
  }
}
