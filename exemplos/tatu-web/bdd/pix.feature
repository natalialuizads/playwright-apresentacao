# language: pt
Funcionalidade: Pix
  Como cliente do Banco Tatu
  Quero enviar um Pix
  Para pagar alguém na hora

  Contexto:
    Dado que sou uma cliente com saldo de R$ 100

  Cenário: Pix dentro do saldo
    Quando eu envio um Pix de R$ 30 para "mae@tatu.com.br"
    Então vejo o comprovante
    E meu saldo passa a ser R$ 70

  Cenário: Pix acima do saldo
    Quando eu envio um Pix de R$ 500 para "mae@tatu.com.br"
    Então vejo o aviso "Saldo insuficiente"

  Esquema do Cenário: Pix recusado pelo valor ou pela chave
    Quando eu envio um Pix de R$ <valor> para "<chave>"
    Então vejo o aviso "<aviso>"

    Exemplos:
      | valor | chave           | aviso                |
      | 0     | mae@tatu.com.br | Valor inválido       |
      | 10    |                 | Informe a chave Pix  |
