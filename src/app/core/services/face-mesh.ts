import { Injectable } from '@angular/core';
import { FaceMesh, Results } from '@mediapipe/face_mesh';

@Injectable({ providedIn: 'root' })
export class FaceMeshService {
  private faceMesh!: FaceMesh;

  init(onResults: (results: Results) => void) {
    this.faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.faceMesh.onResults(onResults);
  }

  async sendFrame(video: HTMLVideoElement) {
    await this.faceMesh.send({ image: video });
  }
}
