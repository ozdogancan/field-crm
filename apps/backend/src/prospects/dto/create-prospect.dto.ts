import { IsString, IsOptional, IsNumber, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProspectDto {
  @ApiProperty({ example: 'ABC Şirketi' })
  @IsString()
  companyName: string;

  @ApiProperty({ example: 'Mehmet Demir' })
  @IsString()
  contactPerson: string;

  @ApiProperty({ example: '+905551234567' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'info@abc.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Atatürk Cad. No:1, Kadıköy, İstanbul' })
  @IsString()
  address: string;

  @ApiProperty({ example: 41.0082376 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 28.9783589 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: 'Tekstil' })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({ example: 'İlk görüşme yapılacak' })
  @IsOptional()
  @IsString()
  notes?: string;
}
