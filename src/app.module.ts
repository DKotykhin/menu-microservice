import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

import { HealthCheckModule } from './health-check/health-check.module';
import { PrismaModule } from './prisma/prisma.module';
import { MenuCategoryModule } from './menu-category/menu-category.module';
import { validateEnv } from './utils/validators/env-validator';
import { EnvironmentVariables } from './utils/env.dto';
import { MenuItemModule } from './menu-item/menu-item.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local'],
      validate: (config) => validateEnv(config, EnvironmentVariables),
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60 * 1000, // 60 seconds
    }),
    HealthCheckModule,
    PrismaModule,
    MenuCategoryModule,
    MenuItemModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
