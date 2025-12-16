import { IsInt, IsNotEmpty, IsOptional, IsString, Min, IsObject } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsObject()
  clientMeta?: Record<string, any>;
}

export class AddLineItemDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  projectId?: number;

  @IsOptional()
  @IsInt()
  roomId?: number;

  @IsInt()
  @Min(1)
  productId!: number;

  @IsInt()
  @Min(1)
  qty!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class UpdateLineItemDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  qty?: number;

  @IsOptional()
  @IsInt()
  roomId?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateRoomDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
