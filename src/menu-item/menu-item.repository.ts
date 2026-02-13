import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import type { Language, MenuItem, Prisma } from 'prisma/generated-types/client';
import type {
  CreateMenuItemRequest,
  CreateMenuItemTranslationRequest,
  MenuItemTranslation,
  UpdateMenuItemRequest,
  UpdateMenuItemTranslationRequest,
} from 'src/generated-types/menu-item';

export type MenuItemWithTranslationsPayload = Prisma.MenuItemGetPayload<{
  include: { menuItemTranslations: true };
}>;

@Injectable()
export class MenuItemRepository {
  private readonly logger = new Logger(MenuItemRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  // ---- Menu Item Retrieval ---- //

  // Get a menu item by its ID
  async getMenuItemById(id: string): Promise<MenuItemWithTranslationsPayload | null> {
    this.logger.log(`Retrieving menu item with ID: ${id}`);
    return this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        menuItemTranslations: true,
      },
    });
  }

  // Get menu items by their category ID
  async getMenuItemsByCategoryId(categoryId: string): Promise<MenuItemWithTranslationsPayload[]> {
    this.logger.log(`Retrieving menu items for category ID: ${categoryId}`);
    return this.prisma.menuItem.findMany({
      where: { categoryId },
      include: {
        menuItemTranslations: true,
      },
    });
  }

  // ---- Menu Item Management ---- //

  // Create a new menu item
  async createMenuItem({
    data,
    lastPosition,
  }: {
    data: CreateMenuItemRequest;
    lastPosition: number;
  }): Promise<MenuItem> {
    this.logger.log(`Creating menu item with slug: ${data.slug}`);
    return this.prisma.menuItem.create({
      data: {
        slug: data.slug,
        price: data.price,
        ...(data.isAvailable !== undefined && data.isAvailable !== null && { isAvailable: data.isAvailable }),
        ...(data.imageUrl && { imageUrl: data.imageUrl }),
        position: lastPosition + 1,
        categoryId: data.categoryId,
      },
    });
  }

  // Update an existing menu item
  async updateMenuItem(data: UpdateMenuItemRequest): Promise<MenuItem> {
    this.logger.log(`Updating menu item with ID: ${data.id}`);
    return this.prisma.menuItem.update({
      where: { id: data.id },
      data: {
        ...(data.slug !== undefined && data.slug !== null && { slug: data.slug }),
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

  // ---- Menu Item Translations ---- //

  // Create a new menu item translation
  async createMenuItemTranslation(data: CreateMenuItemTranslationRequest): Promise<MenuItemTranslation> {
    this.logger.log(`Creating menu item translation for menu item ID: ${data.itemId} and language: ${data.language}`);
    return this.prisma.menuItemTranslation.create({
      data: {
        title: data.title,
        ...(data.description && { description: data.description }),
        language: data.language as Language,
        itemId: data.itemId,
      },
    });
  }

  // Update an existing menu item translation
  async updateMenuItemTranslation({
    id,
    title,
    description,
  }: UpdateMenuItemTranslationRequest): Promise<MenuItemTranslation> {
    this.logger.log(`Updating menu item translation with ID: ${id}`);
    return this.prisma.menuItemTranslation.update({
      where: { id },
      data: {
        ...(title !== undefined && title !== null && { title }),
        ...(description !== undefined && description !== null && { description }),
      },
    });
  }

  // Delete a menu item translation by its ID
  async deleteMenuItemTranslation(id: string): Promise<MenuItemTranslation> {
    this.logger.log(`Deleting menu item translation with ID: ${id}`);
    return this.prisma.menuItemTranslation.delete({
      where: { id },
    });
  }
}
