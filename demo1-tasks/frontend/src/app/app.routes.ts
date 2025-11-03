import { Routes } from '@angular/router';
import { BeforeComponent } from './components/before/before.component';
import { AfterComponent } from './components/after/after.component';

export const routes: Routes = [
  { path: '', redirectTo: '/before', pathMatch: 'full' },
  { path: 'before', component: BeforeComponent },
  { path: 'after', component: AfterComponent }
];
