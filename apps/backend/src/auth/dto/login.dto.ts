import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@fieldcrm.com' })
  @IsEmail({}, { message: 'Geçerli bir email adresi girin' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalı' })
  password: string;
}
