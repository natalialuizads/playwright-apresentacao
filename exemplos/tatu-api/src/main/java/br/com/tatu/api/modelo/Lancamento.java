package br.com.tatu.api.modelo;

import java.math.BigDecimal;
import java.time.LocalDate;

public record Lancamento(LocalDate data, String descricao, BigDecimal valor) {
}
