package br.com.tatu.api.web;

import br.com.tatu.api.cotacao.CotacaoClient;
import br.com.tatu.api.dominio.BancoEmMemoria;
import br.com.tatu.api.dominio.PixService;
import br.com.tatu.api.modelo.Conta;
import br.com.tatu.api.modelo.Cotacao;
import br.com.tatu.api.modelo.Credenciais;
import br.com.tatu.api.modelo.Erro;
import br.com.tatu.api.modelo.Lancamento;
import br.com.tatu.api.modelo.PixPedido;
import br.com.tatu.api.modelo.PixResposta;
import br.com.tatu.api.modelo.Sessao;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ApiController {

    private static final String AUTH = "Authorization";

    private final BancoEmMemoria banco;
    private final PixService pix;
    private final CotacaoClient cotacao;
    private final Autenticacao autenticacao;

    public ApiController(BancoEmMemoria banco, PixService pix, CotacaoClient cotacao, Autenticacao autenticacao) {
        this.banco = banco;
        this.pix = pix;
        this.cotacao = cotacao;
        this.autenticacao = autenticacao;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }

    @PostMapping("/login")
    public ResponseEntity<Object> login(@RequestBody Credenciais credenciais) {
        String cpf = credenciais.cpf() == null ? "" : credenciais.cpf().replaceAll("\\D", "");
        if (BancoEmMemoria.CPF.equals(cpf) && BancoEmMemoria.SENHA.equals(credenciais.senha())) {
            return ResponseEntity.ok(new Sessao(BancoEmMemoria.TOKEN, banco.conta().nome()));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new Erro("CPF ou senha inválidos"));
    }

    @GetMapping("/conta")
    public Conta conta(@RequestHeader(value = AUTH, required = false) String authorization) {
        autenticacao.exigir(authorization);
        return banco.conta();
    }

    @GetMapping("/extrato")
    public List<Lancamento> extrato(@RequestHeader(value = AUTH, required = false) String authorization) {
        autenticacao.exigir(authorization);
        return banco.extrato();
    }

    @GetMapping("/cotacao")
    public Cotacao cotacao(@RequestHeader(value = AUTH, required = false) String authorization) {
        autenticacao.exigir(authorization);
        return cotacao.dolar();
    }

    @PostMapping("/pix")
    @ResponseStatus(HttpStatus.CREATED)
    public PixResposta pix(@RequestHeader(value = AUTH, required = false) String authorization,
                           @RequestBody PixPedido pedido) {
        autenticacao.exigir(authorization);
        return pix.enviar(pedido);
    }
}
