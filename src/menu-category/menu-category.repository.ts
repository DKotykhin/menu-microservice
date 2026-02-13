import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import type { Language } from 'prisma/generated-types/enums';
import type { MenuCategory, Prisma } from 'prisma/generated-types/client';
import type {
  CreateMenuCategoryRequest,
  CreateMenuCategoryTranslationRequest,
  MenuCategoryTranslation,
  UpdateMenuCategoryRequest,
  UpdateMenuCategoryTranslationRequest,
} from 'src/generated-types/menu-category';

const categoryTranslationSelect = {
  id: true,
  language: true,
  title: true,
  description: true,
} satisfies Prisma.MenuCategoryTranslationSelect;

const itemTranslationSelect = {
  id: true,
  language: true,
  title: true,
  description: true,
} satisfies Prisma.MenuItemTranslationSelect;

export type MenuCategoryWithItemsPayload = Prisma.MenuCategoryGetPayload<{
  include: {
    menuCategoryTranslations: { select: typeof categoryTranslationSelect };
    menuItems: {
      include: {
        menuItemTranslations: { select: typeof itemTranslationSelect };
      };
    };
  };
}>;

export type MenuCategoryWithTranslationsPayload = Prisma.MenuCategoryGetPayload<{
  include: {
    menuCategoryTranslations: { select: typeof categoryTranslationSelect };
  };
}>;

@Injectable()
export class MenuCategoryRepository {
  private readonly logger = new Logger(MenuCategoryRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  // ---- Menu Category Retrieval ---- //

  // Fetch all menu categories ordered by position without translations or items
  async getAllMenuCategories(): Promise<MenuCategory[]> {
    this.logger.log('Fetching all menu categories');
    return await this.prisma.menuCategory.findMany({
      orderBy: { position: 'asc' },
    });
  }

  // Fetch all menu categories for a specific language with translations and associated menu items with their translations
  async getMenuCategoriesWithItemsByLanguage(language: Language): Promise<MenuCategoryWithItemsPayload[]> {
    this.logger.log(`Fetching menu categories for language: ${language}`);
    return await this.prisma.menuCategory.findMany({
      orderBy: { position: 'asc' },
      include: {
        menuCategoryTranslations: {
          where: { language },
          select: categoryTranslationSelect,
        },
        menuItems: {
          orderBy: { position: 'asc' },
          include: {
            menuItemTranslations: {
              where: { language },
              select: itemTranslationSelect,
            },
          },
        },
      },
    });
  }

  // Fetch all menu categories for a specific language with translations only (without items)
  async getMenuCategoriesWithTranslations(language: Language): Promise<MenuCategoryWithTranslationsPayload[]> {
    this.logger.log(`Fetching menu categories for language: ${language}`);
    return await this.prisma.menuCategory.findMany({
      orderBy: { position: 'asc' },
      include: {
        menuCategoryTranslations: {
          where: { language },
          select: categoryTranslationSelect,
        },
      },
    });
  }

  // Fetch a single menu category by its ID without translations or items
  async getMenuCategoryById(id: string): Promise<MenuCategory | null> {
    this.logger.log(`Fetching menu category by ID: ${id}`);
    return await this.prisma.menuCategory.findUnique({
      where: { id },
    });
  }

  // Fetch a single menu category by its ID with all translations
  async getMenuCategoryByIdWithTranslations(id: string): Promise<MenuCategoryWithTranslationsPayload | null> {
    this.logger.log(`Fetching menu category by ID with translations: ${id}`);
    return await this.prisma.menuCategory.findUnique({
      where: { id },
      include: {
        menuCategoryTranslations: {
          select: categoryTranslationSelect,
        },
      },
    });
  }

  // Check if a menu category has associated menu items
  async hasMenuItems(categoryId: string): Promise<boolean> {
    const count = await this.prisma.menuItem.count({
      where: { categoryId },
    });
    return count > 0;
  }

  // ---- Menu Category Management ---- //

  // Create a new menu category
  async createMenuCategory({
    data,
    lastPosition,
  }: {
    data: CreateMenuCategoryRequest;
    lastPosition: number;
  }): Promise<MenuCategory> {
    this.logger.log(`Creating menu category with slug: ${data.slug}`);
    return await this.prisma.menuCategory.create({
      data: {
        slug: data.slug,
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
        ...(data.slug !== undefined && data.slug !== null && { slug: data.slug }),
        ...(data.isAvailable !== undefined && data.isAvailable !== null && { isAvailable: data.isAvailable }),
        ...(data.imageUrl !== undefined && data.imageUrl !== null && { imageUrl: data.imageUrl }),
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
      await Promise.all(
        positionUpdates.map((update) =>
          prisma.menuCategory.update({
            where: { id: update.id },
            data: { position: update.position },
          }),
        ),
      );

      return deletedCategory;
    });
  }

  // Change position of a menu category within a transaction
  async changeMenuCategoryPosition(
    id: string,
    positionUpdates: Array<{ id: string; position: number }>,
  ): Promise<MenuCategory | null> {
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

      return await prisma.menuCategory.findUnique({ where: { id } });
    });
  }

  // ---- Menu Category Translations ---- //

  // create a menu category translation
  async createMenuCategoryTranslation({
    title,
    description,
    language,
    categoryId,
  }: CreateMenuCategoryTranslationRequest): Promise<MenuCategoryTranslation> {
    this.logger.log(`Creating menu category translation for category ID: ${categoryId}`);
    return await this.prisma.menuCategoryTranslation.create({
      data: {
        title,
        description,
        language: language as Language,
        categoryId,
      },
    });
  }

  // update a menu category translation
  async updateMenuCategoryTranslation({
    id,
    title,
    description,
  }: UpdateMenuCategoryTranslationRequest): Promise<MenuCategoryTranslation> {
    this.logger.log(`Updating menu category translation with ID: ${id}`);
    return await this.prisma.menuCategoryTranslation.update({
      where: { id },
      data: {
        ...(title !== undefined && title !== null && { title }),
        ...(description !== undefined && description !== null && { description }),
      },
    });
  }

  // delete a menu category translation
  async deleteMenuCategoryTranslation(id: string): Promise<MenuCategoryTranslation> {
    this.logger.log(`Deleting menu category translation with ID: ${id}`);
    return await this.prisma.menuCategoryTranslation.delete({
      where: { id },
    });
  }
}
