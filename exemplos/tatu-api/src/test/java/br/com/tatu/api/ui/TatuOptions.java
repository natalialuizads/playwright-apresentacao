package br.com.tatu.api.ui;

import com.microsoft.playwright.junit.Options;
import com.microsoft.playwright.junit.OptionsFactory;

/**
 * Configuração dos testes de tela.
 * Por padrão o navegador roda escondido (headless).
 * Para ver o navegador: mvn verify -Dheaded=true
 */
public class TatuOptions implements OptionsFactory {

    @Override
    public Options getOptions() {
        boolean comJanela = Boolean.parseBoolean(System.getProperty("headed", "false"));
        return new Options().setHeadless(!comJanela);
    }
}
