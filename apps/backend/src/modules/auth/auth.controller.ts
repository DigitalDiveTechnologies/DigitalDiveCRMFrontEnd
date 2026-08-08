import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
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

  @Get('users')
  @ApiOperation({ summary: 'List all registered system users' })
  async getUsers() {
    return this.authService.getUsers();
  }

  @Post('users')
  @ApiOperation({ summary: 'Register a new user login and mapping' })
  async createUser(@Body() body: any) {
    return this.authService.createUser(body);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user login details and role/tenant context' })
  async updateUser(@Param('id') id: string, @Body() body: any) {
    return this.authService.updateUser(id, body);
  }
}
