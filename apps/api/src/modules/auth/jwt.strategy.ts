import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import Redis from 'ioredis';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';

import { User } from '../../entities/user.entity';
import { REDIS_CLIENT } from '../../redis/redis.module';

interface JwtPayload {
  sub: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'dev_secret_change_me'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(
      req as unknown as Record<string, unknown>,
    );

    if (token) {
      const isBlacklisted = await this.redis.get(`token:blacklist:${token}`);
      if (isBlacklisted) throw new UnauthorizedException('Token 已失效');
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user || user.status !== 1) throw new UnauthorizedException();

    const permissions = new Set<string>();
    user.roles.forEach((role) => role.permissions.forEach((p) => permissions.add(p.code)));

    return {
      userId: user.id,
      username: user.username,
      permissions: Array.from(permissions),
    };
  }
}
