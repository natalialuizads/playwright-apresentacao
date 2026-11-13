import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { ExtratoPage } from './paginas/extrato.page';
import { InicioPage } from './paginas/inicio.page';
import { LoginPage } from './paginas/login.page';
import { PixPage } from './paginas/pix.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  { path: 'login', component: LoginPage, title: 'Entrar | Banco Tatu' },
  { path: 'inicio', component: InicioPage, canActivate: [authGuard], title: 'Início | Banco Tatu' },
  { path: 'extrato', component: ExtratoPage, canActivate: [authGuard], title: 'Extrato | Banco Tatu' },
  { path: 'pix', component: PixPage, canActivate: [authGuard], title: 'Pix | Banco Tatu' },
  { path: '**', redirectTo: 'inicio' },
];
