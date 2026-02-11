import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppSettings {
  noBlinkDurationMs: number;
  sensitivityMultiplier: number; // e.g. 0.7
  monitoringEnabled: boolean;
  notificationsEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  noBlinkDurationMs: 15000,
  sensitivityMultiplier: 0.7,
  monitoringEnabled: true,
  notificationsEnabled: true,
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private settingsSubject = new BehaviorSubject<AppSettings>(this.loadSettings());

  settings$ = this.settingsSubject.asObservable();

  private loadSettings(): AppSettings {
    const saved = localStorage.getItem('blink-settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  }

  update(settings: AppSettings) {
    localStorage.setItem('blink-settings', JSON.stringify(settings));
    this.settingsSubject.next(settings);
  }

  get current(): AppSettings {
    return this.settingsSubject.value;
  }
}
