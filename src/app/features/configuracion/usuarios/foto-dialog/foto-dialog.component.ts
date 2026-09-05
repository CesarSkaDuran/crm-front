import { Component, inject, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-foto-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './foto-dialog.component.html',
  styleUrl: './foto-dialog.component.scss',
})
export class FotoDialogComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<FotoDialogComponent>);

  @ViewChild('video', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  stream: MediaStream | null = null;
  fotoCapturada: string | null = null;
  cargandoCamara = false;
  errorCamara = '';

  async ngOnInit() {
    await this.iniciarCamara();
  }

  ngOnDestroy() {
    this.detenerCamara();
  }

  async iniciarCamara() {
    this.cargandoCamara = true;
    this.errorCamara = '';
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = this.videoRef.nativeElement;
      video.srcObject = this.stream;
      await video.play();
    } catch (err) {
      this.errorCamara = 'No se pudo acceder a la cámara. Verifica los permisos.';
    } finally {
      this.cargandoCamara = false;
    }
  }

  capturar() {
    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    const context = canvas.getContext('2d');
    if (!context || video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    this.fotoCapturada = canvas.toDataURL('image/png');
    this.detenerCamara();
  }

  tomarOtra() {
    this.fotoCapturada = null;
    this.iniciarCamara();
  }

  confirmar() {
    if (this.fotoCapturada) {
      this.dialogRef.close(this.fotoCapturada);
    }
  }

  cerrar() {
    this.dialogRef.close();
  }

  private detenerCamara() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }
}
