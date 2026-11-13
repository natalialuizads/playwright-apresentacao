package br.com.tatu.api.web;

import br.com.tatu.api.dominio.BancoEmMemoria;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/** Autenticação de brinquedo: aceita só o token fixo da cliente Ana. */
@Component
public class Autenticacao {

    public void exigir(String authorization) {
        if (!("Bearer " + BancoEmMemoria.TOKEN).equals(authorization)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida");
        }
    }
}
