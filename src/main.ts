import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AppModule } from './app.module';
import { MENU_ITEM_V1_PACKAGE_NAME } from './generated-types/menu-item';
import { HEALTH_CHECK_V1_PACKAGE_NAME } from './generated-types/health-check';
import { MENU_CATEGORY_V1_PACKAGE_NAME } from './generated-types/menu-category';
import { GrpcExceptionFilter } from './utils/filters/grpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' ? ['error'] : ['log', 'debug', 'warn', 'error', 'verbose'],
  });

  const logger = new Logger('Main');
  const configService = app.get(ConfigService);
  const url = configService.getOrThrow<string>('TRANSPORT_URL');

  app.useGlobalFilters(new GrpcExceptionFilter());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [MENU_CATEGORY_V1_PACKAGE_NAME, MENU_ITEM_V1_PACKAGE_NAME, HEALTH_CHECK_V1_PACKAGE_NAME],
      protoPath: ['proto/menu-category.proto', 'proto/menu-item.proto', 'proto/health-check.proto'],
      url,
    },
  });

  await app.startAllMicroservices();
  await app.init();
  logger.log('Menu microservice is running on ' + url);
}
void bootstrap();
