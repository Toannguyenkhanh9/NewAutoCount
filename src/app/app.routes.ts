import { Routes } from '@angular/router';
import { DashboardPageComponent } from './features/dashboard/dashboard-page.component';
import { GlJournalListPageComponent } from './features/gl/gl-journal-list-page.component';
import { LoginPageComponent } from './features/auth/login-page.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent, title: 'Login' },

  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  {
    path: 'dashboard',
    component: DashboardPageComponent,
    title: 'Dashboard',
    canActivate: [authGuard],
  },
  {
    path: 'general-ledger',
    canActivate: [authGuard],
    children: [
      {
        path: 'journal-entry',
        component: GlJournalListPageComponent,
        title: 'Journal Entry',
      },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];
