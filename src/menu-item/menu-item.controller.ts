import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import {
  MENU_ITEM_SERVICE_NAME,
  type MenuItemList,
  type MenuItem,
  type CreateMenuItemRequest,
  type UpdateMenuItemRequest,
  type StatusResponse,
} from 'src/generated-types/menu-item';
import { MenuItemService } from './menu-item.service';

@Controller()
export class MenuItemController {
  private readonly logger = new Logger(MenuItemController.name);
  constructor(private readonly menuItemService: MenuItemService) {}

  @GrpcMethod(MENU_ITEM_SERVICE_NAME, 'GetMenuItemById')
  async getMenuItemById(data: { id: string }): Promise<MenuItem> {
    this.logger.log(`Received gRPC request: GetMenuItemById with id ${data.id}`);
    return this.menuItemService.getMenuItemById(data.id);
  }

  @GrpcMethod(MENU_ITEM_SERVICE_NAME, 'GetMenuItemsByCategoryId')
  async getMenuItemsByCategoryId(data: { id: string }): Promise<MenuItemList> {
    this.logger.log(`Received gRPC request: GetMenuItemsByCategoryId with id ${data.id}`);
    return this.menuItemService.getMenuItemsByCategoryId(data.id);
  }

  @GrpcMethod(MENU_ITEM_SERVICE_NAME, 'CreateMenuItem')
  async createMenuItem(data: CreateMenuItemRequest): Promise<MenuItem> {
    this.logger.log(`Received gRPC request: CreateMenuItem with title ${data.title}`);
    return this.menuItemService.createMenuItem(data);
  }

  @GrpcMethod(MENU_ITEM_SERVICE_NAME, 'UpdateMenuItem')
  async updateMenuItem(data: UpdateMenuItemRequest): Promise<MenuItem> {
    this.logger.log(`Received gRPC request: UpdateMenuItem with id ${data.id}`);
    return this.menuItemService.updateMenuItem(data);
  }

  @GrpcMethod(MENU_ITEM_SERVICE_NAME, 'DeleteMenuItem')
  async deleteMenuItem({ id }: { id: string }): Promise<StatusResponse> {
    this.logger.log(`Received gRPC request: DeleteMenuItem with id ${id}`);
    return this.menuItemService.deleteMenuItem(id);
  }

  @GrpcMethod(MENU_ITEM_SERVICE_NAME, 'ChangeMenuItemPosition')
  async changeMenuItemPosition({ id, position }: { id: string; position: number }): Promise<MenuItem> {
    this.logger.log(`Received gRPC request: ChangeMenuItemPosition with id ${id} to position ${position}`);
    return this.menuItemService.changeMenuItemPosition({ id, position });
  }
}
