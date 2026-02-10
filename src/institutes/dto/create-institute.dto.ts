import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateInstituteDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
