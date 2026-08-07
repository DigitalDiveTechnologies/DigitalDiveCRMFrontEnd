import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaxModule } from './modules/tax/tax.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { SyncModule } from './modules/sync/sync.module';
import { SalesModule } from './modules/sales/sales.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ImportModule } from './modules/import/import.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditLogEntity } from './database/entities/audit-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST', 'localhost'),
        port: config.get<number>('POSTGRES_PORT', 5432),
        username: config.get<string>('POSTGRES_USER', 'postgres'),
        password: config.get<string>('POSTGRES_PASSWORD', 'postgres'),
        database: config.get<string>('POSTGRES_DB', 'uae_accounting_db'),
        entities: [AuditLogEntity],
        synchronize: true, // Enabled for development & migrations
        autoLoadEntities: true,
        // Fallback to in-memory mode if PostgreSQL daemon is offline
        retryAttempts: 1,
      }),
    }),
    AuthModule,
    TaxModule,
    LedgerModule,
    SyncModule,
    SalesModule,
    PurchasesModule,
    InventoryModule,
    ImportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

