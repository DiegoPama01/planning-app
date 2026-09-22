import { Component, signal } from '@angular/core';
import { NgxSonnerToaster } from 'ngx-sonner';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgxSonnerToaster],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('CuadranT');
}
