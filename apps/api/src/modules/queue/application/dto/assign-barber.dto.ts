import { IsNotEmpty, IsString } from 'class-validator';

export class AssignBarberDto {
  @IsString()
  @IsNotEmpty()
  barberId!: string;
}
