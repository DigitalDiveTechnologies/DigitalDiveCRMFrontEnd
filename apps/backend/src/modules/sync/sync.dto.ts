import { IsString, IsArray, IsUUID, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OutboxMutationDto {
  @ApiProperty({ description: 'Client-generated mutation UUID' })
  @IsUUID()
  mutationId: string;

  @ApiProperty({ description: 'Idempotency key for request deduplication' })
  @IsString()
  idempotencyKey: string;

  @ApiProperty({ description: 'Target entity type (SALES_INVOICE, RECEIPT, PARTY)' })
  @IsString()
  entityType: string;

  @ApiProperty({ description: 'Operation type (CREATE, UPDATE)' })
  @IsString()
  operation: string;

  @ApiProperty({ description: 'Payload body object' })
  payload: any;

  @ApiProperty({ description: 'ISO timestamp when created on client device' })
  @IsString()
  clientCreatedAt: string;
}

export class PushSyncDto {
  @ApiProperty({ description: 'Client Device ID' })
  @IsString()
  deviceId: string;

  @ApiProperty({ description: 'Array of offline outbox mutations to commit' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutboxMutationDto)
  mutations: OutboxMutationDto[];
}
