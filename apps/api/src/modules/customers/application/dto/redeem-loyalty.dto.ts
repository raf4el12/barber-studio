import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class RedeemLoyaltyDto {
  @IsInt()
  @Min(1)
  points!: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}
