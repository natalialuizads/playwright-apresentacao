import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Lancamento } from '../core/modelos';

type Estado = 'carregando' | 'erro' | 'ok';

@Component({
  selector: 'tatu-extrato',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  template: `
    <main class="pagina">
      <h1>Extrato</h1>
      @switch (estado()) {
        @case ('carregando') {
          <p role="status">Carregando extrato...</p>
        }
        @case ('erro') {
          <div class="erro" role="alert">
            <p>Não foi possível carregar o extrato.</p>
            <button type="button" (click)="carregar()">Tentar novamente</button>
          </div>
        }
        @case ('ok') {
          @if (itens().length === 0) {
            <p>Nenhuma movimentação no período.</p>
          } @else {
            <table>
              <caption>Movimentações</caption>
              <thead>
                <tr><th>Data</th><th>Descrição</th><th>Valor</th></tr>
              </thead>
              <tbody>
                @for (item of itens(); track $index) {
                  <tr>
                    <td>{{ item.data | date: 'dd/MM/yyyy' : 'UTC' }}</td>
                    <td>{{ item.descricao }}</td>
                    <td [class.negativo]="item.valor < 0">{{ item.valor | currency: 'BRL' }}</td>
                  </tr>
                }
              </tbody>
            </table>
            <button type="button" (click)="exportarCsv()">Exportar CSV</button>
          }
        }
      }
      <a routerLink="/inicio">Voltar</a>
    </main>
  `,
})
export class ExtratoPage implements OnInit {
  private readonly api = inject(ApiService);

  readonly estado = signal<Estado>('carregando');
  readonly itens = signal<Lancamento[]>([]);

  ngOnInit(): void {
    this.carregar();
  }

  /** Gera o CSV no navegador e baixa como extrato-tatu.csv (separador ; e BOM para o Excel abrir os acentos). */
  exportarCsv(): void {
    const linhas = this.itens().map((i) => [i.data, i.descricao, i.valor.toFixed(2).replace('.', ',')].join(';'));
    const csv = '\uFEFF' + ['data;descricao;valor', ...linhas].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'extrato-tatu.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  carregar(): void {
    this.estado.set('carregando');
    this.api.extrato().subscribe({
      next: (lista) => {
        this.itens.set(lista);
        this.estado.set('ok');
      },
      error: () => this.estado.set('erro'),
    });
  }
}
