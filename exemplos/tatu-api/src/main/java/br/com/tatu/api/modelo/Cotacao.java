package br.com.tatu.api.modelo;

import java.math.BigDecimal;

public record Cotacao(String moeda, BigDecimal valor) {
}
