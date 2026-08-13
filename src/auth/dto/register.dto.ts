import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'alice@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'User password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: 'Alice Smith',
    description: 'User full name',
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    example: 'Acme Engineering',
    description: 'Name of the organization to create',
  })
  @IsString()
  organizationName: string;
}
