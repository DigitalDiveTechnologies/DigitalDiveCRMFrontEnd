import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { EmailModule } from '../email/email.module';
import { Employee } from '../../database/entities/employee.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee]),
    EmailModule,
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
