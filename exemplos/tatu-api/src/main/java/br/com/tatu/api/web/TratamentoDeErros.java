package br.com.tatu.api.web;

import br.com.tatu.api.cotacao.CotacaoIndisponivelException;
import br.com.tatu.api.dominio.RegraDeNegocioException;
import br.com.tatu.api.modelo.Erro;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class TratamentoDeErros {

    @ExceptionHandler(RegraDeNegocioException.class)
    public ResponseEntity<Erro> regraDeNegocio(RegraDeNegocioException e) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(new Erro(e.getMessage()));
    }

    @ExceptionHandler(CotacaoIndisponivelException.class)
    public ResponseEntity<Erro> cotacaoIndisponivel(CotacaoIndisponivelException e) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new Erro("Cotação indisponível"));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Erro> status(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(new Erro(e.getReason()));
    }
}
