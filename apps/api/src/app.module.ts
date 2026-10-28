import { randomUUID } from 'crypto';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionGuard } from './common/guards/permission.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { validateEnv } from './config/env.validation';
import { AuditLog } from './entities/audit-log.entity';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';
import { HealthModule } from './health/health.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    // 1. 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
      validate: validateEnv,
    }),

    // 2. 日志模块
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req) => (req.headers['x-request-id'] as string) || randomUUID(),
        customProps: () => ({ context: 'HTTP' }),
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
        autoLogging: true,
      },
    }),

    // 3. 数据库模块
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'fin'),
        password: config.get<string>('DB_PASSWORD', 'fin_dev'),
        database: config.get<string>('DB_NAME', 'fin_data'),
        // 注册实体
        entities: [User, Role, Permission, AuditLog],
        synchronize: false, // 绝对不要开启，所有表结构通过 SQL 迁移控制
        logging: config.get<string>('DB_LOGGING') === 'true',
      }),
    }),

    // 4. 其他模块
    RedisModule,
    HealthModule,
    AuthModule,
    AuditModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard }, // 👈 注意顺序：先认证，再鉴权
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
