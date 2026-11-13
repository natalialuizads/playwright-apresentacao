package br.com.tatu.api.cotacao;

/** O serviço de cotação falhou, demorou demais ou respondeu algo inesperado: vira HTTP 503. */
public class CotacaoIndisponivelException extends RuntimeException {

    public CotacaoIndisponivelException(String detalhe) {
        super(detalhe);
    }
}
