package br.com.tatu.api.ui;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Request;
import com.microsoft.playwright.Route;
import com.microsoft.playwright.junit.UsePlaywright;
import com.microsoft.playwright.options.AriaRole;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;

/**
 * Testes de TELA em Java, contra a página estática servida pelo próprio Spring Boot
 * (src/main/resources/static/index.html).
 *
 * @UsePlaywright injeta um Page novo (num BrowserContext novo) em cada teste.
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT,
        properties = "cotacao.url=http://localhost:1") // serviço externo "fora do ar"
@UsePlaywright(TatuOptions.class)
class LoginUiIT {

    @LocalServerPort
    private int porta;

    private void entrar(Page page, String senha) {
        page.navigate("http://localhost:" + porta + "/");
        page.getByLabel("CPF").fill("123.456.789-09");
        page.getByLabel("Senha").fill(senha);
        page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Entrar")).click();
    }

    @Test
    void clienteEntraEVeOSaldo(Page page) {
        entrar(page, "segredo123");

        assertThat(page.getByRole(AriaRole.HEADING, new Page.GetByRoleOptions().setName("Olá, Ana")))
                .isVisible();
        // O saldo mora dentro do Shadow DOM de <tatu-saldo>: o locator atravessa sozinho.
        assertThat(page.getByTestId("saldo")).containsText("1.520,75");
    }

    @Test
    void senhaErradaMostraMensagem(Page page) {
        entrar(page, "senha-errada");

        assertThat(page.getByRole(AriaRole.ALERT)).hasText("CPF ou senha inválidos.");
    }

    @Test
    void mockDoLoginComPageRoute(Page page) {
        // Mesmo page.route do TypeScript: a chamada nem chega ao Spring.
        page.route("**/api/login", route -> route.fulfill(new Route.FulfillOptions().setStatus(503)));

        entrar(page, "segredo123");

        assertThat(page.getByRole(AriaRole.ALERT)).hasText("Serviço indisponível. Tente mais tarde.");
    }

    @Test
    void mockDaCotacaoComPageRoute(Page page) {
        page.route("**/api/cotacao", route -> route.fulfill(new Route.FulfillOptions()
                .setStatus(200)
                .setContentType("application/json")
                .setBody("{\"moeda\": \"USD\", \"valor\": 4.99}")));

        entrar(page, "segredo123");

        assertThat(page.getByText("Dólar hoje")).containsText("4,99");
    }

    @Test
    void semMockACotacaoApareceIndisponivel(Page page) {
        entrar(page, "segredo123");

        assertThat(page.getByText("Cotação indisponível no momento.")).isVisible();
    }

    @Test
    void confereOCorpoEnviadoNoLogin(Page page) throws Exception {
        Request pedido = page.waitForRequest("**/api/login", () -> entrar(page, "segredo123"));

        JsonNode corpo = new ObjectMapper().readTree(pedido.postData());
        assertEquals("123.456.789-09", corpo.get("cpf").asText());
        assertTrue(corpo.has("senha"));
    }

    @Test
    void xpathNaoAtravessaShadowDom(Page page) {
        entrar(page, "segredo123");

        assertThat(page.getByTestId("saldo")).isVisible();              // atravessa
        assertThat(page.locator("tatu-saldo .valor")).isVisible();      // CSS também
        assertThat(page.locator("xpath=//p[@data-testid='saldo']")).hasCount(0); // XPath não
    }
}
