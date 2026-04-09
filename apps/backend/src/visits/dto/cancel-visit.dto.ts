import { IsString } from 'class-validator';

export class CancelVisitDto {
  @IsString()
  cancelReason: string;
}
