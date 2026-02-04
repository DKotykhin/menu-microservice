import { Injectable, Logger } from '@nestjs/common';

import { AppError } from 'src/utils/errors/app-error';
import { MenuItemRepository } from './menu-item.repository';

import type {
  ChangeMenuItemPositionRequest,
  CreateMenuItemRequest,
  MenuItem,
  MenuItemList,
  StatusResponse,
  UpdateMenuItemRequest,
} from 'src/generated-types/menu-item';

@Injectable()
export class MenuItemService {
  constructor(private readonly menuItemRepository: MenuItemRepository) {}
  protected readonly logger = new Logger(MenuItemService.name);

  async getMenuItemById(id: string): Promise<MenuItem> {
    this.logger.log(`Fetching menu item by id: ${id}`);
    try {
      const menuItem = await this.menuItemRepository.getMenuItemById(id);

      if (!menuItem) {
        this.logger.warn(`Menu item with id ${id} not found`);
        throw AppError.notFound(`Menu item with id ${id} not found`);
      }

      return menuItem;
    } catch (error) {
      this.logger.error(`Failed to get menu item by id: ${id}`, error instanceof Error ? error.message : error);
      if (error instanceof AppError) throw error;
      throw AppError.internalServerError('Failed to fetch full menu');
    }
  }

  async getMenuItemsByCategoryId(categoryId: string): Promise<MenuItemList> {
    this.logger.log(`Fetching menu items by category id: ${categoryId}`);
    try {
      const menuItems = await this.menuItemRepository.getMenuItemsByCategoryId(categoryId);

      return { menuItems };
    } catch (error) {
      this.logger.error(
        `Failed to get menu items by category id: ${categoryId}`,
        error instanceof Error ? error.message : error,
      );
      throw AppError.internalServerError('Failed to fetch menu items by category');
    }
  }

  async createMenuItem(data: CreateMenuItemRequest): Promise<MenuItem> {
    this.logger.log(`Creating menu item with title: ${data.title}`);
    try {
      const lastItems = await this.menuItemRepository.getMenuItemsByCategoryId(data.menuCategory?.id as string);
      const lastPosition = lastItems.reduce((max, item) => (item.position > max ? item.position : max), 0);
      return await this.menuItemRepository.createMenuItem({ data, lastPosition });
    } catch (error) {
      this.logger.error(
        `Failed to create menu item with title: ${data.title}`,
        error instanceof Error ? error.message : error,
      );
      throw AppError.internalServerError('Failed to create menu item');
    }
  }

  async updateMenuItem(data: UpdateMenuItemRequest): Promise<MenuItem> {
    this.logger.log(`Updating menu item with id: ${data.id}`);
    try {
      return await this.menuItemRepository.updateMenuItem(data);
    } catch (error) {
      this.logger.error(
        `Failed to update menu item with id: ${data.id}`,
        error instanceof Error ? error.message : error,
      );
      throw AppError.internalServerError('Failed to update menu item');
    }
  }

  async deleteMenuItem(id: string): Promise<StatusResponse> {
    this.logger.log(`Deleting menu item with id: ${id}`);
    try {
      // Fetch the item to get its position and categoryId
      const itemToDelete = await this.menuItemRepository.getMenuItemById(id);
      if (!itemToDelete) {
        this.logger.warn(`Menu item with id ${id} not found`);
        throw AppError.notFound(`Menu item with id ${id} not found`);
      }

      // Fetch all items in the same category
      const items = await this.menuItemRepository.getMenuItemsByCategoryId(itemToDelete.categoryId);

      // Calculate position updates for items with higher positions
      const positionUpdates = items
        .filter((item) => item.position > itemToDelete.position)
        .map((item) => ({ id: item.id, position: item.position - 1 }));

      await this.menuItemRepository.deleteMenuItem(id, positionUpdates);
      return { success: true, message: `Menu item with id ${id} deleted successfully` };
    } catch (error) {
      this.logger.error(`Failed to delete menu item with id: ${id}`, error instanceof Error ? error.message : error);
      if (error instanceof AppError) throw error;
      throw AppError.internalServerError('Failed to delete menu item');
    }
  }

  async changeMenuItemPosition(data: ChangeMenuItemPositionRequest): Promise<MenuItem> {
    const { id, position } = data;
    this.logger.log(`Changing position of menu item with ID: ${id} to new position: ${position}`);
    try {
      // Fetch the item to update
      const itemToUpdate = await this.menuItemRepository.getMenuItemById(id);
      if (!itemToUpdate) {
        this.logger.warn(`Menu item with ID ${id} not found`);
        throw AppError.notFound('Menu item not found');
      }

      // Fetch all items in the same category
      const items = await this.menuItemRepository.getMenuItemsByCategoryId(itemToUpdate.categoryId);

      // Calculate position updates (business logic)
      const positionUpdates = this.calculatePositionUpdates(items, itemToUpdate, position);

      // Delegate database transaction to repository
      const updatedItem = await this.menuItemRepository.changeMenuItemPosition(id, positionUpdates);

      this.logger.log(`Menu item position updated successfully to ${position}`);
      return updatedItem;
    } catch (error) {
      this.logger.error(`Error changing menu item position: ${error instanceof Error ? error.message : error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internalServerError('Failed to change menu item position');
    }
  }

  // Business logic: calculate which menu items need position updates
  private calculatePositionUpdates(
    items: MenuItem[],
    itemToUpdate: MenuItem,
    newPosition: number,
  ): Array<{ id: string; position: number }> {
    return items
      .map((item) => {
        if (item.id === itemToUpdate.id) {
          return { id: item.id, position: newPosition };
        }
        if (itemToUpdate.position < newPosition) {
          // Moving down
          if (item.position > itemToUpdate.position && item.position <= newPosition) {
            return { id: item.id, position: item.position - 1 };
          }
        } else if (itemToUpdate.position > newPosition) {
          // Moving up
          if (item.position < itemToUpdate.position && item.position >= newPosition) {
            return { id: item.id, position: item.position + 1 };
          }
        }
        return { id: item.id, position: item.position };
      })
      .filter((update) => {
        const original = items.find((i) => i.id === update.id);
        return original && original.position !== update.position;
      });
  }
}
