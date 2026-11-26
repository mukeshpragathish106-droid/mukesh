import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const expectedRoles = route.data?.['roles'] as string[];
  if (expectedRoles && expectedRoles.length > 0) {
    const currentRole = authService.role();
    if (!currentRole || !expectedRoles.includes(currentRole)) {
      authService.redirectByRole();
      return false;
    }
  }

  return true;
};
