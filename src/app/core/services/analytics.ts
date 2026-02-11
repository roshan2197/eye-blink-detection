import { Injectable } from '@angular/core';

export interface BlinkEvent {
  timestamp: number; // Date.now()
}

export interface MinuteStat {
  minuteStart: number; // rounded timestamp
  blinkCount: number;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  totalBlinks: number;
  alertsTriggered: number;
  avgBlinkRate: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private blinkEvents: BlinkEvent[] = [];
  private minuteStats: MinuteStat[] = [];
  private alertsToday = 0;

  constructor() {
    this.load();
  }

  // ---- Collection ----

  recordBlink() {
    const now = Date.now();
    this.blinkEvents.push({ timestamp: now });
    this.aggregateMinute(now);
    this.persist();
  }

  recordAlert() {
    this.alertsToday++;
    this.persist();
  }

  // ---- Aggregation ----

  private aggregateMinute(timestamp: number) {
    const minuteStart = Math.floor(timestamp / 60000) * 60000;

    let stat = this.minuteStats.find((m) => m.minuteStart === minuteStart);
    if (!stat) {
      stat = { minuteStart, blinkCount: 0 };
      this.minuteStats.push(stat);
    }
    stat.blinkCount++;
  }

  // ---- Queries ----

  getBlinkRateSeries(lastMinutes = 30): MinuteStat[] {
    const cutoff = Date.now() - lastMinutes * 60000;
    return this.minuteStats.filter((m) => m.minuteStart >= cutoff);
  }

  getTodaySummary(): DailySummary {
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = this.blinkEvents.filter((e) =>
      new Date(e.timestamp).toISOString().startsWith(today),
    );

    const totalBlinks = todayEvents.length;
    const minutes = Math.max(1, this.minuteStats.length);

    return {
      date: today,
      totalBlinks,
      alertsTriggered: this.alertsToday,
      avgBlinkRate: Math.round(totalBlinks / minutes),
    };
  }

  // ---- Persistence ----

  private persist() {
    localStorage.setItem(
      'blink-analytics',
      JSON.stringify({
        blinkEvents: this.blinkEvents,
        minuteStats: this.minuteStats,
        alertsToday: this.alertsToday,
      }),
    );
  }

  private load() {
    const raw = localStorage.getItem('blink-analytics');
    if (!raw) return;

    const data = JSON.parse(raw);
    this.blinkEvents = data.blinkEvents || [];
    this.minuteStats = data.minuteStats || [];
    this.alertsToday = data.alertsToday || 0;
  }
}
