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
    <div class="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_10%_0%,rgba(56,189,248,0.2),transparent_60%),radial-gradient(70%_60%_at_90%_10%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(80%_60%_at_50%_100%,rgba(244,114,182,0.12),transparent_60%)]"
      ></div>

      <div class="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-8">
        <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.35em] text-slate-400">Focus Monitor</p>
            <h1 class="text-3xl font-semibold tracking-tight text-white">Blink Dashboard</h1>
            <p class="mt-1 text-sm text-slate-400">
              Real-time eye activity, tuned for comfort and focus.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <span
              class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
              [class.border-emerald-400/40]="settings.current.monitoringEnabled"
              [class.bg-emerald-500/10]="settings.current.monitoringEnabled"
              [class.text-emerald-200]="settings.current.monitoringEnabled"
              [class.border-rose-400/40]="!settings.current.monitoringEnabled"
              [class.bg-rose-500/10]="!settings.current.monitoringEnabled"
              [class.text-rose-200]="!settings.current.monitoringEnabled"
            >
              <span
                class="h-2 w-2 rounded-full"
                [class.bg-emerald-400]="settings.current.monitoringEnabled"
                [class.bg-rose-400]="!settings.current.monitoringEnabled"
              ></span>
              Monitoring {{ settings.current.monitoringEnabled ? 'On' : 'Off' }}
            </span>
            <span
              class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
              [class.border-amber-400/40]="alertVisible()"
              [class.bg-amber-500/10]="alertVisible()"
              [class.text-amber-200]="alertVisible()"
              [class.border-slate-700]="!alertVisible()"
              [class.bg-slate-900/60]="!alertVisible()"
              [class.text-slate-300]="!alertVisible()"
            >
              <span
                class="h-2 w-2 rounded-full"
                [class.bg-amber-400]="alertVisible()"
                [class.bg-slate-500]="!alertVisible()"
              ></span>
              {{ alertVisible() ? 'Blink Reminder Active' : 'All Clear' }}
            </span>
          </div>
        </header>

        <section class="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div class="space-y-4">
            <div
              class="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.8)]"
            >
              <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>

              <div class="relative aspect-video">
                <video
                  #video
                  class="absolute inset-0 h-full w-full object-cover"
                  width="640"
                  height="480"
                  autoplay
                  muted
                  playsinline
                ></video>

                <canvas #canvas class="absolute inset-0 h-full w-full" width="640" height="480"></canvas>

                @if (alertVisible()) {
                  <div
                    class="absolute inset-0 z-20 flex items-center justify-center bg-rose-500/25 text-2xl font-semibold text-white backdrop-blur-sm"
                  >
                    Time to blink
                  </div>
                }

                <div
                  class="absolute left-4 top-4 z-10 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm shadow-lg"
                >
                  <div class="text-xs uppercase tracking-[0.2em] text-slate-400">Live rate</div>
                  <div class="mt-1 text-2xl font-semibold text-white">
                    {{ blinkService.getBlinkRatePerMinute() }}
                    <span class="text-sm font-normal text-slate-400">/ min</span>
                  </div>
                </div>

                <div
                  class="absolute bottom-4 right-4 z-10 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-xs text-slate-200"
                >
                  Sensitivity: {{ settings.current.sensitivityMultiplier }}
                </div>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div class="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                <div class="text-xs uppercase tracking-[0.2em] text-slate-400">No blink</div>
                <div class="mt-2 text-xl font-semibold text-white">
                  {{ settings.current.noBlinkDurationMs / 1000 }}s
                </div>
                <p class="mt-1 text-xs text-slate-400">Reminder window</p>
              </div>
              <div class="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                <div class="text-xs uppercase tracking-[0.2em] text-slate-400">Today</div>
                <div class="mt-2 text-xl font-semibold text-white">{{ summary?.totalBlinks ?? 0 }}</div>
                <p class="mt-1 text-xs text-slate-400">Total blinks</p>
              </div>
              <div class="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                <div class="text-xs uppercase tracking-[0.2em] text-slate-400">Alerts</div>
                <div class="mt-2 text-xl font-semibold text-white">
                  {{ summary?.alertsTriggered ?? 0 }}
                </div>
                <p class="mt-1 text-xs text-slate-400">Triggered today</p>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-semibold text-white">Tracking Controls</h2>
                  <p class="text-xs text-slate-400">Tune thresholds to your comfort level.</p>
                </div>
              </div>

              <div class="mt-6 space-y-5">
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-sm">
                    <label for="duration" class="text-slate-200">No Blink Duration</label>
                    <span class="text-slate-400">
                      {{ settings.current.noBlinkDurationMs / 1000 }}s
                    </span>
                  </div>
                  <input
                    id="duration"
                    type="range"
                    min="5"
                    max="30"
                    [value]="settings.current.noBlinkDurationMs / 1000"
                    (input)="updateDuration($event)"
                    class="w-full accent-emerald-400"
                  />
                </div>

                <div class="space-y-2">
                  <div class="flex items-center justify-between text-sm">
                    <label for="sensitivity" class="text-slate-200">Sensitivity</label>
                    <span class="text-slate-400">{{ settings.current.sensitivityMultiplier }}</span>
                  </div>
                  <input
                    id="sensitivity"
                    type="range"
                    min="0.5"
                    max="0.9"
                    step="0.05"
                    [value]="settings.current.sensitivityMultiplier"
                    (input)="updateSensitivity($event)"
                    class="w-full accent-sky-400"
                  />
                </div>

                <label
                  class="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm"
                >
                  <span class="text-slate-200">Monitoring Enabled</span>
                  <span class="relative inline-flex h-6 w-11 items-center">
                    <input
                      type="checkbox"
                      class="peer sr-only"
                      [checked]="settings.current.monitoringEnabled"
                      (change)="toggleMonitoring($event)"
                    />
                    <span
                      class="h-6 w-11 rounded-full bg-slate-700 transition peer-checked:bg-emerald-500/80"
                    ></span>
                    <span
                      class="absolute left-1 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5"
                    ></span>
                  </span>
                </label>
              </div>
            </div>

            <div class="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-semibold text-white">Blink Analytics</h2>
                  <p class="text-xs text-slate-400">30-minute trend snapshot.</p>
                </div>
              </div>

              <div class="mt-6 h-44">
                <canvas #blinkChart class="h-44 w-full"></canvas>
              </div>

              <div class="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                <div class="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
                  <div class="text-xs uppercase tracking-[0.2em] text-slate-400">Avg rate</div>
                  <div class="mt-1 text-base text-white">{{ summary?.avgBlinkRate ?? 0 }} / min</div>
                </div>
                <div class="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
                  <div class="text-xs uppercase tracking-[0.2em] text-slate-400">Total</div>
                  <div class="mt-1 text-base text-white">{{ summary?.totalBlinks ?? 0 }}</div>
                </div>
                <div class="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
                  <div class="text-xs uppercase tracking-[0.2em] text-slate-400">Alerts</div>
                  <div class="mt-1 text-base text-white">{{ summary?.alertsTriggered ?? 0 }}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
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
            tension: 0.35,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.2)',
            fill: true,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(148, 163, 184, 0.2)',
            borderWidth: 1,
            displayColors: false,
            padding: 10,
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(148, 163, 184, 0.08)' },
            ticks: { color: 'rgba(148, 163, 184, 0.8)', maxTicksLimit: 6 },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148, 163, 184, 0.12)' },
            ticks: { color: 'rgba(148, 163, 184, 0.8)', precision: 0 },
          },
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
