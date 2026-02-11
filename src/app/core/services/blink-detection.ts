import { Injectable } from '@angular/core';
import { SettingsService } from './settings';

@Injectable({ providedIn: 'root' })
export class BlinkDetectionService {
  constructor(private settings: SettingsService) {}

  private isEyeClosed = false;

  private lastBlinkTime = Date.now();
  private alertActive = false;

  private baselineEAR: number | null = null;
  private blinkTimestamps: number[] = [];

  private threshold = 0.25; // Default threshold, will be updated after calibration

  calculateEAR(points: { x: number; y: number }[]): number {
    const d = (a: any, b: any) => Math.hypot(b.x - a.x, b.y - a.y);

    const v1 = d(points[1], points[5]);
    const v2 = d(points[2], points[4]);
    const h = d(points[0], points[3]);

    return (v1 + v2) / (2 * h);
  }

  /** Call during first few seconds */
  calibrate(ear: number) {
    if (this.baselineEAR === null) {
      this.baselineEAR = ear;
      return;
    }

    // Running average
    this.baselineEAR = this.baselineEAR * 0.9 + ear * 0.1;

    this.threshold = this.baselineEAR! * this.settings.current.sensitivityMultiplier;
  }

  detectBlink(ear: number): boolean {
    if (ear < this.threshold && !this.isEyeClosed) {
      this.isEyeClosed = true;
    }

    if (ear >= this.threshold && this.isEyeClosed) {
      this.isEyeClosed = false;
      const now = Date.now();
      this.lastBlinkTime = now;
      this.alertActive = false;
      this.blinkTimestamps.push(now);
      return true;
    }

    return false;
  }

  checkInactivity(): boolean {
    const now = Date.now();
    if (now - this.lastBlinkTime > this.settings.current.noBlinkDurationMs && !this.alertActive) {
      this.alertActive = true;
      return true;
    }
    return false;
  }

  getBlinkRatePerMinute(): number {
    const now = Date.now();
    this.blinkTimestamps = this.blinkTimestamps.filter((t) => now - t < 60000);
    return this.blinkTimestamps.length;
  }

  resetIfNoFaceDetected() {
    this.lastBlinkTime = Date.now();
    this.alertActive = false;
  }
}
