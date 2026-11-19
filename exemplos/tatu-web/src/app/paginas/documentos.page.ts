import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { DocumentoRecebido } from '../core/modelos';

const TIPOS = ['application/pdf', 'image/png', 'image/jpeg'];
const LIMITE = 1024 * 1024; // 1 MB

/** Envio de documento: input de arquivo, botão que abre o seletor e área de arrastar e soltar. */
@Component({
  selector: 'tatu-documentos',
  imports: [RouterLink],
  template: `
    <main class="pagina estreita">
      <h1>Enviar documento</h1>
      <p class="sub">Comprovante de renda em PDF, PNG ou JPG, até 1 MB.</p>

      <div class="formulario">
        <label for="arquivo">Arquivo</label>
        <input #campo id="arquivo" type="file" accept=".pdf,.png,.jpg,.jpeg" (change)="escolher(campo.files)" />
        <button type="button" (click)="campo.click()">Escolher do computador</button>
      </div>

      <div
        class="area-soltar"
        role="region"
        aria-label="Área para soltar arquivo"
        (dragover)="$event.preventDefault()"
        (drop)="soltar($event)"
      >
        Ou arraste o arquivo para cá
      </div>

      @if (arquivo(); as a) {
        <p>Selecionado: {{ a.name }} ({{ kb(a.size) }} KB)</p>
      }
      @if (erro()) {
        <p class="erro" role="alert">{{ erro() }}</p>
      }

      <button type="button" (click)="enviar()" [disabled]="!arquivo() || enviando()">Enviar documento</button>

      @if (recebido(); as r) {
        <p class="sucesso" role="status">Documento recebido: {{ r.nome }}, protocolo {{ r.protocolo }}</p>
      }

      <a routerLink="/inicio">Voltar</a>
    </main>
  `,
})
export class DocumentosPage {
  private readonly api = inject(ApiService);
  private readonly campo = viewChild.required<ElementRef<HTMLInputElement>>('campo');

  readonly arquivo = signal<File | null>(null);
  readonly erro = signal('');
  readonly enviando = signal(false);
  readonly recebido = signal<DocumentoRecebido | null>(null);

  kb(bytes: number): string {
    return (bytes / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  }

  escolher(lista: FileList | null): void {
    this.validar(lista?.[0] ?? null);
  }

  soltar(evento: DragEvent): void {
    evento.preventDefault();
    this.validar(evento.dataTransfer?.files?.[0] ?? null);
  }

  private validar(arquivo: File | null): void {
    this.recebido.set(null);
    this.erro.set('');
    this.arquivo.set(null);
    if (!arquivo) return;
    if (!TIPOS.includes(arquivo.type)) {
      this.erro.set('Formato não aceito. Envie PDF, PNG ou JPG.');
    } else if (arquivo.size > LIMITE) {
      this.erro.set('Arquivo maior que 1 MB.');
    } else {
      this.arquivo.set(arquivo);
    }
  }

  enviar(): void {
    const arquivo = this.arquivo();
    if (!arquivo) return;
    this.enviando.set(true);
    this.api.enviarDocumento(arquivo).subscribe({
      next: (r) => {
        this.recebido.set(r);
        this.arquivo.set(null);
        this.campo().nativeElement.value = '';
        this.enviando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível enviar o documento.');
        this.enviando.set(false);
      },
    });
  }
}
