import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { MENU_CATEGORY_SERVICE_NAME } from 'src/generated-types/menu-category';
import { MenuCategoryService } from './menu-category.service';
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
import type { Language } from 'prisma/generated-types/enums';

@Controller()
export class MenuCategoryController {
  private readonly logger = new Logger(MenuCategoryController.name);
  constructor(private readonly menuCategoryService: MenuCategoryService) {}

  // ---- Menu Category Retrieval ---- //

  @GrpcMethod(MENU_CATEGORY_SERVICE_NAME, 'GetFullMenuByLanguage')
  async getFullMenuByLanguage({ language }: { language: Language }): Promise<MenuCategoryListWithItems> {
    this.logger.log(`Received request for full menu with language: ${language}`);
    const { data } = await this.menuCategoryService.getFullMenuByLanguage(language);
    this.logger.log(`Returning full menu with ${data.length} categories for language: ${language}`);
    return { data };
  }

  @GrpcMethod(MENU_CATEGORY_SERVICE_NAME, 'GetMenuCategoriesByLanguage')
  async getMenuCategoriesByLanguage({ language }: { language: Language }): Promise<MenuCategoryListWithTranslation> {
    this.logger.log(`Received request for menu categories with language: ${language}`);
    const { data } = await this.menuCategoryService.getMenuCategoriesByLanguage(language);
    this.logger.log(`Returning ${data.length} categories for language: ${language}`);
    return { data };
  }

  @GrpcMethod(MENU_CATEGORY_SERVICE_NAME, 'GetMenuCategoryById')
  async getMenuCategoryById({ id }: { id: string }): Promise<MenuCategoryWithTranslation> {
    this.logger.log(`Received request for menu category with ID: ${id}`);
    const data = await this.menuCategoryService.getMenuCategoryById(id);
    this.logger.log(`Returning menu category with ID: ${id}`);
    return data;
  }

  // ---- Menu Category Management ---- //

  @GrpcMethod(MENU_CATEGORY_SERVICE_NAME, 'CreateMenuCategory')
  async createMenuCategory(data: CreateMenuCategoryRequest): Promise<MenuCategory> {
    this.logger.log(`Received request to create menu category with title: ${data.slug}`);
    return this.menuCategoryService.createMenuCategory(data);
  }

  @GrpcMethod(MENU_CATEGORY_SERVICE_NAME, 'UpdateMenuCategory')
  async updateMenuCategory(data: UpdateMenuCategoryRequest): Promise<MenuCategory> {
    this.logger.log(`Received request to update menu category with ID: ${data.id}`);
    return this.menuCategoryService.updateMenuCategory(data);
  }

  @GrpcMethod(MENU_CATEGORY_SERVICE_NAME, 'ChangeMenuCategoryPosition')
  async changeMenuCategoryPosition(data: ChangeMenuCategoryPositionRequest): Promise<MenuCategory> {
    this.logger.log(`Received request to change position of menu category with ID: ${data.id}`);
    return this.menuCategoryService.changeMenuCategoryPosition(data);
  }

  @GrpcMethod(MENU_CATEGORY_SERVICE_NAME, 'DeleteMenuCategory')
  async deleteMenuCategory({ id }: { id: string }): Promise<StatusResponse> {
    this.logger.log(`Received request to delete menu category with ID: ${id}`);
    return this.menuCategoryService.deleteMenuCategory(id);
  }

  // ---- Menu Category Translations ---- //

  @GrpcMethod(MENU_CATEGORY_SERVICE_NAME, 'CreateMenuCategoryTranslation')
  async createMenuCategoryTranslation(data: CreateMenuCategoryTranslationRequest): Promise<MenuCategoryTranslation> {
    this.logger.log(`Received request to create menu category translation for category ID: ${data.categoryId}`);
    return await this.menuCategoryService.createMenuCategoryTranslation(data);
  }

  @GrpcMethod(MENU_CATEGORY_SERVICE_NAME, 'UpdateMenuCategoryTranslation')
  async updateMenuCategoryTranslation(data: UpdateMenuCategoryTranslationRequest): Promise<MenuCategoryTranslation> {
    this.logger.log(`Received request to update menu category translation with ID: ${data.id}`);
    return await this.menuCategoryService.updateMenuCategoryTranslation(data);
  }

  @GrpcMethod(MENU_CATEGORY_SERVICE_NAME, 'DeleteMenuCategoryTranslation')
  async deleteMenuCategoryTranslation({ id }: { id: string }): Promise<StatusResponse> {
    this.logger.log(`Received request to delete menu category translation with ID: ${id}`);
    return await this.menuCategoryService.deleteMenuCategoryTranslation(id);
  }
}
