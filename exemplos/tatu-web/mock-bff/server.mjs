// BFF de mentira do Banco Tatu, em Node puro (sem dependências).
// Responde o mesmo contrato do projeto Java (tatu-api), na porta 8080.
// Serve para rodar o front e os testes sem precisar do backend Java.
//
//   node mock-bff/server.mjs        (ou: npm run mock-bff)

import { createServer } from 'node:http';

const PORTA = Number(process.env.PORT ?? 8080);
const TOKEN = 'token-ana';

const CONTA = { nome: 'Ana', saldo: 1520.75 };
const EXTRATO = [
  { data: '2026-11-10', descricao: 'Salário', valor: 4200.0 },
  { data: '2026-11-09', descricao: 'Mercado do bairro', valor: -312.4 },
  { data: '2026-11-08', descricao: 'Pix recebido de João', valor: 80.0 },
];
const COTACAO = { moeda: 'USD', valor: 5.12 };

let contadorPix = 0;

function responder(res, status, corpo) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(corpo === undefined ? '' : JSON.stringify(corpo));
}

function lerCorpo(req) {
  return new Promise((resolve) => {
    let dados = '';
    req.on('data', (parte) => (dados += parte));
    req.on('end', () => {
      try {
        resolve(dados ? JSON.parse(dados) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function autenticado(req) {
  return req.headers.authorization === `Bearer ${TOKEN}`;
}

const servidor = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${PORTA}`);
  const rota = `${req.method} ${pathname}`;

  if (rota === 'GET /api/health') {
    return responder(res, 200, { status: 'UP' });
  }

  if (rota === 'POST /api/login') {
    const { cpf, senha } = await lerCorpo(req);
    const cpfLimpo = String(cpf ?? '').replace(/\D/g, '');
    if (cpfLimpo === '12345678909' && senha === 'segredo123') {
      return responder(res, 200, { token: TOKEN, nome: CONTA.nome });
    }
    return responder(res, 401, { mensagem: 'CPF ou senha inválidos' });
  }

  if (!pathname.startsWith('/api/')) {
    return responder(res, 404, { mensagem: 'Não encontrado' });
  }
  if (!autenticado(req)) {
    return responder(res, 401, { mensagem: 'Sessão inválida' });
  }

  switch (rota) {
    case 'GET /api/conta':
      return responder(res, 200, CONTA);
    case 'GET /api/extrato':
      return responder(res, 200, EXTRATO);
    case 'GET /api/cotacao':
      return responder(res, 200, COTACAO);
    case 'POST /api/pix': {
      const { chave, valor } = await lerCorpo(req);
      if (!chave) return responder(res, 422, { mensagem: 'Informe a chave Pix' });
      if (!(Number(valor) > 0)) return responder(res, 422, { mensagem: 'Valor inválido' });
      if (Number(valor) > CONTA.saldo) return responder(res, 422, { mensagem: 'Saldo insuficiente' });
      contadorPix += 1;
      return responder(res, 201, { id: `PIX-${String(contadorPix).padStart(4, '0')}`, status: 'ENVIADO' });
    }
    default:
      return responder(res, 404, { mensagem: 'Não encontrado' });
  }
});

servidor.listen(PORTA, () => {
  console.log(`Mock BFF do Banco Tatu em http://localhost:${PORTA}`);
});
