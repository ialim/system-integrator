import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../shared/jwt-auth.guard';
import { RolesGuard } from '../shared/roles.guard';
import { Roles } from '../shared/roles.decorator';
import { Role } from '@prisma/client';
import { CreateClientDto, UpdateClientDto } from './dto';

type AuthReq = { user: { userId: number; orgId: number; role: Role } };

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Post()
  create(@Request() req: AuthReq, @Body() body: CreateClientDto) {
    return this.clientsService.create(req.user.orgId, body);
  }

  @Roles(Role.OWNER, Role.ESTIMATOR, Role.TECH)
  @Get()
  list(@Request() req: AuthReq, @Query('limit') limitRaw?: string, @Query('offset') offsetRaw?: string) {
    const limit = Math.min(Number(limitRaw) || 20, 100);
    const offset = Number(offsetRaw) || 0;
    return this.clientsService.list(req.user.orgId, limit, offset);
  }

  @Roles(Role.OWNER, Role.ESTIMATOR, Role.TECH)
  @Get(':id')
  get(@Request() req: AuthReq, @Param('id') id: string) {
    return this.clientsService.get(req.user.orgId, Number(id));
  }

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Patch(':id')
  update(@Request() req: AuthReq, @Param('id') id: string, @Body() body: UpdateClientDto) {
    return this.clientsService.update(req.user.orgId, Number(id), body);
  }

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Delete(':id')
  remove(@Request() req: AuthReq, @Param('id') id: string) {
    return this.clientsService.remove(req.user.orgId, Number(id));
  }
}
