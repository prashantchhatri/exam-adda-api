import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUrl, Matches } from 'class-validator';

export class UpdateInstituteDetailsDto {
  @ApiProperty({ example: 'https://cdn.example.com/logo.png', required: false })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiProperty({ example: 'Sector 62, Noida', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '9876543210', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10,15}$/)
  phone?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  showInfoOnLogin?: boolean;
}
