import { Injectable, Logger } from '@nestjs/common';

import { AppError } from 'src/utils/errors/app-error';
import { MenuCategoryRepository } from './menu-category.repository';
import { toMenuCategory, toMenuCategoryWithItems, toMenuCategoryWithTranslation } from './menu-category.mapper';

import { Language } from 'prisma/generated-types/enums';
import type {
  ChangeMenuCategoryPositionRequest,
  CreateMenuCategoryRequest,
  CreateMenuCategoryTranslationRequest,
  MenuCategory,
  MenuCategoryListWithItems,
  MenuCategoryListWithTranslation,
  MenuCategoryTranslation,
  MenuCategoryWithTranslation,
  StatusResponse,
  UpdateMenuCategoryRequest,
  UpdateMenuCategoryTranslationRequest,
} from 'src/generated-types/menu-category';

@Injectable()
export class MenuCategoryService {
  private readonly logger = new Logger(MenuCategoryService.name);
  constructor(private readonly menuCategoryRepository: MenuCategoryRepository) {}

  // ---- Menu Category Retrieval ---- //

  async getFullMenuByLanguage(language: Language): Promise<MenuCategoryListWithItems> {
    this.logger.log(`Fetching full menu for language: ${language}`);
    try {
      this.isValidLanguage(language);
      const categories_with_items = await this.menuCategoryRepository.getMenuCategoriesWithItemsByLanguage(language);
      if (categories_with_items.length === 0) {
        this.logger.warn(`No menu categories found for language: ${language}`);
        return { data: [] }; // Return empty list instead of throwing an error
      }

      return { data: categories_with_items.map(toMenuCategoryWithItems) };
    } catch (error) {
      this.logger.error(`Error fetching full menu: ${error instanceof Error ? error.message : error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internalServerError('Failed to fetch full menu');
    }
  }

  async getMenuCategoriesByLanguage(language: Language): Promise<MenuCategoryListWithTranslation> {
    this.logger.log(`Fetching menu categories for language: ${language}`);
    try {
      this.isValidLanguage(language);
      const categories = await this.menuCategoryRepository.getMenuCategoriesWithTranslations(language);
      if (categories.length === 0) {
        this.logger.warn(`No menu categories found for language: ${language}`);
        return { data: [] }; // Return empty list instead of throwing an error
      }
      return { data: categories.map(toMenuCategoryWithTranslation) };
    } catch (error) {
      this.logger.error(`Error fetching menu categories: ${error instanceof Error ? error.message : error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internalServerError('Failed to fetch menu categories');
    }
  }

  async getMenuCategoryById(id: string): Promise<MenuCategoryWithTranslation> {
    this.logger.log(`Fetching menu category by ID: ${id}`);
    try {
      const category = await this.menuCategoryRepository.getMenuCategoryByIdWithTranslations(id);
      if (category) {
        this.logger.log(`Menu category found: ${category.slug}`);
      } else {
        this.logger.log(`Menu category with ID ${id} not found`);
        throw AppError.notFound('Menu category not found');
      }
      return toMenuCategoryWithTranslation(category);
    } catch (error) {
      this.logger.error(`Error fetching menu category by ID: ${error instanceof Error ? error.message : error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internalServerError('Failed to fetch menu category by ID');
    }
  }

  // ---- Menu Category Management ---- //

  async createMenuCategory(data: CreateMenuCategoryRequest): Promise<MenuCategory> {
    this.logger.log(`Creating new menu category with slug: ${data.slug}`);
    try {
      const allCategories = await this.menuCategoryRepository.getAllMenuCategories();
      if (allCategories.some((category) => category.slug === data.slug)) {
        this.logger.warn(`Menu category with slug "${data.slug}" already exists`);
        throw AppError.conflict(`Menu category with slug "${data.slug}" already exists`);
      }
      const lastPosition =
        allCategories.length > 0 ? Math.max(...allCategories.map((category) => category.position)) : 0;
      const newCategory = await this.menuCategoryRepository.createMenuCategory({
        data,
        lastPosition,
      });
      this.logger.log(`Menu category created with position: ${newCategory.position}`);
      return toMenuCategory(newCategory);
    } catch (error) {
      this.logger.error(`Error creating menu category: ${error instanceof Error ? error.message : error}`);
      if (error instanceof AppError) throw error;
      if (error instanceof Error && 'code' in error && (error as Record<string, unknown>).code === 'P2002') {
        throw AppError.conflict(`Menu category with slug "${data.slug}" already exists`);
      }
      throw AppError.internalServerError('Failed to create menu category');
    }
  }

  async updateMenuCategory(data: UpdateMenuCategoryRequest): Promise<MenuCategory> {
    this.logger.log(`Updating menu category with ID: ${data.id}`);
    try {
      const existingCategory = await this.menuCategoryRepository.getMenuCategoryById(data.id);
      if (!existingCategory) {
        this.logger.warn(`Menu category with id ${data.id} not found`);
        throw AppError.notFound(`Menu category with id ${data.id} not found`);
      }
      const updatedCategory = await this.menuCategoryRepository.updateMenuCategory(data);
      this.logger.log(`Menu category with ID ${data.id} updated successfully`);
      return toMenuCategory(updatedCategory);
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
        return toMenuCategory(categoryToUpdate); // No change needed
      }

      // Fetch all categories
      const categories = await this.menuCategoryRepository.getAllMenuCategories();

      // Validate position bounds
      if (position < 1 || position > categories.length) {
        this.logger.warn(`Invalid position ${position}. Must be between 1 and ${categories.length}`);
        throw AppError.badRequest(`Position must be between 1 and ${categories.length}`);
      }

      // Calculate position updates (business logic)
      const positionUpdates = this.calculatePositionUpdates(categories, categoryToUpdate, position);

      // Delegate database transaction to repository
      const updatedCategory = await this.menuCategoryRepository.changeMenuCategoryPosition(id, positionUpdates);

      if (!updatedCategory) {
        this.logger.warn(`Menu category with ID ${id} not found after position update`);
        throw AppError.notFound('Menu category not found after position update');
      }

      this.logger.log(`Menu category position updated successfully to ${position}`);
      return toMenuCategory(updatedCategory);
    } catch (error) {
      this.logger.error(`Error changing menu category position: ${error instanceof Error ? error.message : error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internalServerError('Failed to change menu category position');
    }
  }

  async deleteMenuCategory(id: string): Promise<StatusResponse> {
    this.logger.log(`Deleting menu category with ID: ${id}`);
    try {
      // Fetch the category to get its position
      const categoryToDelete = await this.menuCategoryRepository.getMenuCategoryById(id);
      if (!categoryToDelete) {
        this.logger.warn(`Menu category with ID ${id} not found`);
        throw AppError.notFound(`Menu category with ID ${id} not found`);
      }

      // Check for associated menu items
      const hasItems = await this.menuCategoryRepository.hasMenuItems(id);
      if (hasItems) {
        this.logger.warn(`Cannot delete menu category with ID ${id}: it has associated menu items`);
        throw AppError.conflict('Cannot delete menu category that has menu items. Remove the items first.');
      }

      // Fetch all categories for position recalculation
      const categories = await this.menuCategoryRepository.getAllMenuCategories();

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

  // ---- Menu Category Translations ---- //

  // create a menu category translation
  async createMenuCategoryTranslation(data: CreateMenuCategoryTranslationRequest): Promise<MenuCategoryTranslation> {
    this.logger.log(`Creating menu category translation for category ID: ${data.categoryId}`);
    try {
      this.isValidLanguage(data.language);
      const translation = await this.menuCategoryRepository.createMenuCategoryTranslation(data);
      this.logger.log(`Menu category translation created successfully for category ID: ${data.categoryId}`);
      return translation;
    } catch (error) {
      this.logger.error(`Error creating menu category translation: ${error instanceof Error ? error.message : error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internalServerError('Failed to create menu category translation');
    }
  }

  // update a menu category translation
  async updateMenuCategoryTranslation(data: UpdateMenuCategoryTranslationRequest): Promise<MenuCategoryTranslation> {
    this.logger.log(`Updating menu category translation with ID: ${data.id}`);
    try {
      const updatedTranslation = await this.menuCategoryRepository.updateMenuCategoryTranslation(data);
      this.logger.log(`Menu category translation with ID ${data.id} updated successfully`);
      return updatedTranslation;
    } catch (error) {
      this.logger.error(`Error updating menu category translation: ${error instanceof Error ? error.message : error}`);
      throw AppError.internalServerError('Failed to update menu category translation');
    }
  }

  // delete a menu category translation
  async deleteMenuCategoryTranslation(id: string): Promise<StatusResponse> {
    this.logger.log(`Deleting menu category translation with ID: ${id}`);
    try {
      await this.menuCategoryRepository.deleteMenuCategoryTranslation(id);
      this.logger.log(`Menu category translation with ID ${id} deleted successfully`);
      return { success: true, message: 'Menu category translation deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting menu category translation: ${error instanceof Error ? error.message : error}`);
      throw AppError.internalServerError('Failed to delete menu category translation');
    }
  }

  // ---- Business logic ---- //

  // calculate which categories need position updates
  private calculatePositionUpdates(
    categories: Array<{ id: string; position: number }>,
    categoryToUpdate: { id: string; position: number },
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

  // Check if language is valid
  private isValidLanguage(language: string): void {
    const validLanguages = Object.values(Language);
    // return validLanguages.includes(language as Language);
    if (!validLanguages.includes(language as Language)) {
      throw AppError.badRequest(`Invalid language: ${language}. Must be one of: ${validLanguages.join(', ')}`);
    }
  }
}
