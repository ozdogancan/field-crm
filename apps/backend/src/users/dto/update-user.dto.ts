import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

enum UserRole {
  admin = 'admin',
  field_user = 'field_user',
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'user@fieldcrm.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Geçerli bir email adresi girin' })
  email?: string;

  @ApiPropertyOptional({ example: 'Ahmet Yılmaz' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: '+905551234567' })
  @IsOptional()
  @IsString()
  phone?: string;
}
