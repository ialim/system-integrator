import { ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { env } from '../env';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  override canActivate(context: ExecutionContext) {
    if (!env.googleClientId || !env.googleClientSecret) {
      throw new NotFoundException('Google SSO is not configured');
    }
    return super.canActivate(context);
  }

  override getAuthenticateOptions() {
    return {
      scope: ['email', 'profile'],
      prompt: 'select_account'
    };
  }
}
