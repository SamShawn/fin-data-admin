import { randomUUID } from 'crypto';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    // 配置模块，全局可用，并加载 zod 校验
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env', // 指向 monorepo 根目录的 .env
      validate: validateEnv,
    }),

    // TypeORM 配置
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
        autoLoadEntities: true,
        synchronize: false, // 绝对不要开启，所有表结构通过迁移控制
        logging: config.get<string>('DB_LOGGING') === 'true',
      }),
    }),

    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req) => (req.headers['x-request-id'] as string) || randomUUID(),
        customProps: () => ({ context: 'HTTP' }),
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: { colorize: true, singleLine: true },
              }
            : undefined,
        autoLogging: true,
      },
    }),

    RedisModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
