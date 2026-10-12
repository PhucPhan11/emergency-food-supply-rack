import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PantryStore } from './core/pantry-store';
import { Header } from './layout/header/header';
import { Toast } from './layout/toast/toast';

@Component({
  host: { '(window:focus)': 'refreshToday()' },
  imports: [Header, RouterOutlet, Toast],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly store = inject(PantryStore);

  protected refreshToday(): void {
    this.store.refreshToday();
  }
}
