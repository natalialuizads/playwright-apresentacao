package br.com.tatu.api.ui;

import com.microsoft.playwright.junit.Options;
import com.microsoft.playwright.junit.OptionsFactory;
import java.nio.file.Paths;

/**
 * Configuração dos testes de tela: o equivalente Java do playwright.config.ts.
 *
 * mvn verify                      navegador do Playwright, sem janela
 * mvn verify -Dheaded=true        com janela
 * mvn verify -Dcanal=chrome       Google Chrome instalado na máquina (ou msedge)
 *
 * Para não baixar os navegadores do Playwright quando usar o canal:
 * PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 mvn verify -Dcanal=chrome
 *
 * Quando um teste falha, o trace fica em target/playwright/<classe.teste>/trace.zip.
 */
public class TatuOptions implements OptionsFactory {

    @Override
    public Options getOptions() {
        boolean comJanela = Boolean.parseBoolean(System.getProperty("headed", "false"));
        String canal = System.getProperty("canal", "").trim();

        Options options = new Options()
                .setHeadless(!comJanela)
                .setTrace(Options.Trace.RETAIN_ON_FAILURE)
                .setOutputDir(Paths.get("target", "playwright"));

        if (!canal.isEmpty()) {
            options.setChannel(canal);
        }
        return options;
    }
}
