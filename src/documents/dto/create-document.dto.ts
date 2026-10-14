import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({
    example: 'API restart runbook',
    description: 'Title of the document',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Restart the API service and confirm health checks pass.',
    description: 'Full document text to chunk and embed',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: 'https://wiki.example.com/runbooks/api-restart',
    description: 'Optional source of the document',
    required: false,
  })
  @IsOptional()
  @IsString()
  source?: string;
}
