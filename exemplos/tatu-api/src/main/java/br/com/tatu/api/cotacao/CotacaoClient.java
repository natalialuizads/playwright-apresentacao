package br.com.tatu.api.cotacao;

import br.com.tatu.api.modelo.Cotacao;
import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Cliente de um serviço de TERCEIRO (cotação do dólar).
 * Nos testes, esse serviço é trocado por um WireMock (CotacaoWireMockIT):
 * é o equivalente, no backend, ao page.route do front.
 */
@Component
public class CotacaoClient {

    private final RestClient http;

    public CotacaoClient(@Value("${cotacao.url}") String url,
                         @Value("${cotacao.timeout:2s}") Duration timeout) {
        var fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(timeout);
        fabrica.setReadTimeout(timeout);
        this.http = RestClient.builder().baseUrl(url).requestFactory(fabrica).build();
    }

    public Cotacao dolar() {
        try {
            JsonNode corpo = http.get().uri("/json/last/USD-BRL").retrieve().body(JsonNode.class);
            String bid = corpo == null ? null : corpo.path("USDBRL").path("bid").asText(null);
            if (bid == null) {
                throw new CotacaoIndisponivelException("Resposta sem cotação");
            }
            return new Cotacao("USD", new BigDecimal(bid).setScale(2, RoundingMode.HALF_UP));
        } catch (RestClientException | NumberFormatException e) {
            throw new CotacaoIndisponivelException(e.getMessage());
        }
    }
}
