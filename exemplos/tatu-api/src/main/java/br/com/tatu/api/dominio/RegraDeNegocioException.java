package br.com.tatu.api.dominio;

/** Erro de regra de negócio: vira HTTP 422 com {"mensagem": "..."}. */
public class RegraDeNegocioException extends RuntimeException {

    public RegraDeNegocioException(String mensagem) {
        super(mensagem);
    }
}
