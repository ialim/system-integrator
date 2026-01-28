import { IsEmail, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsObject()
  address?: Record<string, any> | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  name?: string | null;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsObject()
  address?: Record<string, any> | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
