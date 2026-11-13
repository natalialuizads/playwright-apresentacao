package br.com.tatu.api.dominio;

import br.com.tatu.api.modelo.PixPedido;
import br.com.tatu.api.modelo.PixResposta;
import java.math.BigDecimal;
import org.springframework.stereotype.Service;

/** Regras do Pix. Testado sem Spring e sem navegador em PixServiceTest (base da pirâmide). */
@Service
public class PixService {

    private final BancoEmMemoria banco;

    public PixService(BancoEmMemoria banco) {
        this.banco = banco;
    }

    public PixResposta enviar(PixPedido pedido) {
        if (pedido.chave() == null || pedido.chave().isBlank()) {
            throw new RegraDeNegocioException("Informe a chave Pix");
        }
        if (pedido.valor() == null || pedido.valor().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RegraDeNegocioException("Valor inválido");
        }
        if (pedido.valor().compareTo(banco.conta().saldo()) > 0) {
            throw new RegraDeNegocioException("Saldo insuficiente");
        }
        return new PixResposta(banco.proximoIdPix(), "ENVIADO");
    }
}
