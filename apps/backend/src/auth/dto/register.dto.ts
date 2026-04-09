import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum UserRole {
  admin = 'admin',
  field_user = 'field_user',
}

export class RegisterDto {
  @ApiProperty({ example: 'admin@fieldcrm.com' })
  @IsEmail({}, { message: 'Geçerli bir email adresi girin' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalı' })
  password: string;

  @ApiProperty({ example: 'Ahmet Yılmaz' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ enum: UserRole, default: 'field_user' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: '+905551234567' })
  @IsOptional()
  @IsString()
  phone?: string;
}
