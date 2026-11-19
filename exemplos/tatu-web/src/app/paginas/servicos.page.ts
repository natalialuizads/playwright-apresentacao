import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

const AGENCIAS = [
  { nome: 'Agência Paulista', lat: -23.5614, lon: -46.6559 },
  { nome: 'Agência Centro Rio', lat: -22.9035, lon: -43.1772 },
  { nome: 'Agência Savassi', lat: -19.9386, lon: -43.9351 },
];

function distanciaKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Recursos que dependem de permissão do navegador: área de transferência, localização e notificações. */
@Component({
  selector: 'tatu-servicos',
  imports: [RouterLink],
  template: `
    <main class="pagina estreita">
      <h1>Serviços</h1>

      <section aria-label="Minha chave Pix" class="formulario">
        <p>Minha chave Pix: <strong>{{ chave }}</strong></p>
        <button type="button" (click)="copiar()">Copiar chave</button>
        @if (copia()) {
          <p role="status">{{ copia() }}</p>
        }
      </section>

      <section aria-label="Agência mais próxima" class="formulario">
        <button type="button" (click)="localizar()">Encontrar agência mais próxima</button>
        @if (agencia()) {
          <p role="status">{{ agencia() }}</p>
        }
      </section>

      <section aria-label="Avisos de Pix" class="formulario">
        <button type="button" (click)="ativarAvisos()">Avisar quando cair um Pix</button>
        @if (avisos()) {
          <p role="status">{{ avisos() }}</p>
        }
      </section>

      <a routerLink="/inicio">Voltar</a>
    </main>
  `,
})
export class ServicosPage {
  readonly chave = 'ana@tatu.com.br';
  readonly copia = signal('');
  readonly agencia = signal('');
  readonly avisos = signal('');

  async copiar(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.chave);
      this.copia.set('Chave copiada');
    } catch {
      this.copia.set('Não foi possível copiar. Selecione e copie a chave.');
    }
  }

  localizar(): void {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const aqui = { lat: coords.latitude, lon: coords.longitude };
        const [maisPerto] = AGENCIAS.map((a) => ({ ...a, km: distanciaKm(aqui, a) })).sort((x, y) => x.km - y.km);
        const km = maisPerto.km.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
        this.agencia.set(`${maisPerto.nome}, a ${km} km`);
      },
      () => this.agencia.set('Permita a localização para encontrar a agência.'),
    );
  }

  async ativarAvisos(): Promise<void> {
    const resposta = await Notification.requestPermission();
    this.avisos.set(resposta === 'granted' ? 'Avisos ativados' : 'Avisos bloqueados no navegador');
  }
}
