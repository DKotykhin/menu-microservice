import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import type { Language } from 'prisma/generated-types/enums';
import type { MenuItem } from 'prisma/generated-types/client';
import type { CreateMenuItemRequest, UpdateMenuItemRequest } from 'src/generated-types/menu-item';

@Injectable()
export class MenuItemRepository {
  private readonly logger = new Logger(MenuItemRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  // Get a menu item by its ID
  async getMenuItemById(id: string): Promise<MenuItem | null> {
    this.logger.log(`Retrieving menu item with ID: ${id}`);
    return this.prisma.menuItem.findUnique({
      where: { id },
    });
  }

  // Get menu items by their category ID
  async getMenuItemsByCategoryId(categoryId: string): Promise<MenuItem[]> {
    this.logger.log(`Retrieving menu items for category ID: ${categoryId}`);
    return this.prisma.menuItem.findMany({
      where: { categoryId },
    });
  }

  // Create a new menu item
  async createMenuItem({
    data,
    lastPosition,
  }: {
    data: CreateMenuItemRequest;
    lastPosition: number;
  }): Promise<MenuItem> {
    this.logger.log(`Creating menu item with title: ${data.title}`);
    return this.prisma.menuItem.create({
      data: {
        language: data.language as Language,
        title: data.title,
        description: data.description,
        price: data.price,
        ...(data.isAvailable !== undefined && data.isAvailable !== null && { isAvailable: data.isAvailable }),
        ...(data.imageUrl && { imageUrl: data.imageUrl }),
        position: lastPosition + 1,
        categoryId: data.menuCategory?.id as string,
      },
    });
  }

  // Update an existing menu item
  async updateMenuItem(data: UpdateMenuItemRequest): Promise<MenuItem> {
    this.logger.log(`Updating menu item with ID: ${data.id}`);
    return this.prisma.menuItem.update({
      where: { id: data.id },
      data: {
        ...(data.language && { language: data.language as Language }),
        ...(data.title !== undefined && data.title !== null && { title: data.title }),
        ...(data.description !== undefined && data.description !== null && { description: data.description }),
        ...(data.price !== undefined && data.price !== null && { price: data.price }),
        ...(data.imageUrl !== undefined && data.imageUrl !== null && { imageUrl: data.imageUrl }),
        ...(data.isAvailable !== undefined && data.isAvailable !== null && { isAvailable: data.isAvailable }),
      },
    });
  }

  // Delete a menu item by its ID and update positions of remaining items
  async deleteMenuItem(id: string, positionUpdates: Array<{ id: string; position: number }> = []): Promise<MenuItem> {
    this.logger.log(`Deleting menu item with ID: ${id}`);
    return await this.prisma.$transaction(async (prisma) => {
      // Delete the item first
      const deletedItem = await prisma.menuItem.delete({
        where: { id },
      });

      // Update positions of remaining items
      for (const update of positionUpdates) {
        await prisma.menuItem.update({
          where: { id: update.id },
          data: { position: update.position },
        });
      }

      return deletedItem;
    });
  }

  // Change position of a menu item within a transaction
  async changeMenuItemPosition(
    id: string,
    positionUpdates: Array<{ id: string; position: number }>,
  ): Promise<MenuItem | null> {
    this.logger.log(`Changing position of menu item with ID: ${id}`);
    return await this.prisma.$transaction(async (prisma) => {
      for (const update of positionUpdates) {
        await prisma.menuItem.update({
          where: { id: update.id },
          data: { position: update.position },
        });
      }
      return await prisma.menuItem.findUnique({ where: { id } });
    });
  }
}
