import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CameraService {
  async startCamera(video: HTMLVideoElement): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 480, height: 360 },
    });

    video.srcObject = stream;
    await video.play();
  }
}
