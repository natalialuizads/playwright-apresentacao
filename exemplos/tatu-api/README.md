# tatu-api: Spring Boot + Playwright Java

BFF do Banco Tatu em Spring Boot, com testes Playwright em Java: API sem navegador, telas com `page.route` e WireMock no lugar de um serviço de terceiro.

## Requisitos

- Java 21
- Maven 3.9 ou mais novo
- Acesso ao Maven Central (ou ao mirror da empresa) e, na primeira execução dos testes, ao download dos navegadores do Playwright

## Rodar os testes

```bash
mvn test       # só os unitários (Surefire, classes *Test)
mvn verify     # unitários + integração e tela (Failsafe, classes *IT)
```

Na primeira execução, o Playwright para Java baixa o Chromium sozinho.

As opções dos testes de tela (janela, canal do navegador, trace) ficam em `src/test/java/.../ui/TatuOptions.java`, o equivalente Java do `playwright.config.ts`.

### Relatórios e trace

- O Failsafe grava o resultado em `target/failsafe-reports/*.xml` (formato JUnit, que Jenkins, GitLab e Azure DevOps leem).
- Quando um teste de tela falha, o trace fica em `target/playwright/<classe.teste>/trace.zip`. Abra com `npx playwright show-trace <arquivo>` ou arrastando o arquivo para https://trace.playwright.dev.

### Outras formas de rodar

| Comando | Para quê |
|---|---|
| `mvn verify -Dheaded=true` | Abre a janela do navegador nos testes de tela |
| `mvn verify -Dcanal=chrome` | Usa o Google Chrome instalado na máquina (`msedge` para o Edge) |
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 mvn verify -Dcanal=chrome` | Idem, sem baixar os navegadores do Playwright |
| `mvn verify -Dit.test=LoginUiIT` | Só uma classe de integração |
| `mvn verify -Dit.test=LoginUiIT#xpathNaoAtravessaShadowDom` | Só um teste |
| `mvn test -Dtest=PixServiceTest` | Só uma classe unitária |
| `TATU_BASE_URL=http://localhost:8080 mvn verify -Dit.test=ContratoAmbienteIT` | Contrato contra um ambiente já no ar |

### Ferramentas do Playwright pelo Maven

A dependência do Playwright está com escopo `test`, então use `-D exec.classpathScope=test`:

```bash
# instalar navegador e bibliotecas do sistema (útil no CI)
mvn exec:java -e -D exec.classpathScope=test \
  -D exec.mainClass=com.microsoft.playwright.CLI \
  -D exec.args="install --with-deps chromium"

# gravar cliques e gerar código Java (com a aplicação no ar)
mvn exec:java -e -D exec.classpathScope=test \
  -D exec.mainClass=com.microsoft.playwright.CLI \
  -D exec.args="codegen --target java http://localhost:8080"
```

## Docker

```bash
docker build -f Dockerfile.e2e -t tatu-api-e2e .
docker run --rm --init --ipc=host -v "$PWD/target:/app/target" tatu-api-e2e
```

A imagem `mcr.microsoft.com/playwright/java` traz JDK, Maven e os navegadores. A tag dela precisa ser a mesma versão do `playwright.version` do `pom.xml`.

## Variáveis de ambiente

- `TATU_BASE_URL`: o `ContratoAmbienteIT` roda contra um ambiente já no ar.
- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`: não baixa navegador (use com `-Dcanal=chrome` ou dentro da imagem oficial).
- No código: `System.getenv("TATU_BASE_URL")`. Para opções do Maven, `-Dpropriedade=valor` chega via `System.getProperty`, como o `-Dheaded` e o `-Dcanal`.

## Rodar a aplicação

```bash
mvn spring-boot:run
```

- http://localhost:8080 abre uma página mínima de login (CPF `123.456.789-09`, senha `segredo123`).
- A API fica em `/api/*`, com o mesmo contrato do mock em Node do `tatu-web`.
- A cotação do dólar vem de um serviço público externo (`cotacao.url` no `application.properties`). Sem internet, a tela mostra "Cotação indisponível no momento.".

## Mapa dos testes

| Classe | Tipo | O que ensina |
|---|---|---|
| `dominio/PixServiceTest` | Unitário | Regra de negócio sem Spring, sem HTTP, sem navegador |
| `api/ContasApiIT` | API | Spring Boot em porta aleatória + `APIRequestContext`, com ciclo de vida manual |
| `api/ContratoAmbienteIT` | API | `@UsePlaywright` + `OptionsFactory` contra um ambiente já no ar |
| `ui/LoginUiIT` | Tela | `@UsePlaywright` com `Page`; `page.route` em Java; `waitForRequest`; Shadow DOM e XPath |
| `mock/CotacaoWireMockIT` | Integração | WireMock no lugar do serviço de cotação: sucesso, erro 500, lentidão e resposta inesperada |

## Estrutura

```
src/main/java/br/com/tatu/api/
  web/ApiController.java          endpoints /api/*
  web/TratamentoDeErros.java      422, 503 e 401 em JSON
  dominio/PixService.java         regras do Pix
  cotacao/CotacaoClient.java      cliente do serviço de terceiro (com timeout)
src/main/resources/
  application.properties          porta, URL e timeout da cotação
  static/index.html               página mínima, com Web Component <tatu-saldo> em Shadow DOM
src/test/java/br/com/tatu/api/
  dominio/  api/  ui/  mock/      os testes, por tipo
```

## Versões

| Biblioteca | Versão |
|---|---|
| Spring Boot | 3.5.15 |
| Playwright Java | 1.59.0 |
| WireMock | 3.13.1 |

As versões ficam em `pom.xml`. Num projeto real, use as mais recentes do Maven Central e a linha atual do Spring Boot.

## Em rede corporativa

- **Maven atrás de proxy ou com Nexus/Artifactory:** configure em `~/.m2/settings.xml`.
- **Download do navegador bloqueado:** use o Chrome instalado com `setChannel("chrome")` no `TatuOptions` (`new Options().setChannel("chrome")`), ou aponte `PLAYWRIGHT_DOWNLOAD_HOST` para o mirror interno.

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Testes `*IT` não rodam com `mvn test` | É esperado: eles rodam com `mvn verify` |
| `Executable doesn't exist` | Download do navegador bloqueado; veja "Em rede corporativa" |
| Teste de lentidão do WireMock demorando | Normal: ele espera o timeout de 1 segundo estourar |
| `ContratoAmbienteIT` sempre ignorado | Falta a variável `TATU_BASE_URL` |
