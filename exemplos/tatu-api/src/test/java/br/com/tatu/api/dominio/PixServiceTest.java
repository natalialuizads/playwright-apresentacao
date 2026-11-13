package br.com.tatu.api.dominio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import br.com.tatu.api.modelo.PixPedido;
import br.com.tatu.api.modelo.PixResposta;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

/**
 * Base da pirâmide: regra de negócio testada sem Spring, sem HTTP e sem navegador.
 * Roda com "mvn test" (Surefire) em milissegundos.
 */
class PixServiceTest {

    private final PixService pix = new PixService(new BancoEmMemoria());

    @Test
    void enviaPixValido() {
        PixResposta resposta = pix.enviar(new PixPedido("mae@tatu.com.br", new BigDecimal("150.00")));

        assertEquals("ENVIADO", resposta.status());
        assertTrue(resposta.id().startsWith("PIX-"));
    }

    @Test
    void recusaValorMaiorQueOSaldo() {
        var erro = assertThrows(RegraDeNegocioException.class,
                () -> pix.enviar(new PixPedido("mae@tatu.com.br", new BigDecimal("99999"))));

        assertEquals("Saldo insuficiente", erro.getMessage());
    }

    @Test
    void recusaValorZero() {
        var erro = assertThrows(RegraDeNegocioException.class,
                () -> pix.enviar(new PixPedido("mae@tatu.com.br", BigDecimal.ZERO)));

        assertEquals("Valor inválido", erro.getMessage());
    }

    @Test
    void recusaChaveVazia() {
        var erro = assertThrows(RegraDeNegocioException.class,
                () -> pix.enviar(new PixPedido(" ", BigDecimal.TEN)));

        assertEquals("Informe a chave Pix", erro.getMessage());
    }
}
