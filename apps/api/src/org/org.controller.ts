import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { OrgService } from './org.service';
import { JwtAuthGuard } from '../shared/jwt-auth.guard';
import { RolesGuard } from '../shared/roles.guard';
import { Roles } from '../shared/roles.decorator';
import { Role } from '@prisma/client';
import { CreateInviteDto, UpdateOrgProfileDto, UpdateUserRoleDto } from './dto';

type AuthReq = { user: { userId: number; orgId: number; role: Role } };

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('org')
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Get('profile')
  getProfile(@Request() req: AuthReq) {
    return this.orgService.getProfile(req.user.orgId);
  }

  @Roles(Role.OWNER)
  @Patch('profile')
  updateProfile(@Request() req: AuthReq, @Body() body: UpdateOrgProfileDto) {
    return this.orgService.updateProfile(req.user.orgId, body);
  }

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Get('users')
  listUsers(@Request() req: AuthReq) {
    return this.orgService.listUsers(req.user.orgId);
  }

  @Roles(Role.OWNER)
  @Patch('users/:id/role')
  updateUserRole(@Request() req: AuthReq, @Param('id') id: string, @Body() body: UpdateUserRoleDto) {
    return this.orgService.updateUserRole(req.user.orgId, Number(id), body);
  }

  @Roles(Role.OWNER)
  @Get('invites')
  listInvites(@Request() req: AuthReq) {
    return this.orgService.listInvites(req.user.orgId);
  }

  @Roles(Role.OWNER)
  @Post('invites')
  createInvite(@Request() req: AuthReq, @Body() body: CreateInviteDto) {
    return this.orgService.createInvite(req.user.orgId, req.user.userId, body);
  }

  @Roles(Role.OWNER)
  @Post('invites/:id/revoke')
  revokeInvite(@Request() req: AuthReq, @Param('id') id: string) {
    return this.orgService.revokeInvite(req.user.orgId, Number(id));
  }
}
