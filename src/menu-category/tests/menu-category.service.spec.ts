import { Test, TestingModule } from '@nestjs/testing';

import { MenuCategoryService } from '../menu-category.service';
import { MenuCategoryRepository } from '../menu-category.repository';
import { AppError } from 'src/utils/errors/app-error';

const mockRepository = {
  getMenuCategoriesWithItemsByLanguage: jest.fn(),
  getMenuCategoriesByLanguage: jest.fn(),
  getMenuCategoryById: jest.fn(),
  createMenuCategory: jest.fn(),
  updateMenuCategory: jest.fn(),
  deleteMenuCategory: jest.fn(),
  changeMenuCategoryPosition: jest.fn(),
};

describe('MenuCategoryService', () => {
  let service: MenuCategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MenuCategoryService, { provide: MenuCategoryRepository, useValue: mockRepository }],
    }).compile();

    service = module.get<MenuCategoryService>(MenuCategoryService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFullMenuByLanguage', () => {
    it('should return menu categories with items for a language', async () => {
      const mockCategories = [
        { id: '1', title: 'Category 1', menuItems: [{ id: 'item-1' }] },
        { id: '2', title: 'Category 2', menuItems: [] },
      ];
      mockRepository.getMenuCategoriesWithItemsByLanguage.mockResolvedValue(mockCategories);

      const result = await service.getFullMenuByLanguage('UA' as never);

      expect(mockRepository.getMenuCategoriesWithItemsByLanguage).toHaveBeenCalledWith('UA');
      expect(result).toEqual(mockCategories);
    });

    it('should throw AppError.notFound when no categories found', async () => {
      mockRepository.getMenuCategoriesWithItemsByLanguage.mockResolvedValue([]);

      await expect(service.getFullMenuByLanguage('UA' as never)).rejects.toThrow(AppError);
      await expect(service.getFullMenuByLanguage('UA' as never)).rejects.toMatchObject({
        error: { message: 'No menu categories found for the specified language' },
      });
    });

    it('should throw AppError.internalServerError on unexpected error', async () => {
      mockRepository.getMenuCategoriesWithItemsByLanguage.mockRejectedValue(new Error('DB error'));

      await expect(service.getFullMenuByLanguage('UA' as never)).rejects.toThrow(AppError);
      await expect(service.getFullMenuByLanguage('UA' as never)).rejects.toMatchObject({
        error: { message: 'Failed to fetch full menu' },
      });
    });
  });

  describe('getMenuCategoriesByLanguage', () => {
    it('should return menu categories for a language', async () => {
      const mockCategories = [
        { id: '1', title: 'Category 1' },
        { id: '2', title: 'Category 2' },
      ];
      mockRepository.getMenuCategoriesByLanguage.mockResolvedValue(mockCategories);

      const result = await service.getMenuCategoriesByLanguage('EN' as never);

      expect(mockRepository.getMenuCategoriesByLanguage).toHaveBeenCalledWith('EN');
      expect(result).toEqual(mockCategories);
    });

    it('should throw AppError.notFound when no categories found', async () => {
      mockRepository.getMenuCategoriesByLanguage.mockResolvedValue([]);

      await expect(service.getMenuCategoriesByLanguage('EN' as never)).rejects.toThrow(AppError);
      await expect(service.getMenuCategoriesByLanguage('EN' as never)).rejects.toMatchObject({
        error: { message: 'No menu categories found for the specified language' },
      });
    });

    it('should throw AppError.internalServerError on unexpected error', async () => {
      mockRepository.getMenuCategoriesByLanguage.mockRejectedValue(new Error('DB error'));

      await expect(service.getMenuCategoriesByLanguage('EN' as never)).rejects.toThrow(AppError);
      await expect(service.getMenuCategoriesByLanguage('EN' as never)).rejects.toMatchObject({
        error: { message: 'Failed to fetch menu categories' },
      });
    });
  });

  describe('getMenuCategoryById', () => {
    it('should return a menu category by ID', async () => {
      const mockCategory = { id: '1', title: 'Test Category' };
      mockRepository.getMenuCategoryById.mockResolvedValue(mockCategory);

      const result = await service.getMenuCategoryById('1');

      expect(mockRepository.getMenuCategoryById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockCategory);
    });

    it('should throw AppError.notFound when category not found', async () => {
      mockRepository.getMenuCategoryById.mockResolvedValue(null);

      await expect(service.getMenuCategoryById('non-existent')).rejects.toThrow(AppError);
      await expect(service.getMenuCategoryById('non-existent')).rejects.toMatchObject({
        error: { message: 'Menu category not found' },
      });
    });

    it('should throw AppError.internalServerError on unexpected error', async () => {
      mockRepository.getMenuCategoryById.mockRejectedValue(new Error('DB error'));

      await expect(service.getMenuCategoryById('1')).rejects.toThrow(AppError);
      await expect(service.getMenuCategoryById('1')).rejects.toMatchObject({
        error: { message: 'Failed to fetch menu category by ID' },
      });
    });
  });

  describe('createMenuCategory', () => {
    it('should create a new menu category', async () => {
      const createData = { language: 'UA', title: 'New Category', description: 'Desc' };
      const mockCreatedCategory = { id: '1', ...createData, position: 1 };

      mockRepository.getMenuCategoriesByLanguage.mockResolvedValue([]);
      mockRepository.createMenuCategory.mockResolvedValue(mockCreatedCategory);

      const result = await service.createMenuCategory(createData);

      expect(mockRepository.getMenuCategoriesByLanguage).toHaveBeenCalledWith('UA');
      expect(mockRepository.createMenuCategory).toHaveBeenCalledWith({
        data: createData,
        lastPosition: 0,
      });
      expect(result).toEqual(mockCreatedCategory);
    });

    it('should calculate correct position when categories exist', async () => {
      const createData = { language: 'UA', title: 'New Category', description: 'Desc' };
      const existingCategories = [
        { id: '1', title: 'Existing 1', position: 1 },
        { id: '2', title: 'Existing 2', position: 3 },
      ];
      const mockCreatedCategory = { id: '3', ...createData, position: 4 };

      mockRepository.getMenuCategoriesByLanguage.mockResolvedValue(existingCategories);
      mockRepository.createMenuCategory.mockResolvedValue(mockCreatedCategory);

      const result = await service.createMenuCategory(createData);

      expect(mockRepository.createMenuCategory).toHaveBeenCalledWith({
        data: createData,
        lastPosition: 3,
      });
      expect(result).toEqual(mockCreatedCategory);
    });

    it('should throw AppError.conflict when category with same title exists', async () => {
      const createData = { language: 'UA', title: 'Existing Category', description: 'Desc' };
      const existingCategories = [{ id: '1', title: 'Existing Category', position: 1 }];

      mockRepository.getMenuCategoriesByLanguage.mockResolvedValue(existingCategories);

      await expect(service.createMenuCategory(createData)).rejects.toThrow(AppError);
      await expect(service.createMenuCategory(createData)).rejects.toMatchObject({
        error: { message: 'Menu category with title "Existing Category" already exists' },
      });
      expect(mockRepository.createMenuCategory).not.toHaveBeenCalled();
    });

    it('should throw AppError.internalServerError on unexpected error', async () => {
      const createData = { language: 'UA', title: 'New Category', description: 'Desc' };

      mockRepository.getMenuCategoriesByLanguage.mockResolvedValue([]);
      mockRepository.createMenuCategory.mockRejectedValue(new Error('DB error'));

      await expect(service.createMenuCategory(createData)).rejects.toThrow(AppError);
      await expect(service.createMenuCategory(createData)).rejects.toMatchObject({
        error: { message: 'Failed to create menu category' },
      });
    });
  });

  describe('updateMenuCategory', () => {
    it('should update a menu category', async () => {
      const updateData = { id: '1', title: 'Updated Title' };
      const mockUpdatedCategory = { id: '1', title: 'Updated Title' };

      mockRepository.updateMenuCategory.mockResolvedValue(mockUpdatedCategory);

      const result = await service.updateMenuCategory(updateData);

      expect(mockRepository.updateMenuCategory).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockUpdatedCategory);
    });

    it('should throw AppError.internalServerError on error', async () => {
      const updateData = { id: '1', title: 'Updated Title' };

      mockRepository.updateMenuCategory.mockRejectedValue(new Error('DB error'));

      await expect(service.updateMenuCategory(updateData)).rejects.toThrow(AppError);
      await expect(service.updateMenuCategory(updateData)).rejects.toMatchObject({
        error: { message: 'Failed to update menu category' },
      });
    });
  });

  describe('changeMenuCategoryPosition', () => {
    it('should change category position moving down', async () => {
      const categoryToUpdate = { id: '1', title: 'Category 1', position: 1, language: 'UA' };
      const categories = [
        { id: '1', title: 'Category 1', position: 1 },
        { id: '2', title: 'Category 2', position: 2 },
        { id: '3', title: 'Category 3', position: 3 },
      ];
      const updatedCategory = { id: '1', title: 'Category 1', position: 3 };

      mockRepository.getMenuCategoryById.mockResolvedValue(categoryToUpdate);
      mockRepository.getMenuCategoriesByLanguage.mockResolvedValue(categories);
      mockRepository.changeMenuCategoryPosition.mockResolvedValue(updatedCategory);

      const result = await service.changeMenuCategoryPosition({ id: '1', position: 3 });

      expect(mockRepository.getMenuCategoryById).toHaveBeenCalledWith('1');
      expect(mockRepository.getMenuCategoriesByLanguage).toHaveBeenCalledWith('UA');
      expect(mockRepository.changeMenuCategoryPosition).toHaveBeenCalledWith('1', [
        { id: '1', position: 3 },
        { id: '2', position: 1 },
        { id: '3', position: 2 },
      ]);
      expect(result).toEqual(updatedCategory);
    });

    it('should change category position moving up', async () => {
      const categoryToUpdate = { id: '3', title: 'Category 3', position: 3, language: 'UA' };
      const categories = [
        { id: '1', title: 'Category 1', position: 1 },
        { id: '2', title: 'Category 2', position: 2 },
        { id: '3', title: 'Category 3', position: 3 },
      ];
      const updatedCategory = { id: '3', title: 'Category 3', position: 1 };

      mockRepository.getMenuCategoryById.mockResolvedValue(categoryToUpdate);
      mockRepository.getMenuCategoriesByLanguage.mockResolvedValue(categories);
      mockRepository.changeMenuCategoryPosition.mockResolvedValue(updatedCategory);

      const result = await service.changeMenuCategoryPosition({ id: '3', position: 1 });

      expect(mockRepository.changeMenuCategoryPosition).toHaveBeenCalledWith('3', [
        { id: '1', position: 2 },
        { id: '2', position: 3 },
        { id: '3', position: 1 },
      ]);
      expect(result).toEqual(updatedCategory);
    });

    it('should throw AppError.notFound when category not found', async () => {
      mockRepository.getMenuCategoryById.mockResolvedValue(null);

      await expect(service.changeMenuCategoryPosition({ id: 'non-existent', position: 1 })).rejects.toThrow(AppError);
      await expect(service.changeMenuCategoryPosition({ id: 'non-existent', position: 1 })).rejects.toMatchObject({
        error: { message: 'Menu category not found' },
      });
    });

    it('should throw AppError.internalServerError on unexpected error', async () => {
      const categoryToUpdate = { id: '1', title: 'Category 1', position: 1, language: 'UA' };

      mockRepository.getMenuCategoryById.mockResolvedValue(categoryToUpdate);
      mockRepository.getMenuCategoriesByLanguage.mockRejectedValue(new Error('DB error'));

      await expect(service.changeMenuCategoryPosition({ id: '1', position: 2 })).rejects.toThrow(AppError);
      await expect(service.changeMenuCategoryPosition({ id: '1', position: 2 })).rejects.toMatchObject({
        error: { message: 'Failed to change menu category position' },
      });
    });
  });

  describe('deleteMenuCategory', () => {
    it('should delete a menu category and return success response', async () => {
      const categoryToDelete = { id: '1', title: 'Category 1', position: 2, language: 'UA' };
      const categories = [
        { id: '1', title: 'Category 1', position: 2 },
        { id: '2', title: 'Category 2', position: 1 },
        { id: '3', title: 'Category 3', position: 3 },
      ];

      mockRepository.getMenuCategoryById.mockResolvedValue(categoryToDelete);
      mockRepository.getMenuCategoriesByLanguage.mockResolvedValue(categories);
      mockRepository.deleteMenuCategory.mockResolvedValue({ id: '1' });

      const result = await service.deleteMenuCategory('1');

      expect(mockRepository.getMenuCategoryById).toHaveBeenCalledWith('1');
      expect(mockRepository.getMenuCategoriesByLanguage).toHaveBeenCalledWith('UA');
      expect(mockRepository.deleteMenuCategory).toHaveBeenCalledWith('1', [{ id: '3', position: 2 }]);
      expect(result).toEqual({ success: true, message: 'Menu category deleted successfully' });
    });

    it('should delete a menu category without position updates when it is the last one', async () => {
      const categoryToDelete = { id: '1', title: 'Category 1', position: 3, language: 'UA' };
      const categories = [
        { id: '1', title: 'Category 1', position: 3 },
        { id: '2', title: 'Category 2', position: 1 },
        { id: '3', title: 'Category 3', position: 2 },
      ];

      mockRepository.getMenuCategoryById.mockResolvedValue(categoryToDelete);
      mockRepository.getMenuCategoriesByLanguage.mockResolvedValue(categories);
      mockRepository.deleteMenuCategory.mockResolvedValue({ id: '1' });

      const result = await service.deleteMenuCategory('1');

      expect(mockRepository.deleteMenuCategory).toHaveBeenCalledWith('1', []);
      expect(result).toEqual({ success: true, message: 'Menu category deleted successfully' });
    });

    it('should throw AppError.notFound when category not found', async () => {
      mockRepository.getMenuCategoryById.mockResolvedValue(null);

      await expect(service.deleteMenuCategory('non-existent')).rejects.toThrow(AppError);
      await expect(service.deleteMenuCategory('non-existent')).rejects.toMatchObject({
        error: { message: 'Menu category with ID non-existent not found' },
      });
    });

    it('should throw AppError.internalServerError on error', async () => {
      const categoryToDelete = { id: '1', title: 'Category 1', position: 1, language: 'UA' };

      mockRepository.getMenuCategoryById.mockResolvedValue(categoryToDelete);
      mockRepository.getMenuCategoriesByLanguage.mockRejectedValue(new Error('DB error'));

      await expect(service.deleteMenuCategory('1')).rejects.toThrow(AppError);
      await expect(service.deleteMenuCategory('1')).rejects.toMatchObject({
        error: { message: 'Failed to delete menu category' },
      });
    });
  });
});
