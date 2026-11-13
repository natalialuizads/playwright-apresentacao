package br.com.tatu.api.mock;

import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.getRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.okJson;
import static com.github.tomakehurst.wiremock.client.WireMock.serverError;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.wireMockConfig;
import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.WireMockServer;
import com.microsoft.playwright.APIRequest;
import com.microsoft.playwright.APIRequestContext;
import com.microsoft.playwright.APIResponse;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.options.RequestOptions;
import java.util.Map;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/**
 * Mock no BACKEND: o serviço de terceiro (cotação) vira um WireMock.
 *
 *   Playwright  ->  nossa API (Spring Boot real)  ->  WireMock no lugar do terceiro
 *
 * É a mesma ideia do page.route no front: controlar a borda para testar
 * sucesso, erro, lentidão e resposta estranha, sem depender da internet.
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class CotacaoWireMockIT {

    private static final String CAMINHO = "/json/last/USD-BRL";

    private static final WireMockServer servicoExterno = new WireMockServer(wireMockConfig().dynamicPort());

    static {
        servicoExterno.start();
    }

    @DynamicPropertySource
    static void apontarParaOWireMock(DynamicPropertyRegistry registro) {
        registro.add("cotacao.url", servicoExterno::baseUrl);
        registro.add("cotacao.timeout", () -> "1s");
    }

    private static Playwright playwright;
    private final ObjectMapper json = new ObjectMapper();

    @LocalServerPort
    private int porta;

    private APIRequestContext api;

    @BeforeAll
    static void abrirPlaywright() {
        playwright = Playwright.create();
    }

    @AfterAll
    static void fecharTudo() {
        playwright.close();
        servicoExterno.stop();
    }

    @BeforeEach
    void preparar() {
        servicoExterno.resetAll();
        api = playwright.request().newContext(new APIRequest.NewContextOptions()
                .setBaseURL("http://localhost:" + porta));
    }

    @AfterEach
    void descartar() {
        api.dispose();
    }

    private RequestOptions comToken() throws Exception {
        APIResponse login = api.post("/api/login", RequestOptions.create()
                .setData(Map.of("cpf", "12345678909", "senha", "segredo123")));
        String token = json.readTree(login.text()).get("token").asText();
        return RequestOptions.create().setHeader("Authorization", "Bearer " + token);
    }

    @Test
    void repassaACotacaoDoServicoExterno() throws Exception {
        servicoExterno.stubFor(get(urlEqualTo(CAMINHO))
                .willReturn(okJson("{\"USDBRL\": {\"bid\": \"5.1234\"}}")));

        APIResponse resposta = api.get("/api/cotacao", comToken());

        assertThat(resposta).isOK();
        JsonNode corpo = json.readTree(resposta.text());
        assertEquals("USD", corpo.get("moeda").asText());
        assertEquals(5.12, corpo.get("valor").asDouble(), 0.0001);
        servicoExterno.verify(1, getRequestedFor(urlEqualTo(CAMINHO)));
    }

    @Test
    void servicoExternoComErro500Vira503() throws Exception {
        servicoExterno.stubFor(get(urlEqualTo(CAMINHO)).willReturn(serverError()));

        APIResponse resposta = api.get("/api/cotacao", comToken());

        assertEquals(503, resposta.status());
        assertEquals("Cotação indisponível", json.readTree(resposta.text()).get("mensagem").asText());
    }

    @Test
    void servicoExternoLentoEstouraOTimeoutEVira503() throws Exception {
        servicoExterno.stubFor(get(urlEqualTo(CAMINHO))
                .willReturn(okJson("{\"USDBRL\": {\"bid\": \"5.10\"}}").withFixedDelay(3_000)));

        APIResponse resposta = api.get("/api/cotacao", comToken());

        assertEquals(503, resposta.status());
    }

    @Test
    void respostaSemOCampoEsperadoVira503() throws Exception {
        servicoExterno.stubFor(get(urlEqualTo(CAMINHO)).willReturn(okJson("{}")));

        APIResponse resposta = api.get("/api/cotacao", comToken());

        assertEquals(503, resposta.status());
    }
}
