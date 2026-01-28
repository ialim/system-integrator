import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class ProposalResponseDto {
  @IsIn(['ACCEPTED', 'DECLINED'])
  status!: 'ACCEPTED' | 'DECLINED';

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
