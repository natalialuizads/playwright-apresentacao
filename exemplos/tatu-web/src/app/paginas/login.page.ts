import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'tatu-login',
  imports: [FormsModule],
  template: `
    <main class="pagina estreita">
      <h1>Banco Tatu</h1>
      <p class="sub">Entre para ver sua conta.</p>
      <form class="formulario" (ngSubmit)="entrar()">
        <label for="cpf">CPF</label>
        <input id="cpf" name="cpf" autocomplete="username" [(ngModel)]="cpf" />

        <label for="senha">Senha</label>
        <input id="senha" name="senha" type="password" autocomplete="current-password" [(ngModel)]="senha" />

        <button type="submit" [disabled]="carregando()">Entrar</button>
      </form>
      @if (erro()) {
        <p class="erro" role="alert">{{ erro() }}</p>
      }
    </main>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly cpf = signal('');
  readonly senha = signal('');
  readonly carregando = signal(false);
  readonly erro = signal('');

  entrar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.auth.entrar(this.cpf(), this.senha()).subscribe({
      next: () => this.router.navigateByUrl('/inicio'),
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erro.set(
          e.status === 401 ? 'CPF ou senha inválidos.' : 'Serviço indisponível. Tente mais tarde.',
        );
      },
    });
  }
}
