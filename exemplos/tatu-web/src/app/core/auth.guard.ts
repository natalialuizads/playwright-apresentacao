import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Sem token, volta para o login. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.token ? true : inject(Router).parseUrl('/login');
};
