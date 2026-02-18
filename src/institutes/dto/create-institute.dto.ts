import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateInstituteDto {
  @ApiProperty({ example: 'Exam Adda Delhi', minLength: 2 })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'NEET + JEE preparation batches', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
