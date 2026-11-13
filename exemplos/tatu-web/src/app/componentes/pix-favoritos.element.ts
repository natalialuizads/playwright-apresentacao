/**
 * Web Component nativo, sem Angular, com Shadow DOM aberto.
 * Simula um pedaço de tela entregue por outro time (como um microfrontend
 * exportado como Web Component). Ao clicar num favorito, dispara o evento
 * "favorito-selecionado" com a chave Pix em event.detail.
 */
export class TatuPixFavoritos extends HTMLElement {
  connectedCallback(): void {
    if (this.shadowRoot) {
      return;
    }
    const raiz = this.attachShadow({ mode: 'open' });
    raiz.innerHTML = `
      <style>
        :host { display: block; margin-bottom: 16px; }
        ul { list-style: none; display: flex; gap: 8px; padding: 0; margin: 8px 0 0; }
        button {
          border: 1px solid #2b3a2f; background: #f4efe6; color: #2b3a2f;
          border-radius: 999px; padding: 6px 14px; cursor: pointer;
        }
      </style>
      <p>Favoritos</p>
      <ul aria-label="Favoritos">
        <li><button type="button" data-chave="mae@tatu.com.br">Mãe</button></li>
        <li><button type="button" data-chave="11999990000">Síndico</button></li>
      </ul>
    `;
    raiz.querySelectorAll<HTMLButtonElement>('button').forEach((botao) =>
      botao.addEventListener('click', () =>
        this.dispatchEvent(
          new CustomEvent('favorito-selecionado', {
            detail: botao.dataset['chave'],
            bubbles: true,
            composed: true,
          }),
        ),
      ),
    );
  }
}

if (!customElements.get('tatu-pix-favoritos')) {
  customElements.define('tatu-pix-favoritos', TatuPixFavoritos);
}
