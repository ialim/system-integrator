import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsArray, Min } from 'class-validator';
import { OrderStatus, OrderType } from '@prisma/client';

export class CreateOrderDto {
  @IsInt()
  @Min(1)
  projectId!: number;

  @IsInt()
  @Min(1)
  bomVersionId!: number;

  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;

  @IsOptional()
  @IsObject()
  shipping?: Record<string, any> | null;

  @IsOptional()
  @IsObject()
  tax?: Record<string, any> | null;

  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  @IsArray()
  tracking?: any[] | null;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

export class UpdateOrderTrackingDto {
  @IsOptional()
  @IsArray()
  tracking?: any[] | null;
}
