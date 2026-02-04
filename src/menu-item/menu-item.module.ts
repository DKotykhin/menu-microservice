import { Module } from '@nestjs/common';

import { MenuItemService } from './menu-item.service';
import { MenuItemController } from './menu-item.controller';
import { MenuItemRepository } from './menu-item.repository';

@Module({
  controllers: [MenuItemController],
  providers: [MenuItemService, MenuItemRepository],
})
export class MenuItemModule {}
