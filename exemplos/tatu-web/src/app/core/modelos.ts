export interface Sessao {
  token: string;
  nome: string;
}

export interface Conta {
  nome: string;
  saldo: number;
}

export interface Lancamento {
  data: string;
  descricao: string;
  valor: number;
}

export interface Cotacao {
  moeda: string;
  valor: number;
}

export interface PixPedido {
  chave: string;
  valor: number;
}

export interface PixResposta {
  id: string;
  status: string;
}
