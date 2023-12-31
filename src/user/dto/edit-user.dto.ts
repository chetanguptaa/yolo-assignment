/* eslint-disable prettier/prettier */
import { IsEmail, IsOptional } from 'class-validator';

export class EditUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;
}
