import { IsInt, IsString, IsArray, ValidateNested, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PlanItemDto {
  @IsString()
  prospectId: string;

  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number; // 1=Monday ... 7=Sunday

  @IsInt()
  @Min(1)
  visitOrder: number;
}

export class CreatePlanDto {
  @IsString()
  userId: string;

  @IsInt()
  year: number;

  @IsInt()
  @Min(1)
  @Max(53)
  weekNumber: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanItemDto)
  items: PlanItemDto[];
}
