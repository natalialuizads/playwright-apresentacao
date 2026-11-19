import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartaoSaldo } from '../componentes/cartao-saldo';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Conta, Cotacao } from '../core/modelos';

@Component({
  selector: 'tatu-inicio',
  imports: [CartaoSaldo, CurrencyPipe, RouterLink],
  template: `
    <main class="pagina">
      @if (conta(); as c) {
        <h1>Olá, {{ c.nome }}</h1>
        <tatu-cartao-saldo [valor]="c.saldo" />
      } @else if (erroConta()) {
        <p class="erro" role="alert">Não foi possível carregar sua conta.</p>
      } @else {
        <p role="status">Carregando sua conta...</p>
      }

      <section class="cotacao" aria-label="Cotação">
        @if (cotacao(); as q) {
          <p>Dólar hoje: {{ q.valor | currency: 'BRL' : 'symbol' : '1.2-2' }}</p>
        } @else if (erroCotacao()) {
          <p>Cotação indisponível no momento.</p>
        }
      </section>

      <nav class="atalhos" aria-label="Atalhos">
        <a routerLink="/extrato">Extrato</a>
        <a routerLink="/pix">Pix</a>
        <button type="button" (click)="sair()">Sair</button>
      </nav>

      <nav class="atalhos" aria-label="Mais serviços">
        <a routerLink="/documentos">Documentos</a>
        <a routerLink="/cartao">Cartão</a>
        <a routerLink="/servicos">Serviços</a>
        <a routerLink="/cotacao">Cotação ao vivo</a>
      </nav>
    </main>
  `,
})
export class InicioPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly conta = signal<Conta | null>(null);
  readonly erroConta = signal(false);
  readonly cotacao = signal<Cotacao | null>(null);
  readonly erroCotacao = signal(false);

  ngOnInit(): void {
    this.api.conta().subscribe({
      next: (c) => this.conta.set(c),
      error: () => this.erroConta.set(true),
    });
    this.api.cotacao().subscribe({
      next: (q) => this.cotacao.set(q),
      error: () => this.erroCotacao.set(true),
    });
  }

  sair(): void {
    this.auth.sair();
    this.router.navigateByUrl('/login');
  }
}
