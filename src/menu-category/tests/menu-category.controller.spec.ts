import { Test, TestingModule } from '@nestjs/testing';

import { MenuCategoryController } from '../menu-category.controller';
import { MenuCategoryService } from '../menu-category.service';

const mockService = {
  getFullMenuByLanguage: jest.fn(),
  getMenuCategoriesByLanguage: jest.fn(),
  getMenuCategoryById: jest.fn(),
  createMenuCategory: jest.fn(),
  updateMenuCategory: jest.fn(),
  changeMenuCategoryPosition: jest.fn(),
  deleteMenuCategory: jest.fn(),
};

describe('MenuCategoryController', () => {
  let controller: MenuCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuCategoryController],
      providers: [{ provide: MenuCategoryService, useValue: mockService }],
    }).compile();

    controller = module.get<MenuCategoryController>(MenuCategoryController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFullMenuByLanguage', () => {
    it('should return menu categories with items wrapped in data property', async () => {
      const mockCategories = [
        { id: '1', title: 'Category 1', menuItems: [{ id: 'item-1' }] },
        { id: '2', title: 'Category 2', menuItems: [] },
      ];
      mockService.getFullMenuByLanguage.mockResolvedValue(mockCategories);

      const result = await controller.getFullMenuByLanguage({ language: 'UA' as never });

      expect(mockService.getFullMenuByLanguage).toHaveBeenCalledWith('UA');
      expect(result).toEqual({ data: mockCategories });
    });
  });

  describe('getMenuCategoriesByLanguage', () => {
    it('should return menu categories wrapped in data property', async () => {
      const mockCategories = [
        { id: '1', title: 'Category 1' },
        { id: '2', title: 'Category 2' },
      ];
      mockService.getMenuCategoriesByLanguage.mockResolvedValue(mockCategories);

      const result = await controller.getMenuCategoriesByLanguage({ language: 'EN' as never });

      expect(mockService.getMenuCategoriesByLanguage).toHaveBeenCalledWith('EN');
      expect(result).toEqual({ data: mockCategories });
    });
  });

  describe('getMenuCategoryById', () => {
    it('should return a menu category by ID', async () => {
      const mockCategory = { id: '1', title: 'Test Category' };
      mockService.getMenuCategoryById.mockResolvedValue(mockCategory);

      const result = await controller.getMenuCategoryById({ id: '1' });

      expect(mockService.getMenuCategoryById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockCategory);
    });
  });

  describe('createMenuCategory', () => {
    it('should create a menu category and return it', async () => {
      const createData = { language: 'UA', title: 'New Category', description: 'Desc' };
      const mockCreatedCategory = { id: '1', ...createData, position: 1 };
      mockService.createMenuCategory.mockResolvedValue(mockCreatedCategory);

      const result = await controller.createMenuCategory(createData);

      expect(mockService.createMenuCategory).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockCreatedCategory);
    });
  });

  describe('updateMenuCategory', () => {
    it('should update a menu category and return it', async () => {
      const updateData = { id: '1', title: 'Updated Title' };
      const mockUpdatedCategory = { id: '1', title: 'Updated Title' };
      mockService.updateMenuCategory.mockResolvedValue(mockUpdatedCategory);

      const result = await controller.updateMenuCategory(updateData);

      expect(mockService.updateMenuCategory).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockUpdatedCategory);
    });
  });

  describe('changeMenuCategoryPosition', () => {
    it('should change category position and return updated category', async () => {
      const positionData = { id: '1', position: 3 };
      const mockUpdatedCategory = { id: '1', title: 'Category', position: 3 };
      mockService.changeMenuCategoryPosition.mockResolvedValue(mockUpdatedCategory);

      const result = await controller.changeMenuCategoryPosition(positionData);

      expect(mockService.changeMenuCategoryPosition).toHaveBeenCalledWith(positionData);
      expect(result).toEqual(mockUpdatedCategory);
    });
  });

  describe('deleteMenuCategory', () => {
    it('should delete a menu category and return status response', async () => {
      const mockResponse = { success: true, message: 'Menu category deleted successfully' };
      mockService.deleteMenuCategory.mockResolvedValue(mockResponse);

      const result = await controller.deleteMenuCategory({ id: '1' });

      expect(mockService.deleteMenuCategory).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResponse);
    });
  });
});
