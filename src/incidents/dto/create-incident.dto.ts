import { ApiProperty } from '@nestjs/swagger';
import { IncidentPriority, IncidentSeverity } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateIncidentDto {
  @ApiProperty({
    example: 'Production API latency',
    description: 'Short description of the incident',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'API latency increased above 2 seconds for production traffic.',
    description: 'Detailed description of the incident',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    enum: IncidentSeverity,
    example: IncidentSeverity.HIGH,
    required: false,
  })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @ApiProperty({
    enum: IncidentPriority,
    example: IncidentPriority.P1,
    required: false,
  })
  @IsOptional()
  @IsEnum(IncidentPriority)
  priority?: IncidentPriority;
}