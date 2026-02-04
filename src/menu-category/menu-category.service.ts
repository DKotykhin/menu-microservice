import { Injectable, Logger } from '@nestjs/common';

import { AppError } from 'src/utils/errors/app-error';
import { MenuCategoryRepository } from './menu-category.repository';

import type {
  ChangeMenuCategoryPositionRequest,
  CreateMenuCategoryRequest,
  MenuCategory,
  MenuCategoryWithItems,
  StatusResponse,
  UpdateMenuCategoryRequest,
} from 'src/generated-types/menu-category';
import type { Language } from 'prisma/generated-types/enums';

@Injectable()
export class MenuCategoryService {
  constructor(private readonly menuCategoryRepository: MenuCategoryRepository) {}
  protected readonly logger = new Logger(MenuCategoryService.name);

  async getFullMenuByLanguage(language: Language): Promise<MenuCategoryWithItems[]> {
    this.logger.log(`Fetching full menu for language: ${language}`);
    try {
      const categories_with_items = await this.menuCategoryRepository.getMenuCategoriesWithItemsByLanguage(language);
      if (categories_with_items.length === 0) {
        this.logger.warn(`No menu categories found for language: ${language}`);
        throw AppError.notFound('No menu categories found for the specified language');
      }

      return categories_with_items;
    } catch (error) {
      this.logger.error(`Error fetching full menu: ${error instanceof Error ? error.message : error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internalServerError('Failed to fetch full menu');
    }
  }

  async getMenuCategoriesByLanguage(language: Language): Promise<MenuCategory[]> {
    this.logger.log(`Fetching menu categories for language: ${language}`);
    try {
      const categories = await this.menuCategoryRepository.getMenuCategoriesByLanguage(language);
      if (categories.length === 0) {
        this.logger.warn(`No menu categories found for language: ${language}`);
        throw AppError.notFound('No menu categories found for the specified language');
      }
      return categories;
    } catch (error) {
      this.logger.error(`Error fetching menu categories: ${error instanceof Error ? error.message : error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internalServerError('Failed to fetch menu categories');
    }
  }

  async getMenuCategoryById(id: string): Promise<MenuCategory | null> {
    this.logger.log(`Fetching menu category by ID: ${id}`);
    try {
      const category = await this.menuCategoryRepository.getMenuCategoryById(id);
      if (category) {
        this.logger.log(`Menu category found: ${category.title}`);
      } else {
        this.logger.log(`Menu category with ID ${id} not found`);
        throw AppError.notFound('Menu category not found');
      }
      return category;
    } catch (error) {
      this.logger.error(`Error fetching menu category by ID: ${error instanceof Error ? error.message : error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internalServerError('Failed to fetch menu category by ID');
    }
  }

  async createMenuCategory(data: CreateMenuCategoryRequest): Promise<MenuCategory> {
    this.logger.log(`Creating new menu category: ${data.title}`);
    const existingCategories = await this.menuCategoryRepository.getMenuCategoriesByLanguage(data.language as Language);
    if (existingCategories.some((category) => category.title === data.title)) {
      this.logger.warn(`Menu category with title "${data.title}" already exists`);
      throw AppError.conflict(`Menu category with title "${data.title}" already exists`);
    }
    const lastPosition =
      existingCategories.length > 0 ? Math.max(...existingCategories.map((category) => category.position)) : 0;
    try {
      const newCategory = await this.menuCategoryRepository.createMenuCategory({
        data,
        lastPosition,
      });
      this.logger.log(`Menu category created with position: ${newCategory.position}`);
      return newCategory;
    } catch (error) {
      this.logger.error(`Error creating menu category: ${error instanceof Error ? error.message : error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internalServerError('Failed to create menu category');
    }
  }

  async updateMenuCategory(data: UpdateMenuCategoryRequest): Promise<MenuCategory> {
    this.logger.log(`Updating menu category with title: ${data.title}`);
    try {
      const existingCategory = await this.menuCategoryRepository.getMenuCategoryById(data.id);
      if (!existingCategory) {
        this.logger.warn(`Menu category with id ${data.id} not found`);
        throw AppError.notFound(`Menu category with id ${data.id} not found`);
      }
      const updatedCategory = await this.menuCategoryRepository.updateMenuCategory(data);
      this.logger.log(`Menu category with title ${data.title} updated successfully`);
      return updatedCategory;
    } catch (error) {
      this.logger.error(`Error updating menu category: ${error instanceof Error ? error.message : error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internalServerError('Failed to update menu category');
    }
  }

  async changeMenuCategoryPosition(data: ChangeMenuCategoryPositionRequest): Promise<MenuCategory> {
    const { id, position } = data;
    this.logger.log(`Changing position of menu category with ID: ${id} to new position: ${position}`);
    try {
      // Fetch the category to update
      const categoryToUpdate = await this.menuCategoryRepository.getMenuCategoryById(id);
      if (!categoryToUpdate) {
        this.logger.warn(`Menu category with ID ${id} not found`);
        throw AppError.notFound('Menu category not found');
      }
      if (categoryToUpdate.position === position) {
        this.logger.log(`Menu category with ID ${id} is already at position ${position}`);
        return categoryToUpdate; // No change needed
      }

      // Fetch all categories in the same language
      const categories = await this.menuCategoryRepository.getMenuCategoriesByLanguage(categoryToUpdate.language);

      // Calculate position updates (business logic)
      const positionUpdates = this.calculatePositionUpdates(categories, categoryToUpdate, position);

      // Delegate database transaction to repository
      const updatedCategory = await this.menuCategoryRepository.changeMenuCategoryPosition(id, positionUpdates);

      this.logger.log(`Menu category position updated successfully to ${position}`);
      return updatedCategory;
    } catch (error) {
      this.logger.error(`Error changing menu category position: ${error instanceof Error ? error.message : error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internalServerError('Failed to change menu category position');
    }
  }

  // Business logic: calculate which categories need position updates
  private calculatePositionUpdates(
    categories: MenuCategory[],
    categoryToUpdate: MenuCategory,
    newPosition: number,
  ): Array<{ id: string; position: number }> {
    return categories
      .map((category) => {
        if (category.id === categoryToUpdate.id) {
          return { id: category.id, position: newPosition };
        }
        if (categoryToUpdate.position < newPosition) {
          // Moving down
          if (category.position > categoryToUpdate.position && category.position <= newPosition) {
            return { id: category.id, position: category.position - 1 };
          }
        } else if (categoryToUpdate.position > newPosition) {
          // Moving up
          if (category.position < categoryToUpdate.position && category.position >= newPosition) {
            return { id: category.id, position: category.position + 1 };
          }
        }
        return { id: category.id, position: category.position };
      })
      .filter((update) => {
        const original = categories.find((c) => c.id === update.id);
        return original && original.position !== update.position;
      });
  }

  async deleteMenuCategory(id: string): Promise<StatusResponse> {
    this.logger.log(`Deleting menu category with ID: ${id}`);
    try {
      // Fetch the category to get its position and language
      const categoryToDelete = await this.menuCategoryRepository.getMenuCategoryById(id);
      if (!categoryToDelete) {
        this.logger.warn(`Menu category with ID ${id} not found`);
        throw AppError.notFound(`Menu category with ID ${id} not found`);
      }

      // Fetch all categories in the same language
      const categories = await this.menuCategoryRepository.getMenuCategoriesByLanguage(categoryToDelete.language);

      // Calculate position updates for categories with higher positions
      const positionUpdates = categories
        .filter((category) => category.position > categoryToDelete.position)
        .map((category) => ({ id: category.id, position: category.position - 1 }));

      await this.menuCategoryRepository.deleteMenuCategory(id, positionUpdates);
      this.logger.log(`Menu category with ID ${id} deleted successfully`);
      return { success: true, message: 'Menu category deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting menu category: ${error instanceof Error ? error.message : error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internalServerError('Failed to delete menu category');
    }
  }
}
