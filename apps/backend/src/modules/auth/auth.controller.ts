import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService, LoginDto } from './auth.service';

@ApiTags('Authentication & Sessions')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user credentials and issue signed JWT session' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
