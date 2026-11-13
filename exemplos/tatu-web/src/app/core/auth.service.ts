import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';
import { Sessao } from './modelos';

const CHAVE_TOKEN = 'tatu.token';
const CHAVE_NOME = 'tatu.nome';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  entrar(cpf: string, senha: string) {
    return this.http.post<Sessao>('/api/login', { cpf, senha }).pipe(
      tap((sessao) => {
        localStorage.setItem(CHAVE_TOKEN, sessao.token);
        localStorage.setItem(CHAVE_NOME, sessao.nome);
      }),
    );
  }

  get token(): string | null {
    return localStorage.getItem(CHAVE_TOKEN);
  }

  sair(): void {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_NOME);
  }
}
