import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PaymentsService } from '../payments/payments.service';
import { JwtAuthGuard } from '../shared/jwt-auth.guard';
import { RolesGuard } from '../shared/roles.guard';
import { Roles } from '../shared/roles.decorator';
import { Role } from '@prisma/client';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateOrderTrackingDto } from './dto';

type AuthReq = { user: { userId: number; orgId: number; role: Role; email?: string } };

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly paymentsService: PaymentsService
  ) {}

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Post()
  create(@Request() req: AuthReq, @Body() body: CreateOrderDto) {
    const { orgId } = req.user;
    return this.ordersService.create(orgId, body);
  }

  @Roles(Role.OWNER, Role.ESTIMATOR, Role.TECH)
  @Get()
  list(
    @Request() req: AuthReq,
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
    @Query('projectId') projectIdRaw?: string
  ) {
    const { orgId } = req.user;
    const limit = Math.min(Number(limitRaw) || 20, 100);
    const offset = Number(offsetRaw) || 0;
    const projectId = projectIdRaw ? Number(projectIdRaw) : undefined;
    return this.ordersService.list(orgId, { limit, offset, projectId });
  }

  @Roles(Role.OWNER, Role.ESTIMATOR, Role.TECH)
  @Get(':id')
  get(@Request() req: AuthReq, @Param('id') id: string) {
    const { orgId } = req.user;
    return this.ordersService.get(orgId, Number(id));
  }

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Patch(':id/status')
  updateStatus(@Request() req: AuthReq, @Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    const { orgId } = req.user;
    return this.ordersService.updateStatus(orgId, Number(id), body);
  }

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Patch(':id/tracking')
  updateTracking(@Request() req: AuthReq, @Param('id') id: string, @Body() body: UpdateOrderTrackingDto) {
    const { orgId } = req.user;
    return this.ordersService.updateTracking(orgId, Number(id), body);
  }

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Post(':id/share')
  share(@Request() req: AuthReq, @Param('id') id: string) {
    const { orgId } = req.user;
    return this.ordersService.shareOrder(orgId, Number(id));
  }

  @Roles(Role.OWNER, Role.ESTIMATOR)
  @Post(':id/payments/paystack/initialize')
  initializePaystack(@Request() req: AuthReq, @Param('id') id: string) {
    const { orgId, email } = req.user;
    return this.paymentsService.initializePaystack(orgId, Number(id), email || '');
  }

  @Roles(Role.OWNER, Role.ESTIMATOR, Role.TECH)
  @Get(':id/payments')
  listPayments(@Request() req: AuthReq, @Param('id') id: string) {
    const { orgId } = req.user;
    return this.paymentsService.listOrderPayments(orgId, Number(id));
  }
}
