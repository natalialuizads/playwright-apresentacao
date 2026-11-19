// BFF de mentira do Banco Tatu, em Node (só depende do pacote ws, para o WebSocket).
// Responde o mesmo contrato do projeto Java (tatu-api), na porta 8080, mais
// algumas rotas que só existem aqui: documentos, cartão com 3DS, cotação ao vivo
// e as rotas de teste (/api/teste/...).
// Serve para rodar o front e os testes sem precisar do backend Java.
//
//   node mock-bff/server.mjs        (ou: npm run mock-bff)

import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

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

// Clientes de teste: cada teste cria o seu pela API e apaga no fim.
// Ficam isolados da Ana e uns dos outros, então os testes rodam em paralelo
// sem um mexer no dado do outro. Num BFF de verdade, isto seria um endpoint
// ligado só no ambiente de teste, ou um script de massa de dados.
//
//   POST   /api/teste/clientes          { nome?, saldo?, extrato? } -> 201 { token, nome, saldo }
//   GET    /api/teste/clientes/:token   estado atual (saldo e extrato)
//   DELETE /api/teste/clientes/:token   -> 204
const clientesDeTeste = new Map();
let contadorClientes = 0;

// Documentos enviados (POST /api/documentos, multipart)
let contadorDocumentos = 0;
const LIMITE_DOCUMENTO = 1024 * 1024;

// Cartão com 3DS: cada compra gera um desafio e um código por "SMS".
// Os SMS ficam numa caixa de teste, lida pelos testes em GET /api/teste/sms?referencia=<id>.
// Num ambiente real, isso é a API de teste do provedor de SMS ou de e-mail (Mailpit, sandbox).
const compras = new Map();
const caixaDeSms = [];
let contadorCompras = 0;

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

function lerBytes(req) {
  return new Promise((resolve) => {
    const partes = [];
    req.on('data', (p) => partes.push(p));
    req.on('end', () => resolve(Buffer.concat(partes)));
  });
}

/** Lê o primeiro arquivo de um corpo multipart/form-data: nome e tamanho. */
function arquivoDoMultipart(req, corpo) {
  const limite = /boundary=(.+)$/.exec(req.headers['content-type'] ?? '')?.[1];
  if (!limite) return null;
  const texto = corpo.toString('latin1');
  const nome = /filename="([^"]*)"/.exec(texto)?.[1];
  const inicio = texto.indexOf('\r\n\r\n') + 4;
  const fim = texto.indexOf(`\r\n--${limite}`, inicio);
  if (!nome || inicio < 4 || fim < 0) return null;
  return { nome: Buffer.from(nome, 'latin1').toString('utf8'), tamanho: fim - inicio };
}

function paginaDoDesafio(id, origem) {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Verificação 3DS</title>
<style>body{font-family:system-ui,sans-serif;margin:0;padding:20px;color:#1f2a22}
form{display:flex;flex-direction:column;gap:8px}input,button{font:inherit;padding:8px}</style></head>
<body>
  <h2>Banco Emissor Tatu</h2>
  <p>Enviamos um código por SMS para (11) •••••-4321.</p>
  <form>
    <label for="codigo">Código recebido por SMS</label>
    <input id="codigo" inputmode="numeric" autocomplete="one-time-code">
    <button type="submit">Confirmar</button>
  </form>
  <script>
    document.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const codigo = document.getElementById('codigo').value;
      const r = await fetch('/3ds/confirmar', { method: 'POST', body: JSON.stringify({ id: ${JSON.stringify(id)}, codigo }) });
      const { status } = await r.json();
      // Avisa a página da loja, só na origem dela
      parent.postMessage({ tipo: '3ds', id: ${JSON.stringify(id)}, status }, ${JSON.stringify(origem)});
    });
  </script>
</body></html>`;
}

function tokenDe(req) {
  return String(req.headers.authorization ?? '').replace(/^Bearer /, '');
}

function autenticado(req) {
  const token = tokenDe(req);
  return token === TOKEN || clientesDeTeste.has(token);
}

/** A cliente de teste dona do token, ou null para a Ana (que nunca muda). */
function clienteDeTeste(req) {
  return clientesDeTeste.get(tokenDe(req)) ?? null;
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

  // Página do desafio 3DS: é o "banco emissor", outra origem, aberta num iframe
  if (rota === 'GET /3ds/desafio') {
    const params = new URL(req.url, `http://localhost:${PORTA}`).searchParams;
    const id = params.get('id') ?? '';
    if (!compras.has(id)) return responder(res, 404, { mensagem: 'Desafio não encontrado' });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(paginaDoDesafio(id, params.get('origem') ?? '*'));
  }

  if (rota === 'POST /3ds/confirmar') {
    const { id, codigo } = await lerCorpo(req);
    const compra = compras.get(id);
    if (!compra) return responder(res, 404, { mensagem: 'Desafio não encontrado' });
    compra.status = String(codigo).trim() === compra.codigo ? 'aprovada' : 'recusada';
    return responder(res, 200, { status: compra.status });
  }

  // Caixa de SMS de teste: filtre pela referência para não pegar o SMS de outro teste
  if (rota === 'GET /api/teste/sms') {
    const referencia = new URL(req.url, `http://localhost:${PORTA}`).searchParams.get('referencia');
    const sms = caixaDeSms.filter((m) => !referencia || m.referencia === referencia).at(-1);
    return sms ? responder(res, 200, sms) : responder(res, 404, { mensagem: 'Nenhum SMS' });
  }

  if (pathname.startsWith('/api/teste/clientes')) {
    const token = pathname.split('/')[4];
    if (req.method === 'POST' && !token) {
      const { nome = 'Cliente de teste', saldo = 1000, extrato = [] } = await lerCorpo(req);
      contadorClientes += 1;
      const novo = { token: `token-teste-${contadorClientes}`, nome, saldo: Number(saldo), extrato: [...extrato] };
      clientesDeTeste.set(novo.token, novo);
      return responder(res, 201, { token: novo.token, nome: novo.nome, saldo: novo.saldo });
    }
    const cliente = clientesDeTeste.get(token);
    if (!cliente) return responder(res, 404, { mensagem: 'Cliente de teste não encontrada' });
    if (req.method === 'GET') return responder(res, 200, cliente);
    if (req.method === 'DELETE') {
      clientesDeTeste.delete(token);
      return responder(res, 204);
    }
  }

  if (!pathname.startsWith('/api/')) {
    return responder(res, 404, { mensagem: 'Não encontrado' });
  }
  if (!autenticado(req)) {
    return responder(res, 401, { mensagem: 'Sessão inválida' });
  }

  const cliente = clienteDeTeste(req);

  switch (rota) {
    case 'GET /api/conta':
      return responder(res, 200, cliente ? { nome: cliente.nome, saldo: cliente.saldo } : CONTA);
    case 'GET /api/extrato':
      return responder(res, 200, cliente ? cliente.extrato : EXTRATO);
    case 'GET /api/cotacao':
      return responder(res, 200, COTACAO);
    case 'POST /api/pix': {
      const { chave, valor } = await lerCorpo(req);
      if (!chave) return responder(res, 422, { mensagem: 'Informe a chave Pix' });
      if (!(Number(valor) > 0)) return responder(res, 422, { mensagem: 'Valor inválido' });
      const saldo = cliente ? cliente.saldo : CONTA.saldo;
      if (Number(valor) > saldo) return responder(res, 422, { mensagem: 'Saldo insuficiente' });
      contadorPix += 1;
      if (cliente) {
        // Só a cliente de teste muda de saldo: a Ana fica igual para os outros testes
        cliente.saldo = Math.round((cliente.saldo - Number(valor)) * 100) / 100;
        cliente.extrato.unshift({ data: new Date().toISOString().slice(0, 10), descricao: `Pix para ${chave}`, valor: -Number(valor) });
      }
      return responder(res, 201, { id: `PIX-${String(contadorPix).padStart(4, '0')}`, status: 'ENVIADO' });
    }
    case 'POST /api/documentos': {
      const arquivo = arquivoDoMultipart(req, await lerBytes(req));
      if (!arquivo) return responder(res, 400, { mensagem: 'Envie um arquivo no campo arquivo' });
      if (arquivo.tamanho > LIMITE_DOCUMENTO) return responder(res, 413, { mensagem: 'Arquivo maior que 1 MB' });
      contadorDocumentos += 1;
      return responder(res, 201, { protocolo: `DOC-${String(contadorDocumentos).padStart(4, '0')}`, ...arquivo });
    }
    case 'POST /api/cartao/compras': {
      const { valor } = await lerCorpo(req);
      contadorCompras += 1;
      const id = `CMP-${String(contadorCompras).padStart(4, '0')}`;
      const codigo = String(Math.floor(100000 + Math.random() * 900000));
      compras.set(id, { id, valor: Number(valor), codigo, status: 'pendente' });
      caixaDeSms.push({ referencia: id, telefone: '+5511987654321', texto: `Banco Tatu: seu código de compra é ${codigo}`, quando: new Date().toISOString() });
      return responder(res, 201, { id, desafioUrl: `http://${req.headers.host}/3ds/desafio?id=${id}` });
    }
    default:
      return responder(res, 404, { mensagem: 'Não encontrado' });
  }
});

// Cotação ao vivo: ws://localhost:8080/ws/cotacao manda um valor por segundo
const cotacaoAoVivo = new WebSocketServer({ noServer: true });
let dolar = 5.12;
setInterval(() => {
  dolar = Math.round((dolar + (Math.random() - 0.5) * 0.02) * 10000) / 10000;
  const tique = JSON.stringify({ moeda: 'USD', valor: dolar, hora: new Date().toLocaleTimeString('pt-BR') });
  for (const socket of cotacaoAoVivo.clients) socket.send(tique);
}, 1000).unref();

servidor.on('upgrade', (req, socket, cabecalho) => {
  if (new URL(req.url, `http://localhost:${PORTA}`).pathname !== '/ws/cotacao') return socket.destroy();
  cotacaoAoVivo.handleUpgrade(req, socket, cabecalho, (ws) => cotacaoAoVivo.emit('connection', ws, req));
});

servidor.listen(PORTA, () => {
  console.log(`Mock BFF do Banco Tatu em http://localhost:${PORTA}`);
});
