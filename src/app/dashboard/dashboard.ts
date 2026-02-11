import { Component, ElementRef, ViewChild, AfterViewInit, input, signal } from '@angular/core';
import { CameraService } from '../core/services/camera';
import { FaceMeshService } from '../core/services/face-mesh';
import { BlinkDetectionService } from '../core/services/blink-detection';
import { AlertService } from '../core/services/alert';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../core/services/settings';
import { AnalyticsService } from '../core/services/analytics';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-160 h-120">
      <!-- Video -->
      <video #video class="inset-0 z-0" width="640" height="480" autoplay muted playsinline></video>
      <div class="mt-2 text-sm text-gray-600">
        Blink rate: {{ blinkService.getBlinkRatePerMinute() }} / min
      </div>

      <!-- Canvas -->
      <canvas #canvas class="absolute inset-0 z-10" width="640" height="480"></canvas>

      <!-- Alert Overlay -->
      @if (alertVisible()) {
        <div
          class="absolute inset-0 z-20 flex items-center justify-center bg-red-500/20 text-black text-2xl font-semibold backdrop-blur-sm"
        >
          Blink your eyes 👁️
        </div>
      }

      <div class="mt-6 p-4 bg-gray-800 rounded-xl text-white space-y-4">
        <div>
          <label class="block text-sm mb-1"> No Blink Duration (seconds) </label>
          <input
            type="range"
            min="5"
            max="30"
            [value]="settings.current.noBlinkDurationMs / 1000"
            (input)="updateDuration($event)"
            class="w-full"
          />
          <div>{{ settings.current.noBlinkDurationMs / 1000 }} seconds</div>
        </div>

        <div>
          <label class="block text-sm mb-1"> Sensitivity </label>
          <input
            type="range"
            min="0.5"
            max="0.9"
            step="0.05"
            [value]="settings.current.sensitivityMultiplier"
            (input)="updateSensitivity($event)"
            class="w-full"
          />
          <div>{{ settings.current.sensitivityMultiplier }}</div>
        </div>

        <div class="flex items-center gap-2">
          <input
            type="checkbox"
            [checked]="settings.current.monitoringEnabled"
            (change)="toggleMonitoring($event)"
          />
          <span>Monitoring Enabled</span>
        </div>
      </div>
      <div class="mt-8 bg-gray-900 p-4 rounded-xl text-white">
        <h3 class="text-lg font-semibold mb-2">Blink Analytics</h3>

        <canvas #blinkChart height="120"></canvas>

        <div class="mt-4 text-sm text-gray-300">
          <div>Total blinks today: {{ summary?.totalBlinks }}</div>
          <div>Avg blink rate: {{ summary?.avgBlinkRate }} / min</div>
          <div>Alerts triggered: {{ summary?.alertsTriggered }}</div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements AfterViewInit {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  constructor(
    private camera: CameraService,
    private faceMesh: FaceMeshService,
    protected blinkService: BlinkDetectionService,
    private alertService: AlertService,
    protected settings: SettingsService,
    private analytics: AnalyticsService,
  ) {
    const s = this.settings.current;
  }

  alertVisible = signal(false);
  private lastProcessedTime = 0;
  private PROCESS_INTERVAL = 1000 / 15; // 15 FPS
  private faceLastSeenTime = Date.now();
  private FACE_LOST_TIMEOUT = 3000; // 3 seconds
  private isFaceVisible = true;

  @ViewChild('blinkChart') chartRef!: ElementRef<HTMLCanvasElement>;

  summary: any;
  chart: any;

  renderChart() {
    const data = this.analytics.getBlinkRateSeries(30);

    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'line',
      data: {
        labels: data.map((d) => new Date(d.minuteStart).toLocaleTimeString()),
        datasets: [
          {
            label: 'Blinks / minute',
            data: data.map((d) => d.blinkCount),
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  }

  ngOnInit() {
    this.alertService.alert$.subscribe((value) => {
      console.log(value);
      this.alertVisible.set(value);
    });
  }

  updateDuration(event: any) {
    const seconds = +event.target.value;
    this.settings.update({
      ...this.settings.current,
      noBlinkDurationMs: seconds * 1000,
    });
  }

  updateSensitivity(event: any) {
    const value = +event.target.value;
    this.settings.update({
      ...this.settings.current,
      sensitivityMultiplier: value,
    });
  }

  toggleMonitoring(event: any) {
    this.settings.update({
      ...this.settings.current,
      monitoringEnabled: event.target.checked,
    });
  }

  async ngAfterViewInit() {
    const video = this.videoRef.nativeElement;

    await this.camera.startCamera(video);

    this.faceMesh.init((results) => {
      const canvas = this.canvasRef.nativeElement;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = Date.now();

      if (!this.settings.current.monitoringEnabled) {
        return;
      }

      if (!results.multiFaceLandmarks?.length) {
        if (now - this.faceLastSeenTime > this.FACE_LOST_TIMEOUT) {
          this.isFaceVisible = false;
          this.blinkService.resetIfNoFaceDetected();
          this.alertService.hideAlert();
        }
        return;
      }

      // Face detected
      this.faceLastSeenTime = now;

      if (!this.isFaceVisible) {
        this.isFaceVisible = true;
      }

      const landmarks = results.multiFaceLandmarks[0];
      const leftEyeIdx = [33, 160, 158, 133, 153, 144];
      const rightEyeIdx = [362, 385, 387, 263, 373, 380];

      const mapEye = (idx: number[]) =>
        idx.map((i) => ({
          x: landmarks[i].x * canvas.width,
          y: landmarks[i].y * canvas.height,
        }));

      const leftEAR = this.blinkService.calculateEAR(mapEye(leftEyeIdx));
      const rightEAR = this.blinkService.calculateEAR(mapEye(rightEyeIdx));

      const ear = (leftEAR + rightEAR) / 2;

      if (ear < 0.05 || ear > 0.6) {
        // Likely invalid geometry
        return;
      }

      const blinked = this.blinkService.detectBlink(ear);

      if (blinked) {
        this.alertService.hideAlert();
        this.analytics.recordBlink();
      }

      const shouldAlert = this.blinkService.checkInactivity();

      if (shouldAlert) {
        this.alertService.showAlert();
        window.blinkAPI?.notify();
        this.analytics.recordAlert();
      }

      mapEye(leftEyeIdx).forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      });

      mapEye(rightEyeIdx).forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = 'blue';
        ctx.fill();
      });
    });

    const processFrame = async (time: number) => {
      if (time - this.lastProcessedTime >= this.PROCESS_INTERVAL) {
        this.lastProcessedTime = time;
        await this.faceMesh.sendFrame(video);
      }
      requestAnimationFrame(processFrame);
    };

    requestAnimationFrame(processFrame);

    this.renderChart();
    this.summary = this.analytics.getTodaySummary();
  }
}
