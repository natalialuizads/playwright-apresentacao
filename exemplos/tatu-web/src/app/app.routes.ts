import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { CartaoPage } from './paginas/cartao.page';
import { CotacaoPage } from './paginas/cotacao.page';
import { DocumentosPage } from './paginas/documentos.page';
import { ExtratoPage } from './paginas/extrato.page';
import { InicioPage } from './paginas/inicio.page';
import { LoginPage } from './paginas/login.page';
import { PixPage } from './paginas/pix.page';
import { ServicosPage } from './paginas/servicos.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  { path: 'login', component: LoginPage, title: 'Entrar | Banco Tatu' },
  { path: 'inicio', component: InicioPage, canActivate: [authGuard], title: 'Início | Banco Tatu' },
  { path: 'extrato', component: ExtratoPage, canActivate: [authGuard], title: 'Extrato | Banco Tatu' },
  { path: 'pix', component: PixPage, canActivate: [authGuard], title: 'Pix | Banco Tatu' },
  { path: 'documentos', component: DocumentosPage, canActivate: [authGuard], title: 'Documentos | Banco Tatu' },
  { path: 'cartao', component: CartaoPage, canActivate: [authGuard], title: 'Cartão | Banco Tatu' },
  { path: 'servicos', component: ServicosPage, canActivate: [authGuard], title: 'Serviços | Banco Tatu' },
  { path: 'cotacao', component: CotacaoPage, canActivate: [authGuard], title: 'Cotação ao vivo | Banco Tatu' },
  { path: '**', redirectTo: 'inicio' },
];
