import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export enum VisitResultEnum {
  positive = 'positive',
  neutral = 'neutral',
  negative = 'negative',
}

export class EndVisitDto {
  @IsEnum(VisitResultEnum)
  result: VisitResultEnum;

  @IsOptional()
  @IsString()
  resultNotes?: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
