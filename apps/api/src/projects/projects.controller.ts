import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../shared/jwt-auth.guard';
import { RolesGuard } from '../shared/roles.guard';
import { Roles } from '../shared/roles.decorator';
import { Role } from '@prisma/client';
import { AddLineItemDto, CreateProjectDto, CreateRoomDto, UpdateLineItemDto, UpdateRoomDto } from './dto';

type AuthReq = { user: { userId: number; orgId: number; role: Role } };

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Post()
  create(@Request() req: AuthReq, @Body() body: CreateProjectDto) {
    const { orgId, userId } = req.user;
    return this.projectsService.createProject(orgId, userId, body);
  }

  @Roles(Role.OWNER, Role.ESTIMATOR, Role.TECH)
  @Get()
  list(@Request() req: AuthReq, @Query('limit') limitRaw?: string, @Query('offset') offsetRaw?: string) {
    const { orgId } = req.user;
    const limit = Math.min(Number(limitRaw) || 20, 100);
    const offset = Number(offsetRaw) || 0;
    return this.projectsService.list(orgId, limit, offset);
  }

  @Roles(Role.OWNER, Role.ESTIMATOR, Role.TECH)
  @Get(':id')
  get(@Request() req: AuthReq, @Param('id') id: string) {
    const { orgId } = req.user;
    return this.projectsService.get(orgId, Number(id));
  }

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Post(':id/line-items')
  addLineItem(@Request() req: AuthReq, @Param('id') id: string, @Body() body: AddLineItemDto) {
    const { orgId, userId } = req.user;
    return this.projectsService.addLineItem(orgId, userId, { ...body, projectId: Number(id) });
  }

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Patch(':id/line-items/:lineItemId')
  updateLineItem(
    @Request() req: AuthReq,
    @Param('id') id: string,
    @Param('lineItemId') lineItemId: string,
    @Body() body: UpdateLineItemDto
  ) {
    const { orgId } = req.user;
    return this.projectsService.updateLineItem(orgId, Number(id), Number(lineItemId), body);
  }

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Delete(':id/line-items/:lineItemId')
  removeLineItem(@Request() req: AuthReq, @Param('id') id: string, @Param('lineItemId') lineItemId: string) {
    const { orgId } = req.user;
    return this.projectsService.removeLineItem(orgId, Number(id), Number(lineItemId));
  }

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Patch(':id/rooms/:roomId')
  renameRoom(@Request() req: AuthReq, @Param('id') id: string, @Param('roomId') roomId: string, @Body() body: UpdateRoomDto) {
    const { orgId } = req.user;
    return this.projectsService.renameRoom(orgId, Number(id), Number(roomId), body);
  }

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Post(':id/bom-versions')
  snapshotBom(@Request() req: AuthReq, @Param('id') id: string) {
    const { orgId, userId } = req.user;
    return this.projectsService.snapshotBom(orgId, Number(id), userId);
  }

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Post(':id/rooms')
  createRoom(@Request() req: AuthReq, @Param('id') id: string, @Body() body: CreateRoomDto) {
    const { orgId } = req.user;
    return this.projectsService.createRoom(orgId, Number(id), body);
  }
}
