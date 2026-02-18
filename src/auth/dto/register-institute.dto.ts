import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { IsEmail } from 'class-validator';

export class RegisterInstituteDto {
  @ApiProperty({ example: 'owner@examadda.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Prashant Chhatri', minLength: 2 })
  @IsString()
  @MinLength(2)
  ownerName: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @Matches(/^[0-9]{10,15}$/)
  phone: string;

  @ApiProperty({ example: 'Exam Adda Academy', minLength: 2 })
  @IsString()
  @MinLength(2)
  instituteName: string;

  @ApiProperty({ example: 'Online mock tests and batches', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
