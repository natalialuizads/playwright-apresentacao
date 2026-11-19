import { CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';

type Status = 'inicio' | 'desafio' | 'aprovada' | 'recusada' | 'erro';

/**
 * Compra no cartão com verificação 3DS: o banco emissor abre um desafio num
 * iframe de OUTRA origem e manda um código por SMS. Quando o cliente confirma,
 * o iframe avisa esta página com postMessage.
 */
@Component({
  selector: 'tatu-cartao',
  imports: [CurrencyPipe, RouterLink],
  template: `
    <main class="pagina estreita">
      <h1>Compra no cartão</h1>
      <p class="sub">Loja Tatu · Fone de ouvido · {{ valor | currency: 'BRL' }}</p>

      @switch (status()) {
        @case ('inicio') {
          <button type="button" (click)="pagar()">Pagar {{ valor | currency: 'BRL' }}</button>
        }
        @case ('desafio') {
          <iframe [src]="desafio()" title="Verificação do banco emissor" width="420" height="300"></iframe>
        }
        @case ('aprovada') {
          <p class="sucesso" role="status">Compra aprovada</p>
        }
        @case ('recusada') {
          <p class="erro" role="alert">Compra recusada: código inválido</p>
        }
        @case ('erro') {
          <p class="erro" role="alert">Não foi possível iniciar a compra.</p>
        }
      }

      <a routerLink="/inicio">Voltar</a>
    </main>
  `,
})
export class CartaoPage implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly valor = 349.9;
  readonly status = signal<Status>('inicio');
  readonly desafio = signal<SafeResourceUrl | null>(null);
  private origemDesafio = '';
  private idCompra = '';

  private readonly ouvir = (evento: MessageEvent) => {
    // Só aceita mensagem da origem do emissor e da compra atual
    if (evento.origin !== this.origemDesafio) return;
    const { tipo, id, status } = evento.data ?? {};
    if (tipo !== '3ds' || id !== this.idCompra) return;
    this.status.set(status === 'aprovada' ? 'aprovada' : 'recusada');
  };

  constructor() {
    window.addEventListener('message', this.ouvir);
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.ouvir);
  }

  pagar(): void {
    this.api.comprarNoCartao(this.valor).subscribe({
      next: ({ id, desafioUrl }) => {
        const url = new URL(desafioUrl);
        url.searchParams.set('origem', location.origin); // o emissor só responde para esta origem
        this.idCompra = id;
        this.origemDesafio = url.origin;
        this.desafio.set(this.sanitizer.bypassSecurityTrustResourceUrl(url.toString()));
        this.status.set('desafio');
      },
      error: () => this.status.set('erro'),
    });
  }
}
