import { CurrencyPipe } from '@angular/common';
import { Component, ViewEncapsulation, input, signal } from '@angular/core';

/**
 * Cartão de saldo renderizado dentro de um Shadow DOM de verdade
 * (ViewEncapsulation.ShadowDom). Serve para mostrar que os locators
 * do Playwright atravessam shadow roots abertos sem configuração.
 */
@Component({
  selector: 'tatu-cartao-saldo',
  encapsulation: ViewEncapsulation.ShadowDom,
  imports: [CurrencyPipe],
  template: `
    <section class="cartao" aria-label="Saldo">
      <p class="rotulo">Saldo disponível</p>
      <p class="valor" data-testid="saldo">
        {{ visivel() ? (valor() | currency: 'BRL') : '••••••' }}
      </p>
      <button type="button" (click)="visivel.set(!visivel())">
        {{ visivel() ? 'Ocultar saldo' : 'Mostrar saldo' }}
      </button>
    </section>
  `,
  styles: `
    .cartao {
      background: #2b3a2f;
      color: #f4efe6;
      border-radius: 16px;
      padding: 24px;
      font-family: system-ui, sans-serif;
    }
    .rotulo { margin: 0; opacity: 0.8; }
    .valor { margin: 8px 0 16px; font-size: 2rem; font-weight: 600; }
    button {
      background: transparent;
      color: inherit;
      border: 1px solid currentColor;
      border-radius: 8px;
      padding: 6px 12px;
      cursor: pointer;
    }
  `,
})
export class CartaoSaldo {
  readonly valor = input.required<number>();
  readonly visivel = signal(true);
}
