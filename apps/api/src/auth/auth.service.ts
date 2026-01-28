import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProvider, Role } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { generateSecret, generateURI, verify } from 'otplib';
import { env } from '../env';

export type AuthToken = { access_token: string; user: any };

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueRefreshToken(userId: number) {
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });
    return token;
  }

  private async issueEmailVerificationToken(userId: number) {
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });
    return token;
  }

  private async issuePasswordResetToken(userId: number) {
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });
    return token;
  }

  private async issueMfaChallenge(userId: number) {
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.mfaChallenge.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });
    return token;
  }

  async signup(params: { email: string; password: string; name?: string; orgName: string; role?: Role }) {
    const email = params.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const org = await this.prisma.org.create({
      data: {
        name: params.orgName
      }
    });

    const passwordHash = await bcrypt.hash(params.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        name: params.name,
        passwordHash,
        authProvider: AuthProvider.PASSWORD,
        role: params.role || Role.OWNER,
        orgId: org.id,
        lastLoginAt: new Date()
      },
      select: { id: true, email: true, name: true, role: true, orgId: true }
    });

    const token = await this.signToken(user);
    const refreshToken = await this.issueRefreshToken(user.id);
    const verificationToken = await this.issueEmailVerificationToken(user.id);
    return { access_token: token, refresh_token: refreshToken, verification_token: verificationToken, user };
  }

  async login(params: { email: string; password: string }) {
    const email = params.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(params.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    if (user.mfaEnabled) {
      const mfaToken = await this.issueMfaChallenge(user.id);
      return {
        mfa_required: true,
        mfa_token: mfaToken,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, orgId: user.orgId }
      };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), authProvider: AuthProvider.PASSWORD }
    });

    const token = await this.signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId
    });
    const refreshToken = await this.issueRefreshToken(user.id);
    return {
      access_token: token,
      refresh_token: refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, orgId: user.orgId }
    };
  }

  async loginWithGoogle(profile: { email: string; name?: string | null; googleId: string; emailVerified?: boolean }) {
    const email = profile.email.trim().toLowerCase();
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      const org = await this.prisma.org.create({
        data: { name: this.inferOrgName(email) }
      });
      const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
      user = await this.prisma.user.create({
        data: {
          email,
          name: profile.name ?? null,
          passwordHash,
          authProvider: AuthProvider.GOOGLE,
          authProviderId: profile.googleId,
          role: Role.OWNER,
          orgId: org.id,
          emailVerifiedAt: profile.emailVerified ? new Date() : null,
          lastLoginAt: new Date()
        }
      });
    } else {
      const updateData: Record<string, any> = {
        authProvider: AuthProvider.GOOGLE,
        authProviderId: profile.googleId
      };
      if (!user.name && profile.name) {
        updateData.name = profile.name;
      }
      if (!user.emailVerifiedAt && profile.emailVerified) {
        updateData.emailVerifiedAt = new Date();
      }
      if (!user.mfaEnabled) {
        updateData.lastLoginAt = new Date();
      }
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: updateData
      });
    }

    if (user.mfaEnabled) {
      const mfaToken = await this.issueMfaChallenge(user.id);
      return {
        mfa_required: true,
        mfa_token: mfaToken,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, orgId: user.orgId }
      };
    }

    const accessToken = await this.signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId
    });
    const refreshToken = await this.issueRefreshToken(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, orgId: user.orgId }
    };
  }

  async acceptInvite(params: { token: string; password: string; name?: string }) {
    const invite = await this.prisma.invite.findFirst({
      where: {
        token: params.token,
        revokedAt: null,
        acceptedAt: null,
        expiresAt: { gt: new Date() }
      }
    });
    if (!invite) throw new NotFoundException('Invite not found or expired');

    const existing = await this.prisma.user.findUnique({ where: { email: invite.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(params.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: invite.email,
        name: params.name,
        passwordHash,
        authProvider: AuthProvider.PASSWORD,
        role: invite.role,
        orgId: invite.orgId,
        emailVerifiedAt: new Date(),
        lastLoginAt: new Date()
      },
      select: { id: true, email: true, name: true, role: true, orgId: true }
    });

    await this.prisma.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date(), acceptedBy: user.id }
    });

    const accessToken = await this.signToken(user);
    const refreshToken = await this.issueRefreshToken(user.id);
    return { access_token: accessToken, refresh_token: refreshToken, user };
  }

  async requestPasswordReset(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return { success: true };
    }
    const resetToken = await this.issuePasswordResetToken(user.id);
    return { success: true, reset_token: resetToken };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = this.hashToken(token);
    const record = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });
    if (!record) throw new ForbiddenException('Reset token is invalid or expired');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash }
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() }
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      }),
      this.prisma.mfaChallenge.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: new Date() }
      })
    ]);

    return { success: true };
  }

  async verifyEmail(token: string) {
    const tokenHash = this.hashToken(token);
    const record = await this.prisma.emailVerificationToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });
    if (!record) throw new ForbiddenException('Verification token is invalid or expired');

    const updated = await this.prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: record.user.emailVerifiedAt ?? new Date() },
      select: { id: true, email: true, name: true, role: true, orgId: true, emailVerifiedAt: true }
    });

    await this.prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() }
    });

    return { success: true, user: updated };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const record = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });
    if (!record) throw new UnauthorizedException('Refresh token is invalid');

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() }
    });

    const accessToken = await this.signToken({
      id: record.user.id,
      email: record.user.email,
      name: record.user.name,
      role: record.user.role,
      orgId: record.user.orgId
    });
    const newRefresh = await this.issueRefreshToken(record.user.id);

    return {
      access_token: accessToken,
      refresh_token: newRefresh,
      user: {
        id: record.user.id,
        email: record.user.email,
        name: record.user.name,
        role: record.user.role,
        orgId: record.user.orgId
      }
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null
      },
      data: { revokedAt: new Date() }
    });
    return { success: true };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        orgId: true,
        authProvider: true,
        emailVerifiedAt: true,
        mfaEnabled: true,
        lastLoginAt: true
      }
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setupMfa(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.mfaEnabled) throw new ConflictException('MFA already enabled');

    const secret = generateSecret();
    const otpauthUrl = generateURI({ issuer: env.mfaIssuer, label: user.email, secret });
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret }
    });

    return { secret, otpauth_url: otpauthUrl };
  }

  async confirmMfa(userId: number, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.mfaSecret) throw new BadRequestException('MFA setup not started');

    const ok = await this.verifyMfaCode(user.mfaSecret, code);
    if (!ok) throw new ForbiddenException('Invalid MFA code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true }
    });

    return { success: true };
  }

  async disableMfa(userId: number, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.mfaEnabled || !user.mfaSecret) return { success: true };

    const ok = await this.verifyMfaCode(user.mfaSecret, code);
    if (!ok) throw new ForbiddenException('Invalid MFA code');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: false, mfaSecret: null }
      }),
      this.prisma.mfaChallenge.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: new Date() }
      })
    ]);

    return { success: true };
  }

  async verifyMfa(token: string, code: string) {
    const tokenHash = this.hashToken(token);
    const challenge = await this.prisma.mfaChallenge.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });
    if (!challenge) throw new UnauthorizedException('MFA challenge is invalid or expired');
    if (!challenge.user.mfaEnabled || !challenge.user.mfaSecret) {
      throw new UnauthorizedException('MFA not enabled for this user');
    }

    const ok = await this.verifyMfaCode(challenge.user.mfaSecret, code);
    if (!ok) throw new UnauthorizedException('Invalid MFA code');

    await this.prisma.$transaction([
      this.prisma.mfaChallenge.update({
        where: { id: challenge.id },
        data: { usedAt: new Date() }
      }),
      this.prisma.user.update({
        where: { id: challenge.userId },
        data: { lastLoginAt: new Date() }
      })
    ]);

    const accessToken = await this.signToken({
      id: challenge.user.id,
      email: challenge.user.email,
      name: challenge.user.name,
      role: challenge.user.role,
      orgId: challenge.user.orgId
    });
    const refreshToken = await this.issueRefreshToken(challenge.user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: challenge.user.id,
        email: challenge.user.email,
        name: challenge.user.name,
        role: challenge.user.role,
        orgId: challenge.user.orgId
      }
    };
  }

  private async verifyMfaCode(secret: string, code: string) {
    const result = await verify({ secret, token: code, epochTolerance: 30 });
    return result.valid;
  }

  private inferOrgName(email: string) {
    const domain = email.split('@')[1] || '';
    if (!domain) return 'Google Org';
    return `${domain} Org`;
  }

  private async signToken(user: { id: number; email: string; role: Role; orgId: number; name?: string | null }) {
    return this.jwtService.signAsync({
      sub: user.id,
      orgId: user.orgId,
      role: user.role,
      email: user.email,
      name: user.name
    });
  }
}
