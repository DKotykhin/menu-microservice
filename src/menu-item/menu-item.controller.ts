import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import {
  MENU_ITEM_SERVICE_NAME,
  type CreateMenuItemRequest,
  type CreateMenuItemTranslationRequest,
  type MenuItem,
  type MenuItemListWithTranslation,
  type MenuItemTranslation,
  type MenuItemWithTranslation,
  type StatusResponse,
  type UpdateMenuItemRequest,
  type UpdateMenuItemTranslationRequest,
} from 'src/generated-types/menu-item';
import { MenuItemService } from './menu-item.service';

@Controller()
export class MenuItemController {
  private readonly logger = new Logger(MenuItemController.name);
  constructor(private readonly menuItemService: MenuItemService) {}

  // ---- Menu Item Retrieval ---- //

  @GrpcMethod(MENU_ITEM_SERVICE_NAME, 'GetMenuItemById')
  async getMenuItemById(data: { id: string }): Promise<MenuItemWithTranslation> {
    this.logger.log(`Received gRPC request: GetMenuItemById with id ${data.id}`);
    return this.menuItemService.getMenuItemById(data.id);
  }

  @GrpcMethod(MENU_ITEM_SERVICE_NAME, 'GetMenuItemsByCategoryId')
  async getMenuItemsByCategoryId(data: { id: string }): Promise<MenuItemListWithTranslation> {
    this.logger.log(`Received gRPC request: GetMenuItemsByCategoryId with id ${data.id}`);
    return await this.menuItemService.getMenuItemsByCategoryId(data.id);
  }

  // ---- Menu Item Management ---- //

  @GrpcMethod(MENU_ITEM_SERVICE_NAME, 'CreateMenuItem')
  async createMenuItem(data: CreateMenuItemRequest): Promise<MenuItem> {
    this.logger.log(`Received gRPC request: CreateMenuItem with slug ${data.slug}`);
    return await this.menuItemService.createMenuItem(data);
  }

  @GrpcMethod(MENU_ITEM_SERVICE_NAME, 'UpdateMenuItem')
  async updateMenuItem(data: UpdateMenuItemRequest): Promise<MenuItem> {
    this.logger.log(`Received gRPC request: UpdateMenuItem with id ${data.id}`);
    return await this.menuItemService.updateMenuItem(data);
  }

  @GrpcMethod(MENU_ITEM_SERVICE_NAME, 'DeleteMenuItem')
  async deleteMenuItem({ id }: { id: string }): Promise<StatusResponse> {
    this.logger.log(`Received gRPC request: DeleteMenuItem with id ${id}`);
    return await this.menuItemService.deleteMenuItem(id);
  }

  @GrpcMethod(MENU_ITEM_SERVICE_NAME, 'ChangeMenuItemPosition')
  async changeMenuItemPosition({ id, position }: { id: string; position: number }): Promise<MenuItem> {
    this.logger.log(`Received gRPC request: ChangeMenuItemPosition with id ${id} to position ${position}`);
    return await this.menuItemService.changeMenuItemPosition({ id, position });
  }

  // ---- Menu Item Translations ---- //
  @GrpcMethod(MENU_ITEM_SERVICE_NAME, 'CreateMenuItemTranslation')
  async createMenuItemTranslation(data: CreateMenuItemTranslationRequest): Promise<MenuItemTranslation> {
    this.logger.log(
      `Received gRPC request: CreateMenuItemTranslation for menu item ID ${data.itemId} and language ${data.language}`,
    );
    return await this.menuItemService.createMenuItemTranslation(data);
  }

  @GrpcMethod(MENU_ITEM_SERVICE_NAME, 'UpdateMenuItemTranslation')
  async updateMenuItemTranslation(data: UpdateMenuItemTranslationRequest): Promise<MenuItemTranslation> {
    this.logger.log(`Received gRPC request: UpdateMenuItemTranslation with ID ${data.id}`);
    return await this.menuItemService.updateMenuItemTranslation(data);
  }

  @GrpcMethod(MENU_ITEM_SERVICE_NAME, 'DeleteMenuItemTranslation')
  async deleteMenuItemTranslation({ id }: { id: string }): Promise<StatusResponse> {
    this.logger.log(`Received gRPC request: DeleteMenuItemTranslation with ID ${id}`);
    return await this.menuItemService.deleteMenuItemTranslation(id);
  }
}
