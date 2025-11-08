import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'builder',
    loadComponent: () => import('./formula-builder/formula-builder.component').then(m => m.FormulaBuilderComponent)
  },
  {
    path: 'dashboard',
    redirectTo: 'builder'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
