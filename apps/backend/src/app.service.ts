import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealthStatus() {
    return {
      status: 'ok',
      service: 'UAE Accounting Platform API',
      currency: 'AED',
      timestamp: new Date().toISOString(),
    };
  }
}
