import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import type { Language } from 'prisma/generated-types/enums';
import type { MenuCategory } from 'prisma/generated-types/client';
import type {
  CreateMenuCategoryRequest,
  MenuCategoryWithItems,
  UpdateMenuCategoryRequest,
} from 'src/generated-types/menu-category';

@Injectable()
export class MenuCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}
  protected readonly logger = new Logger(MenuCategoryRepository.name);

  // Fetch menu categories along with their items for a specific language
  async getMenuCategoriesWithItemsByLanguage(language: Language): Promise<MenuCategoryWithItems[]> {
    this.logger.log(`Fetching menu categories for language: ${language}`);
    return await this.prisma.menuCategory.findMany({
      where: { language },
      orderBy: { position: 'asc' },
      include: {
        menuItems: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  // Fetch menu categories for a specific language
  async getMenuCategoriesByLanguage(language: Language): Promise<MenuCategory[]> {
    this.logger.log(`Fetching menu categories for language: ${language}`);
    return await this.prisma.menuCategory.findMany({
      where: { language },
      orderBy: { position: 'asc' },
    });
  }

  // Fetch a single menu category by its ID
  async getMenuCategoryById(id: string): Promise<MenuCategory | null> {
    this.logger.log(`Fetching menu category by ID: ${id}`);
    return await this.prisma.menuCategory.findUnique({
      where: { id },
    });
  }

  // Create a new menu category
  async createMenuCategory({
    data,
    lastPosition,
  }: {
    data: CreateMenuCategoryRequest;
    lastPosition: number;
  }): Promise<MenuCategory> {
    this.logger.log(`Creating menu category with title: ${data.title}`);
    return await this.prisma.menuCategory.create({
      data: {
        language: data.language as Language,
        title: data.title,
        description: data.description,
        ...(data.isAvailable !== undefined && data.isAvailable !== null && { isAvailable: data.isAvailable }),
        ...(data.imageUrl && { imageUrl: data.imageUrl }),
        position: lastPosition + 1,
      },
    });
  }

  // Update an existing menu category
  async updateMenuCategory(data: UpdateMenuCategoryRequest): Promise<MenuCategory> {
    this.logger.log(`Updating menu category with ID: ${data.id}`);
    return await this.prisma.menuCategory.update({
      where: { id: data.id },
      data: {
        ...(data.language && { language: data.language as Language }),
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.isAvailable !== undefined && data.isAvailable !== null && { isAvailable: data.isAvailable }),
        ...(data.imageUrl && { imageUrl: data.imageUrl }),
      },
    });
  }

  // Delete a menu category by its ID and update positions of remaining categories
  async deleteMenuCategory(
    id: string,
    positionUpdates: Array<{ id: string; position: number }> = [],
  ): Promise<MenuCategory> {
    this.logger.log(`Deleting menu category with ID: ${id}`);
    return await this.prisma.$transaction(async (prisma) => {
      // Delete the category first
      const deletedCategory = await prisma.menuCategory.delete({
        where: { id },
      });

      // Update positions of remaining categories
      for (const update of positionUpdates) {
        await prisma.menuCategory.update({
          where: { id: update.id },
          data: { position: update.position },
        });
      }

      return deletedCategory;
    });
  }

  // Change position of a menu category within a transaction
  async changeMenuCategoryPosition(
    id: string,
    positionUpdates: Array<{ id: string; position: number }>,
  ): Promise<MenuCategory> {
    this.logger.log(`Updating positions for ${positionUpdates.length} categories`);
    return await this.prisma.$transaction(async (prisma) => {
      await Promise.all(
        positionUpdates.map((update) =>
          prisma.menuCategory.update({
            where: { id: update.id },
            data: { position: update.position },
          }),
        ),
      );

      return prisma.menuCategory.findUnique({ where: { id } }) as Promise<MenuCategory>;
    });
  }
}
