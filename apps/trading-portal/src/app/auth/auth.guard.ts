import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LocalUatAuthService } from './local-uat-auth.service';

export const localUatAuthGuard: CanActivateFn = (_route, state) => {
  const auth = inject(LocalUatAuthService);
  const router = inject(Router);
  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
