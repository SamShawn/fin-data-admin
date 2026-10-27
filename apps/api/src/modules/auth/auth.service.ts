import { Injectable, UnauthorizedException, ForbiddenException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import { Repository } from 'typeorm';

import { User } from '../../entities/user.entity';
import { REDIS_CLIENT } from '../../redis/redis.module';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async validateUser(username: string, pass: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { username },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user || !(await bcrypt.compare(pass, user.passwordHash))) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    if (user.status !== 1) {
      throw new ForbiddenException('账号已被禁用');
    }
    return user;
  }

  async login(user: User) {
    const payload = { sub: user.id, username: user.username };

    const permissions = new Set<string>();
    user.roles.forEach((role) => {
      role.permissions.forEach((p) => permissions.add(p.code));
    });

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES'),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        roles: user.roles.map((r) => ({ code: r.code, name: r.name })),
        permissions: Array.from(permissions),
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string; username: string }>(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || user.status !== 1) {
        throw new UnauthorizedException('用户不存在或已禁用');
      }

      return this.login(user);
    } catch {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  async logout(accessToken: string) {
    // 使用 JwtPayload 类型替代 any
    const decoded = this.jwtService.decode(accessToken) as { exp?: number } | null;
    if (decoded && decoded.exp) {
      const ttl = decoded.exp * 1000 - Date.now();
      if (ttl > 0) {
        await this.redis.set(`token:blacklist:${accessToken}`, '1', 'PX', ttl);
      }
    }
    return { success: true };
  }
}
