import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsObject, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateInviteDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsEnum(Role)
  role!: Role;
}

export class UpdateOrgProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsObject()
  businessAddress?: Record<string, any> | null;

  @IsOptional()
  @IsObject()
  proposalDefaults?: Record<string, any> | null;
}
