import { Body, Controller, Post, UseGuards, Request, Get, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Role } from '@prisma/client';
import { IsEmail, IsOptional, IsString, IsEnum, MinLength, Length } from 'class-validator';
import { JwtAuthGuard } from '../shared/jwt-auth.guard';
import { GoogleAuthGuard } from './google.guard';
import { Response } from 'express';
import { env } from '../env';

class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  orgName!: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class AcceptInviteDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;
}

class RequestPasswordResetDto {
  @IsEmail()
  email!: string;
}

class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class VerifyEmailDto {
  @IsString()
  token!: string;
}

class RefreshDto {
  @IsString()
  refreshToken!: string;
}

class LogoutDto {
  @IsString()
  refreshToken!: string;
}

class MfaVerifyDto {
  @IsString()
  token!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}

class MfaConfirmDto {
  @IsString()
  @Length(6, 6)
  code!: string;
}

class MfaDisableDto {
  @IsString()
  @Length(6, 6)
  code!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() body: SignupDto) {
    return this.authService.signup(body);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleAuth() {
    return { success: true };
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Request() req: any, @Res() res: Response) {
    const result = await this.authService.loginWithGoogle(req.user);
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: !env.isDev,
      path: '/'
    };

    if ('mfa_required' in result && result.mfa_required) {
      res.cookie('mfa_token', result.mfa_token, { ...cookieOptions, maxAge: 10 * 60 * 1000 });
      return res.redirect(`${env.webUrl}/auth/mfa`);
    }

    res.cookie('token', result.access_token, cookieOptions);
    res.cookie('refresh_token', result.refresh_token, cookieOptions);
    return res.redirect(`${env.webUrl}/projects`);
  }

  @Post('accept-invite')
  acceptInvite(@Body() body: AcceptInviteDto) {
    return this.authService.acceptInvite(body);
  }

  @Post('request-password-reset')
  requestPasswordReset(@Body() body: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Post('verify-email')
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('refresh')
  refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  logout(@Body() body: LogoutDto) {
    return this.authService.logout(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/setup')
  setupMfa(@Request() req: any) {
    return this.authService.setupMfa(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/confirm')
  confirmMfa(@Request() req: any, @Body() body: MfaConfirmDto) {
    return this.authService.confirmMfa(req.user.userId, body.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/disable')
  disableMfa(@Request() req: any, @Body() body: MfaDisableDto) {
    return this.authService.disableMfa(req.user.userId, body.code);
  }

  @Post('mfa/verify')
  verifyMfa(@Body() body: MfaVerifyDto) {
    return this.authService.verifyMfa(body.token, body.code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    return this.authService.getProfile(req.user.userId);
  }
}
