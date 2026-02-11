import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private alertSubject = new BehaviorSubject<boolean>(false);
  alert$ = this.alertSubject.asObservable();

  showAlert() {
    this.alertSubject.next(true);
  }

  hideAlert() {
    this.alertSubject.next(false);
  }
}
