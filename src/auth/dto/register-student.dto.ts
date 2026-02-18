import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsUUID, Matches, MinLength } from 'class-validator';

export class RegisterStudentDto {
  @ApiProperty({ example: 'student1@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Rahul Sharma', minLength: 2 })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @Matches(/^[0-9]{10,15}$/)
  phone: string;

  @ApiProperty({ example: 'c169f8d0-6fc6-4ba5-a07f-a8e4af558f2f' })
  @IsUUID()
  instituteId: string;
}
