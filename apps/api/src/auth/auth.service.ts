import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

export type AuthToken = { access_token: string; user: any };

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}

  async signup(params: { email: string; password: string; name?: string; orgName: string; role?: Role }) {
    const existing = await this.prisma.user.findUnique({ where: { email: params.email } });
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
        email: params.email,
        name: params.name,
        passwordHash,
        role: params.role || Role.OWNER,
        orgId: org.id
      },
      select: { id: true, email: true, name: true, role: true, orgId: true }
    });

    const token = await this.signToken(user);
    return { access_token: token, user };
  }

  async login(params: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: params.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(params.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const token = await this.signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId
    });
    return { access_token: token, user: { id: user.id, email: user.email, name: user.name, role: user.role, orgId: user.orgId } };
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
