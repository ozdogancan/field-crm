import { IsString, IsNumber, IsOptional } from 'class-validator';

export class StartVisitDto {
  @IsString()
  prospectId: string;

  @IsOptional()
  @IsString()
  routePlanItemId?: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
