import { Component, signal } from '@angular/core';
import { DashboardComponent } from './dashboard/dashboard';

declare global {
  interface Window {
    blinkAPI?: {
      notify: () => void;
    };
  }
}

@Component({
  selector: 'app-root',
  imports: [DashboardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('eye-blink-detection');
}
