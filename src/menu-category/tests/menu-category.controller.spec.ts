import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

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
  createMenuCategoryTranslation: jest.fn(),
  updateMenuCategoryTranslation: jest.fn(),
  deleteMenuCategoryTranslation: jest.fn(),
};

describe('MenuCategoryController', () => {
  let controller: MenuCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuCategoryController],
      providers: [
        { provide: MenuCategoryService, useValue: mockService },
        { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
      ],
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
        {
          id: '1',
          slug: 'coffee',
          position: 1,
          translations: [{ id: 't1', language: 'UA', title: 'Кава' }],
          menuItems: [{ id: 'item-1', slug: 'espresso', translations: [] }],
        },
      ];
      mockService.getFullMenuByLanguage.mockResolvedValue({ categories: mockCategories });

      const result = await controller.getFullMenuByLanguage({ language: 'UA' as never });

      expect(mockService.getFullMenuByLanguage).toHaveBeenCalledWith('UA');
      expect(result).toEqual({ categories: mockCategories });
    });

    it('should return empty categories when no categories found', async () => {
      mockService.getFullMenuByLanguage.mockResolvedValue({ categories: [] });

      const result = await controller.getFullMenuByLanguage({ language: 'UA' as never });

      expect(result).toEqual({ categories: [] });
    });
  });

  describe('getMenuCategoriesByLanguage', () => {
    it('should return menu categories wrapped in data property', async () => {
      const mockCategories = [
        { id: '1', slug: 'coffee', position: 1, translations: [{ id: 't1', language: 'EN', title: 'Coffee' }] },
        { id: '2', slug: 'tea', position: 2, translations: [{ id: 't2', language: 'EN', title: 'Tea' }] },
      ];
      mockService.getMenuCategoriesByLanguage.mockResolvedValue({ data: mockCategories });

      const result = await controller.getMenuCategoriesByLanguage({ language: 'EN' as never });

      expect(mockService.getMenuCategoriesByLanguage).toHaveBeenCalledWith('EN');
      expect(result).toEqual({ data: mockCategories });
    });

    it('should return empty data when no categories found', async () => {
      mockService.getMenuCategoriesByLanguage.mockResolvedValue({ data: [] });

      const result = await controller.getMenuCategoriesByLanguage({ language: 'EN' as never });

      expect(result).toEqual({ data: [] });
    });
  });

  describe('getMenuCategoryById', () => {
    it('should return a menu category by ID', async () => {
      const mockCategory = {
        id: '1',
        slug: 'coffee',
        position: 1,
        imageUrl: null,
        isAvailable: true,
        translations: [{ id: 't1', language: 'EN', title: 'Coffee' }],
      };
      mockService.getMenuCategoryById.mockResolvedValue(mockCategory);

      const result = await controller.getMenuCategoryById({ id: '1' });

      expect(mockService.getMenuCategoryById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockCategory);
    });
  });

  describe('createMenuCategory', () => {
    it('should create a menu category and return it', async () => {
      const createData = { slug: 'new-category' };
      const mockCreatedCategory = { id: '1', slug: 'new-category', position: 1, isAvailable: true };
      mockService.createMenuCategory.mockResolvedValue(mockCreatedCategory);

      const result = await controller.createMenuCategory(createData);

      expect(mockService.createMenuCategory).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockCreatedCategory);
    });
  });

  describe('updateMenuCategory', () => {
    it('should update a menu category and return it', async () => {
      const updateData = { id: '1', slug: 'updated-slug' };
      const mockUpdatedCategory = { id: '1', slug: 'updated-slug', position: 1, isAvailable: true };
      mockService.updateMenuCategory.mockResolvedValue(mockUpdatedCategory);

      const result = await controller.updateMenuCategory(updateData);

      expect(mockService.updateMenuCategory).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockUpdatedCategory);
    });
  });

  describe('changeMenuCategoryPosition', () => {
    it('should change category position and return updated category', async () => {
      const positionData = { id: '1', position: 3 };
      const mockUpdatedCategory = { id: '1', slug: 'category', position: 3 };
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

  describe('createMenuCategoryTranslation', () => {
    it('should create a translation and return it', async () => {
      const createData = { title: 'Coffee', description: 'Hot drinks', language: 'EN', categoryId: 'cat-1' };
      const mockTranslation = { id: 't1', ...createData };
      mockService.createMenuCategoryTranslation.mockResolvedValue(mockTranslation);

      const result = await controller.createMenuCategoryTranslation(createData);

      expect(mockService.createMenuCategoryTranslation).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockTranslation);
    });
  });

  describe('updateMenuCategoryTranslation', () => {
    it('should update a translation and return it', async () => {
      const updateData = { id: 't1', title: 'Updated Title', description: 'Updated desc' };
      const mockUpdated = { ...updateData };
      mockService.updateMenuCategoryTranslation.mockResolvedValue(mockUpdated);

      const result = await controller.updateMenuCategoryTranslation(updateData);

      expect(mockService.updateMenuCategoryTranslation).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('deleteMenuCategoryTranslation', () => {
    it('should delete a translation and return status response', async () => {
      const mockResponse = { success: true, message: 'Menu category translation deleted successfully' };
      mockService.deleteMenuCategoryTranslation.mockResolvedValue(mockResponse);

      const result = await controller.deleteMenuCategoryTranslation({ id: 't1' });

      expect(mockService.deleteMenuCategoryTranslation).toHaveBeenCalledWith('t1');
      expect(result).toEqual(mockResponse);
    });
  });
});
