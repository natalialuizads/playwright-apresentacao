import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { CompraCartao, Conta, Cotacao, DocumentoRecebido, Lancamento, PixPedido, PixResposta } from './modelos';

/** Todas as chamadas ao BFF passam por aqui. Em dev, /api é redirecionado pelo proxy.conf.json. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  conta() {
    return this.http.get<Conta>('/api/conta');
  }

  extrato() {
    return this.http.get<Lancamento[]>('/api/extrato');
  }

  cotacao() {
    return this.http.get<Cotacao>('/api/cotacao');
  }

  enviarPix(pedido: PixPedido) {
    return this.http.post<PixResposta>('/api/pix', pedido);
  }

  enviarDocumento(arquivo: File) {
    const corpo = new FormData();
    corpo.append('arquivo', arquivo, arquivo.name);
    return this.http.post<DocumentoRecebido>('/api/documentos', corpo);
  }

  comprarNoCartao(valor: number) {
    return this.http.post<CompraCartao>('/api/cartao/compras', { valor });
  }
}
