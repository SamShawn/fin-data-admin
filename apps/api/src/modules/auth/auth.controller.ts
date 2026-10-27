import { Controller, Post, Body, UseGuards, Req, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { z } from 'zod';

import { Public } from '../../common/decorators/public.decorator';

import { AuthService } from './auth.service';

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

@Public()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: unknown) {
    const parsed = loginSchema.parse(body);
    const user = await this.authService.validateUser(parsed.username, parsed.password);
    return this.authService.login(user);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  async logout(@Req() req: Request) {
    // 👈 替换 any
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(token || '');
  }
}
