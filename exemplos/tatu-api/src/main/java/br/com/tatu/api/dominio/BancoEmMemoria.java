package br.com.tatu.api.dominio;

import br.com.tatu.api.modelo.Conta;
import br.com.tatu.api.modelo.Lancamento;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

/** "Banco de dados" em memória: uma cliente só, dados fixos. Suficiente para os exemplos. */
@Component
public class BancoEmMemoria {

    public static final String CPF = "12345678909";
    public static final String SENHA = "segredo123";
    public static final String TOKEN = "token-ana";

    private final Conta conta = new Conta("Ana", new BigDecimal("1520.75"));

    private final List<Lancamento> extrato = List.of(
            new Lancamento(LocalDate.of(2026, 11, 10), "Salário", new BigDecimal("4200.00")),
            new Lancamento(LocalDate.of(2026, 11, 9), "Mercado do bairro", new BigDecimal("-312.40")),
            new Lancamento(LocalDate.of(2026, 11, 8), "Pix recebido de João", new BigDecimal("80.00")));

    private final AtomicInteger contadorPix = new AtomicInteger();

    public Conta conta() {
        return conta;
    }

    public List<Lancamento> extrato() {
        return extrato;
    }

    public String proximoIdPix() {
        return "PIX-%04d".formatted(contadorPix.incrementAndGet());
    }
}
