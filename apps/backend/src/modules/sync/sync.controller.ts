import { Controller, Post, Get, Body, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { PushSyncDto } from './sync.dto';

@ApiTags('Offline Sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  @ApiOperation({ summary: 'Ingest offline mutations from mobile/POS client outbox' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant UUID' })
  async pushSync(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Body() dto: PushSyncDto,
  ) {
    return this.syncService.processPushSync(tenantId, dto);
  }

  @Get('pull')
  @ApiOperation({ summary: 'Pull incremental changes from server using cursor' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant UUID' })
  async pullSync(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Query('cursor') cursor?: string,
  ) {
    return this.syncService.getPullSyncChanges(tenantId, cursor);
  }
}
