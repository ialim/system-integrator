import { IsInt, IsNotEmpty, IsOptional, IsString, Min, IsObject, IsNumber } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsObject()
  clientMeta?: Record<string, any>;

  @IsOptional()
  @IsObject()
  proposalMeta?: Record<string, any>;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsObject()
  clientMeta?: Record<string, any>;

  @IsOptional()
  @IsObject()
  proposalMeta?: Record<string, any> | null;
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
  @IsNumber()
  @Min(0)
  unitPrice?: number | null;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateRoomDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
