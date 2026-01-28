import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../shared/jwt-auth.guard';
import { RolesGuard } from '../shared/roles.guard';
import { Roles } from '../shared/roles.decorator';
import { Role } from '@prisma/client';
import { AddLineItemDto, CreateProjectDto, CreateRoomDto, UpdateLineItemDto, UpdateProjectDto, UpdateRoomDto } from './dto';

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
  @Patch(':id')
  renameProject(@Request() req: AuthReq, @Param('id') id: string, @Body() body: UpdateProjectDto) {
    const { orgId } = req.user;
    return this.projectsService.renameProject(orgId, Number(id), body);
  }

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Patch(':id/archive')
  archiveProject(@Request() req: AuthReq, @Param('id') id: string) {
    const { orgId } = req.user;
    return this.projectsService.archiveProject(orgId, Number(id));
  }

  @Roles(Role.OWNER)
  @Delete(':id')
  deleteProject(@Request() req: AuthReq, @Param('id') id: string) {
    const { orgId } = req.user;
    return this.projectsService.deleteProject(orgId, Number(id));
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
  @Delete(':id/rooms/:roomId')
  deleteRoom(@Request() req: AuthReq, @Param('id') id: string, @Param('roomId') roomId: string) {
    const { orgId } = req.user;
    return this.projectsService.deleteRoom(orgId, Number(id), Number(roomId));
  }

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Post(':id/bom-versions')
  snapshotBom(@Request() req: AuthReq, @Param('id') id: string) {
    const { orgId, userId } = req.user;
    return this.projectsService.snapshotBom(orgId, Number(id), userId);
  }

  @Roles(Role.OWNER, Role.ESTIMATOR, Role.TECH)
  @Get(':id/bom-versions/:versionId')
  getBomVersion(@Request() req: AuthReq, @Param('id') id: string, @Param('versionId') versionId: string) {
    const { orgId } = req.user;
    return this.projectsService.getBomVersion(orgId, Number(id), Number(versionId));
  }

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Post(':id/bom-versions/:versionId/share')
  shareBomVersion(@Request() req: AuthReq, @Param('id') id: string, @Param('versionId') versionId: string) {
    const { orgId } = req.user;
    return this.projectsService.shareBomVersion(orgId, Number(id), Number(versionId));
  }

  @Roles(Role.OWNER, Role.ESTIMATOR, Role.TECH)
  @Get(':id/bom-versions/:versionId/export')
  async exportBomVersion(
    @Request() req: AuthReq,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const { orgId } = req.user;
    const { csv, filename } = await this.projectsService.exportBomVersion(orgId, Number(id), Number(versionId));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return csv;
  }

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Post(':id/rooms')
  createRoom(@Request() req: AuthReq, @Param('id') id: string, @Body() body: CreateRoomDto) {
    const { orgId } = req.user;
    return this.projectsService.createRoom(orgId, Number(id), body);
  }
}
