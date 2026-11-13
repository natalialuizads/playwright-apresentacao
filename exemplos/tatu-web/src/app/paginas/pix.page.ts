import { HttpErrorResponse } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import '../componentes/pix-favoritos.element';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'tatu-pix',
  imports: [FormsModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <main class="pagina estreita">
      <h1>Pix</h1>

      <tatu-pix-favoritos (favorito-selecionado)="usarFavorito($event)"></tatu-pix-favoritos>

      <form class="formulario" (ngSubmit)="enviar()">
        <label for="chave">Chave Pix</label>
        <input id="chave" name="chave" [(ngModel)]="chave" />

        <label for="valor">Valor</label>
        <input id="valor" name="valor" type="number" step="0.01" min="0" [(ngModel)]="valor" />

        <label for="conta">Conta de origem</label>
        <select id="conta" name="conta" [(ngModel)]="conta">
          <option>Conta corrente</option>
          <option>Poupança</option>
        </select>

        <label class="opcao">
          <input type="checkbox" name="favoritar" [(ngModel)]="favoritar" />
          Salvar como favorito
        </label>

        <button type="submit" [disabled]="enviando()">Enviar Pix</button>
      </form>

      @if (comprovante()) {
        <p class="sucesso" role="status">Pix enviado! Comprovante {{ comprovante() }}</p>
        <p>Debitado de: {{ conta() }}</p>
        @if (favoritoSalvo()) {
          <p>Chave salva nos favoritos.</p>
        }
      }
      @if (erro()) {
        <p class="erro" role="alert">{{ erro() }}</p>
      }
      <a routerLink="/inicio">Voltar</a>
    </main>
  `,
})
export class PixPage {
  private readonly api = inject(ApiService);

  readonly chave = signal('');
  readonly valor = signal<number | null>(null);
  readonly enviando = signal(false);
  readonly comprovante = signal('');
  readonly erro = signal('');
  readonly conta = signal('Conta corrente');
  readonly favoritar = signal(false);
  readonly favoritoSalvo = signal(false);

  usarFavorito(evento: Event): void {
    this.chave.set((evento as CustomEvent<string>).detail);
  }

  enviar(): void {
    this.enviando.set(true);
    this.comprovante.set('');
    this.erro.set('');
    this.api.enviarPix({ chave: this.chave(), valor: Number(this.valor()) }).subscribe({
      next: (r) => {
        this.enviando.set(false);
        this.favoritoSalvo.set(this.favoritar());
        this.comprovante.set(r.id);
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.erro.set(e.status === 422 && e.error?.mensagem ? e.error.mensagem : 'Não foi possível enviar o Pix.');
      },
    });
  }
}
