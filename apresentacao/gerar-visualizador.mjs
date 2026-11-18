#!/usr/bin/env node
// Gera apresentacao/index.html: um visualizador que roda no navegador, sem dependências.
//
//   node apresentacao/gerar-visualizador.mjs
//
// Lê deck.json (ordem dos slides) e slides/*.html, e escreve index.html com
// todos os slides embutidos. Os vídeos vêm de midia/ (caminhos relativos).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = dirname(fileURLToPath(import.meta.url));
const deck = JSON.parse(readFileSync(join(raiz, 'deck.json'), 'utf8'));

// Os slides referenciam os clipes pelo identificador do editor de slides.
const MIDIA = {
  '/_blob/f76db965dc5e0a7c348d454d7e0a0c7c': 'midia/login.mp4',
  '/_blob/954acd2477057dfae965b3b0d1662f77': 'midia/login.png',
  '/_blob/6833885d64f6f74da20373c5bc8594bd': 'midia/mocks.mp4',
  '/_blob/4045eab707ae302cd98212b8cbd7b3ab': 'midia/mocks.png',
  '/_blob/14ffa6a41e3972cfab53aab28e87a31c': 'midia/terminal.mp4',
  '/_blob/905eb654c84b45c25ec4146960107662': 'midia/terminal.png',
  '/_blob/5c97c515a0ff2637e9cb0cc520220065': 'midia/trace.mp4',
  '/_blob/230dab721a2cf5acb1d7bd820ec0da04': 'midia/trace.png',
  '/_blob/4d64795e423124a1cd29d01e98f90f8a': 'midia/ui.mp4',
  '/_blob/cd90716f463f97b5776f31f482b9dfab': 'midia/ui.png',
  '/_blob/fe73e92623a0c9bfcc8918358a14bf21': 'midia/qr-repo.png',
  '/_blob/8fda833a4be798a2c02bedea349e9cdb': 'midia/relatorio.mp4',
  '/_blob/86e859bddf9bd39d992ee54eaeef3c25': 'midia/relatorio.png',
  '/_blob/75dd92a023094f7e7eba2f3e60702575': 'midia/relatorio-teste.png',
};

const ICONES = {
  Check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="{S}"><path d="M4 12.5l5 5L20 6.5"/></svg>',
  Warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="{S}"><path d="M12 3L2 21h20L12 3z"/><path d="M12 10v5M12 18.2v.1"/></svg>',
};
const FORMAS = {
  'arrow-right': 'polygon(0 30%,60% 30%,60% 0,100% 50%,60% 100%,60% 70%,0 70%)',
  'arrow-down': 'polygon(30% 0,70% 0,70% 55%,100% 55%,50% 100%,0 55%,30% 55%)',
};

function adaptar(html) {
  html = html.replace(/<x-icon name="(\w+)" style="([^"]*)"><\/x-icon>/g, (_, nome, estilo) =>
    (ICONES[nome] || ICONES.Check).replace('{S}', estilo + ';flex:none'));
  html = html.replace(/<x-shape kind="([\w-]+)" style="([^"]*)"><\/x-shape>/g, (_, tipo, estilo) =>
    `<div style="${estilo};flex:none;clip-path:${FORMAS[tipo] || 'none'}"></div>`);
  // <img data-video> vira <video> com o still como poster
  html = html.replace(/<img src="([^"]+)" data-video="([^"]+)" alt="([^"]*)" style="([^"]*)">/g, (_, still, clipe, alt, estilo) =>
    `<video data-src="${MIDIA[clipe]}" poster="${MIDIA[still]}" aria-label="${alt}" muted loop playsinline style="${estilo}"></video>`);
  // imagens comuns guardadas no editor de slides
  html = html.replace(/src="(\/_blob\/[0-9a-f]+)"/g, (m, id) => (MIDIA[id] ? `src="${MIDIA[id]}"` : m));
  return html;
}

const slides = deck.order.map((id) => {
  const html = adaptar(readFileSync(join(raiz, 'slides', `${id}.html`), 'utf8'));
  return html.trim();
});

const faces = Object.values(deck.faces || {}).map((f) => `<link rel="stylesheet" href="${f.href}">`).join('\n');

const pagina = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${deck.title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${faces}
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; background: #0E1117; overflow: hidden; font-family: 'IBM Plex Sans', Arial, sans-serif; }
  #palco { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
  #tela { width: 1920px; height: 1080px; position: relative; flex: none; transform-origin: center center; background: #000; }
  #tela > section { position: absolute; inset: 0; width: 1920px; height: 1080px; overflow: hidden; }
  #tela > section:not(.ativo) { display: none !important; }
  #tela p, #tela h1, #tela h2, #tela h3 { margin: 0; }
  #tela aside { display: none; }
  #tela table { border-collapse: collapse; }
  #tela th { text-align: left; padding: 14px 18px; border-bottom: 2px solid #161A22; font-weight: 600; }
  #tela td { padding: 14px 18px; border-bottom: 1px solid #DDD7CB; vertical-align: top; }
  #barra { position: fixed; left: 0; bottom: 0; height: 4px; background: #F2905F; width: 0; transition: width .2s; z-index: 5; }
  #contador { position: fixed; right: 16px; bottom: 12px; color: #9AA0AC; font: 600 14px 'IBM Plex Sans', Arial, sans-serif; z-index: 5; }
  #notas { position: fixed; left: 0; right: 0; bottom: 0; max-height: 36vh; overflow: auto; padding: 18px 28px 26px; background: rgba(14,17,23,.96); color: #E8E4DA; font: 20px/1.5 'IBM Plex Sans', Arial, sans-serif; display: none; z-index: 6; border-top: 1px solid #2A3040; }
  #notas.aberto { display: block; }
  #notas b { color: #F2905F; letter-spacing: 1px; font-size: 13px; text-transform: uppercase; display: block; margin-bottom: 6px; }
  #ajuda { position: fixed; top: 12px; right: 16px; color: #6B7384; font: 13px 'IBM Plex Sans', Arial, sans-serif; z-index: 5; transition: opacity .6s; }
</style>
</head>
<body>
<div id="palco"><div id="tela">
${slides.join('\n')}
</div></div>
<div id="barra"></div>
<div id="contador"></div>
<div id="notas"><b>Notas do apresentador</b><span id="texto-notas"></span></div>
<div id="ajuda">setas: navegar · F: tela cheia · N: notas · Home e End: início e fim</div>
<script>
(function () {
  var tela = document.getElementById('tela');
  var secoes = Array.prototype.slice.call(tela.children);
  var atual = 0;

  function ajusta() {
    var k = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    tela.style.transform = 'scale(' + k + ')';
  }

  function mostra(i) {
    atual = Math.max(0, Math.min(secoes.length - 1, i));
    secoes.forEach(function (s, n) {
      var ativo = n === atual;
      s.classList.toggle('ativo', ativo);
      Array.prototype.forEach.call(s.querySelectorAll('video'), function (v) {
        if (ativo) {
          if (!v.getAttribute('src')) v.src = v.getAttribute('data-src');
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        } else { v.pause(); }
      });
    });
    var nota = secoes[atual].querySelector('aside');
    document.getElementById('texto-notas').textContent = nota ? nota.textContent : '(sem notas neste slide)';
    document.getElementById('barra').style.width = ((atual + 1) / secoes.length * 100) + '%';
    document.getElementById('contador').textContent = (atual + 1) + ' / ' + secoes.length;
    history.replaceState(null, '', '#' + (atual + 1));
  }

  document.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Enter') { e.preventDefault(); mostra(atual + 1); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); mostra(atual - 1); }
    else if (k === 'Home') mostra(0);
    else if (k === 'End') mostra(secoes.length - 1);
    else if (k === 'f' || k === 'F') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); }
    else if (k === 'n' || k === 'N') document.getElementById('notas').classList.toggle('aberto');
  });

  var x0 = null;
  document.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; });
  document.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) mostra(atual + (dx < 0 ? 1 : -1));
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest('#notas')) return;
    mostra(atual + (e.clientX < window.innerWidth * 0.25 ? -1 : 1));
  });

  window.addEventListener('resize', ajusta);
  ajusta();
  mostra((parseInt(location.hash.slice(1), 10) || 1) - 1);
  setTimeout(function () { document.getElementById('ajuda').style.opacity = 0; }, 5000);
})();
</script>
</body>
</html>
`;

writeFileSync(join(raiz, 'index.html'), pagina);
console.log(`index.html gerado com ${slides.length} slides`);
