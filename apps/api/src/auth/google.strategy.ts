import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { env } from '../env';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: env.googleClientId || 'disabled',
      clientSecret: env.googleClientSecret || 'disabled',
      callbackURL: env.googleCallbackUrl
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (!email) throw new UnauthorizedException('Google account missing email');

    const json = (profile as any)._json || {};
    const verified = json.email_verified ?? json.verified_email;
    if (verified === false) throw new UnauthorizedException('Google email not verified');

    return {
      email,
      name: profile.displayName,
      googleId: profile.id,
      emailVerified: verified !== false
    };
  }
}
