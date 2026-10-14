import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

export class InvokeToolDto {
  @ApiProperty({
    description: 'Validated input for the named tool',
    example: { query: 'api latency' },
  })
  @IsObject()
  @IsNotEmpty()
  input: Record<string, unknown>;
}
