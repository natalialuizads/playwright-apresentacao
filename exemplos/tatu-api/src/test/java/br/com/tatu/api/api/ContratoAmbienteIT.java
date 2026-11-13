package br.com.tatu.api.api;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

import com.microsoft.playwright.APIRequest;
import com.microsoft.playwright.APIRequestContext;
import com.microsoft.playwright.APIResponse;
import com.microsoft.playwright.junit.Options;
import com.microsoft.playwright.junit.OptionsFactory;
import com.microsoft.playwright.junit.UsePlaywright;
import com.microsoft.playwright.options.RequestOptions;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

/**
 * Teste de contrato contra um ambiente JÁ NO AR (local, dev, homologação).
 * Não sobe Spring: só aponta para TATU_BASE_URL.
 *
 *   TATU_BASE_URL=http://localhost:8080 mvn verify -Dit.test=ContratoAmbienteIT
 *
 * Sem a variável, a classe é ignorada.
 *
 * Mostra o jeito "@UsePlaywright + OptionsFactory": o APIRequestContext
 * chega pronto como parâmetro do teste, como o page no TypeScript.
 */
@EnabledIfEnvironmentVariable(named = "TATU_BASE_URL", matches = ".+")
@UsePlaywright(ContratoAmbienteIT.Ambiente.class)
class ContratoAmbienteIT {

    public static class Ambiente implements OptionsFactory {
        @Override
        public Options getOptions() {
            return new Options().setApiRequestOptions(new APIRequest.NewContextOptions()
                    .setBaseURL(System.getenv("TATU_BASE_URL")));
        }
    }

    @Test
    void healthEstaNoAr(APIRequestContext request) {
        assertThat(request.get("/api/health")).isOK();
    }

    @Test
    void loginRespondeNoContratoCombinado(APIRequestContext request) {
        APIResponse resposta = request.post("/api/login", RequestOptions.create()
                .setData(Map.of("cpf", "123.456.789-09", "senha", "segredo123")));

        assertThat(resposta).isOK();
        assertEquals("application/json", resposta.headers().get("content-type").split(";")[0]);
    }
}
