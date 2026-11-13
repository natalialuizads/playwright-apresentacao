package br.com.tatu.api.api;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

/**
 * Testes de API com Playwright, SEM navegador.
 *
 * O Spring Boot sobe a aplicação real numa porta aleatória e o Playwright
 * conversa com ela por HTTP. Aqui o ciclo de vida é manual (create/close),
 * que é o jeito mais explícito de ver cada peça.
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT,
        properties = "cotacao.url=http://localhost:1") // serviço externo "fora do ar"
class ContasApiIT {

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
    static void fecharPlaywright() {
        playwright.close();
    }

    @BeforeEach
    void criarContexto() {
        api = playwright.request().newContext(new APIRequest.NewContextOptions()
                .setBaseURL("http://localhost:" + porta));
    }

    @AfterEach
    void descartarContexto() {
        api.dispose();
    }

    private RequestOptions comToken() throws Exception {
        APIResponse login = api.post("/api/login", RequestOptions.create()
                .setData(Map.of("cpf", "123.456.789-09", "senha", "segredo123")));
        String token = json.readTree(login.text()).get("token").asText();
        return RequestOptions.create().setHeader("Authorization", "Bearer " + token);
    }

    @Test
    void loginValidoDevolveTokenENome() throws Exception {
        APIResponse resposta = api.post("/api/login", RequestOptions.create()
                .setData(Map.of("cpf", "123.456.789-09", "senha", "segredo123")));

        assertThat(resposta).isOK();
        JsonNode corpo = json.readTree(resposta.text());
        assertEquals("Ana", corpo.get("nome").asText());
        assertTrue(corpo.hasNonNull("token"));
    }

    @Test
    void loginInvalidoDevolve401() {
        APIResponse resposta = api.post("/api/login", RequestOptions.create()
                .setData(Map.of("cpf", "123.456.789-09", "senha", "errada")));

        assertEquals(401, resposta.status());
    }

    @Test
    void contaSemTokenDevolve401() {
        assertEquals(401, api.get("/api/conta").status());
    }

    @Test
    void extratoTemTresLancamentos() throws Exception {
        APIResponse resposta = api.get("/api/extrato", comToken());

        assertThat(resposta).isOK();
        JsonNode lista = json.readTree(resposta.text());
        assertEquals(3, lista.size());
        assertEquals("Salário", lista.get(0).get("descricao").asText());
        assertEquals("2026-11-10", lista.get(0).get("data").asText());
    }

    @Test
    void pixValidoDevolve201() throws Exception {
        APIResponse resposta = api.post("/api/pix", comToken()
                .setData(Map.of("chave", "mae@tatu.com.br", "valor", 150)));

        assertEquals(201, resposta.status());
        assertTrue(json.readTree(resposta.text()).get("id").asText().startsWith("PIX-"));
    }

    @Test
    void pixAcimaDoSaldoDevolve422ComMensagem() throws Exception {
        APIResponse resposta = api.post("/api/pix", comToken()
                .setData(Map.of("chave", "mae@tatu.com.br", "valor", 999999)));

        assertEquals(422, resposta.status());
        assertEquals("Saldo insuficiente", json.readTree(resposta.text()).get("mensagem").asText());
    }

    @Test
    void cotacaoComServicoExternoForaDoArDevolve503() throws Exception {
        APIResponse resposta = api.get("/api/cotacao", comToken());

        assertEquals(503, resposta.status());
    }
}
