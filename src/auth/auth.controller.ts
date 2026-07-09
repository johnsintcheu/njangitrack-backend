import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body()
    body: {
      fullName: string;
      phoneNumber: string;
      email?: string;
      password: string;
      language?: string;
      quartier?: string;
      role?: 'MEMBER' | 'TREASURER' | 'GROUP_ADMIN';
    },
  ) {
    return this.authService.register(body);
  }

  @Post('login')
  login(
    @Body() body: { phoneNumber: string; password: string },
  ) {
    return this.authService.login(body.phoneNumber, body.password);
  }
}
