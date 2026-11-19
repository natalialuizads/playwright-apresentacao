import { CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Tique {
  moeda: string;
  valor: number;
  hora: string;
}

/** Cotação ao vivo por WebSocket, com reconexão quando o servidor cai. */
@Component({
  selector: 'tatu-cotacao',
  imports: [CurrencyPipe, RouterLink],
  template: `
    <main class="pagina estreita">
      <h1>Cotação ao vivo</h1>

      <p role="status">{{ situacao() }}</p>

      @if (ultimos().length) {
        <p class="destaque">Dólar agora: {{ ultimos()[0].valor | currency: 'BRL' : 'symbol' : '1.2-4' }}</p>
        <ul aria-label="Últimas atualizações">
          @for (t of ultimos(); track $index) {
            <li>{{ t.hora }}: {{ t.valor | currency: 'BRL' : 'symbol' : '1.2-4' }}</li>
          }
        </ul>
      }

      <a routerLink="/inicio">Voltar</a>
    </main>
  `,
})
export class CotacaoPage implements OnInit, OnDestroy {
  readonly situacao = signal('Conectando...');
  readonly ultimos = signal<Tique[]>([]);
  private socket: WebSocket | null = null;
  private religar: ReturnType<typeof setTimeout> | undefined;
  private saindo = false;

  ngOnInit(): void {
    this.conectar();
  }

  ngOnDestroy(): void {
    this.saindo = true;
    clearTimeout(this.religar);
    this.socket?.close();
  }

  private conectar(): void {
    const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/cotacao`;
    const socket = new WebSocket(url);
    this.socket = socket;
    socket.onopen = () => this.situacao.set('Ao vivo');
    socket.onmessage = (evento) => {
      const tique: Tique = JSON.parse(evento.data);
      this.ultimos.update((lista) => [tique, ...lista].slice(0, 5));
    };
    socket.onclose = () => {
      if (this.saindo) return;
      this.situacao.set('Conexão perdida. Tentando de novo...');
      this.religar = setTimeout(() => this.conectar(), 2000);
    };
  }
}
