import { Test, TestingModule } from '@nestjs/testing';

import { MenuCategoryService } from '../menu-category.service';
import { MenuCategoryRepository } from '../menu-category.repository';
import { AppError } from 'src/utils/errors/app-error';

const mockRepository = {
  getAllMenuCategories: jest.fn(),
  getMenuCategoriesWithItemsByLanguage: jest.fn(),
  getMenuCategoriesWithTranslations: jest.fn(),
  getMenuCategoryById: jest.fn(),
  getMenuCategoryByIdWithTranslations: jest.fn(),
  createMenuCategory: jest.fn(),
  updateMenuCategory: jest.fn(),
  deleteMenuCategory: jest.fn(),
  changeMenuCategoryPosition: jest.fn(),
  hasMenuItems: jest.fn(),
  createMenuCategoryTranslation: jest.fn(),
  updateMenuCategoryTranslation: jest.fn(),
  deleteMenuCategoryTranslation: jest.fn(),
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
    it('should return mapped menu categories with items for a language', async () => {
      const mockRepoCategories = [
        {
          id: '1',
          slug: 'coffee',
          position: 1,
          imageUrl: null,
          isAvailable: true,
          menuCategoryTranslations: [{ id: 't1', language: 'UA', title: 'Кава', description: null }],
          menuItems: [
            {
              id: 'item-1',
              slug: 'espresso',
              price: '3.50',
              imageUrl: null,
              isAvailable: true,
              position: 1,
              menuItemTranslations: [{ id: 'it1', language: 'UA', title: 'Еспресо', description: null }],
            },
          ],
        },
      ];
      mockRepository.getMenuCategoriesWithItemsByLanguage.mockResolvedValue(mockRepoCategories);

      const result = await service.getFullMenuByLanguage('UA' as never);

      expect(mockRepository.getMenuCategoriesWithItemsByLanguage).toHaveBeenCalledWith('UA');
      expect(result).toEqual({
        categories: [
          {
            id: '1',
            slug: 'coffee',
            position: 1,
            imageUrl: null,
            isAvailable: true,
            language: 'UA',
            title: 'Кава',
            description: '',
            menuItems: [
              {
                id: 'item-1',
                slug: 'espresso',
                price: '3.50',
                imageUrl: null,
                isAvailable: true,
                position: 1,
                language: 'UA',
                title: 'Еспресо',
                description: '',
              },
            ],
          },
        ],
      });
    });

    it('should return empty data when no categories found', async () => {
      mockRepository.getMenuCategoriesWithItemsByLanguage.mockResolvedValue([]);

      const result = await service.getFullMenuByLanguage('UA' as never);

      expect(result).toEqual({ categories: [] });
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
    it('should return mapped menu categories with translations for a language', async () => {
      const mockRepoCategories = [
        {
          id: '1',
          slug: 'coffee',
          position: 1,
          imageUrl: null,
          isAvailable: true,
          menuCategoryTranslations: [{ id: 't1', language: 'EN', title: 'Coffee', description: null }],
        },
      ];
      mockRepository.getMenuCategoriesWithTranslations.mockResolvedValue(mockRepoCategories);

      const result = await service.getMenuCategoriesByLanguage('EN' as never);

      expect(mockRepository.getMenuCategoriesWithTranslations).toHaveBeenCalledWith('EN');
      expect(result).toEqual({
        data: [
          {
            id: '1',
            slug: 'coffee',
            position: 1,
            imageUrl: null,
            isAvailable: true,
            translations: [{ id: 't1', language: 'EN', title: 'Coffee', description: null }],
          },
        ],
      });
    });

    it('should return empty data when no categories found', async () => {
      mockRepository.getMenuCategoriesWithTranslations.mockResolvedValue([]);

      const result = await service.getMenuCategoriesByLanguage('EN' as never);

      expect(result).toEqual({ data: [] });
    });

    it('should throw AppError.internalServerError on unexpected error', async () => {
      mockRepository.getMenuCategoriesWithTranslations.mockRejectedValue(new Error('DB error'));

      await expect(service.getMenuCategoriesByLanguage('EN' as never)).rejects.toThrow(AppError);
      await expect(service.getMenuCategoriesByLanguage('EN' as never)).rejects.toMatchObject({
        error: { message: 'Failed to fetch menu categories' },
      });
    });
  });

  describe('getMenuCategoryById', () => {
    it('should return a mapped menu category by ID', async () => {
      const mockRepoCategory = {
        id: '1',
        slug: 'coffee',
        position: 1,
        imageUrl: null,
        isAvailable: true,
        menuCategoryTranslations: [{ id: 't1', language: 'EN', title: 'Coffee', description: null }],
      };
      mockRepository.getMenuCategoryByIdWithTranslations.mockResolvedValue(mockRepoCategory);

      const result = await service.getMenuCategoryById('1');

      expect(mockRepository.getMenuCategoryByIdWithTranslations).toHaveBeenCalledWith('1');
      expect(result).toEqual({
        id: '1',
        slug: 'coffee',
        position: 1,
        imageUrl: null,
        isAvailable: true,
        translations: [{ id: 't1', language: 'EN', title: 'Coffee', description: null }],
      });
    });

    it('should throw AppError.notFound when category not found', async () => {
      mockRepository.getMenuCategoryByIdWithTranslations.mockResolvedValue(null);

      await expect(service.getMenuCategoryById('non-existent')).rejects.toThrow(AppError);
      await expect(service.getMenuCategoryById('non-existent')).rejects.toMatchObject({
        error: { message: 'Menu category not found' },
      });
    });

    it('should throw AppError.internalServerError on unexpected error', async () => {
      mockRepository.getMenuCategoryByIdWithTranslations.mockRejectedValue(new Error('DB error'));

      await expect(service.getMenuCategoryById('1')).rejects.toThrow(AppError);
      await expect(service.getMenuCategoryById('1')).rejects.toMatchObject({
        error: { message: 'Failed to fetch menu category by ID' },
      });
    });
  });

  describe('createMenuCategory', () => {
    it('should create a new menu category', async () => {
      const createData = { slug: 'new-category' };
      const mockCreatedCategory = {
        id: '1',
        slug: 'new-category',
        position: 1,
        imageUrl: null,
        isAvailable: true,
        createdAt: null,
        updatedAt: null,
      };

      mockRepository.getAllMenuCategories.mockResolvedValue([]);
      mockRepository.createMenuCategory.mockResolvedValue(mockCreatedCategory);

      const result = await service.createMenuCategory(createData);

      expect(mockRepository.getAllMenuCategories).toHaveBeenCalled();
      expect(mockRepository.createMenuCategory).toHaveBeenCalledWith({
        data: createData,
        lastPosition: 0,
      });
      expect(result).toEqual({
        id: '1',
        slug: 'new-category',
        position: 1,
        imageUrl: null,
        isAvailable: true,
        createdAt: null,
        updatedAt: null,
      });
    });

    it('should calculate correct position when categories exist', async () => {
      const createData = { slug: 'new-category' };
      const existingCategories = [
        { id: '1', slug: 'existing-1', position: 1 },
        { id: '2', slug: 'existing-2', position: 3 },
      ];
      const mockCreatedCategory = {
        id: '3',
        slug: 'new-category',
        position: 4,
        imageUrl: null,
        isAvailable: true,
        createdAt: null,
        updatedAt: null,
      };

      mockRepository.getAllMenuCategories.mockResolvedValue(existingCategories);
      mockRepository.createMenuCategory.mockResolvedValue(mockCreatedCategory);

      const result = await service.createMenuCategory(createData);

      expect(mockRepository.createMenuCategory).toHaveBeenCalledWith({
        data: createData,
        lastPosition: 3,
      });
      expect(result.position).toBe(4);
    });

    it('should throw AppError.conflict when category with same slug exists', async () => {
      const createData = { slug: 'existing-category' };
      const existingCategories = [{ id: '1', slug: 'existing-category', position: 1 }];

      mockRepository.getAllMenuCategories.mockResolvedValue(existingCategories);

      await expect(service.createMenuCategory(createData)).rejects.toThrow(AppError);
      await expect(service.createMenuCategory(createData)).rejects.toMatchObject({
        error: { message: 'Menu category with slug "existing-category" already exists' },
      });
      expect(mockRepository.createMenuCategory).not.toHaveBeenCalled();
    });

    it('should throw AppError.conflict on P2002 unique constraint violation', async () => {
      const createData = { slug: 'new-category' };
      const prismaError = new Error('Unique constraint failed');
      Object.assign(prismaError, { code: 'P2002' });

      mockRepository.getAllMenuCategories.mockResolvedValue([]);
      mockRepository.createMenuCategory.mockRejectedValue(prismaError);

      await expect(service.createMenuCategory(createData)).rejects.toThrow(AppError);
      await expect(service.createMenuCategory(createData)).rejects.toMatchObject({
        error: { message: 'Menu category with slug "new-category" already exists' },
      });
    });

    it('should throw AppError.internalServerError on unexpected error', async () => {
      const createData = { slug: 'new-category' };

      mockRepository.getAllMenuCategories.mockResolvedValue([]);
      mockRepository.createMenuCategory.mockRejectedValue(new Error('DB error'));

      await expect(service.createMenuCategory(createData)).rejects.toThrow(AppError);
      await expect(service.createMenuCategory(createData)).rejects.toMatchObject({
        error: { message: 'Failed to create menu category' },
      });
    });
  });

  describe('updateMenuCategory', () => {
    it('should update a menu category', async () => {
      const updateData = { id: '1', slug: 'updated-slug' };
      const mockUpdatedCategory = {
        id: '1',
        slug: 'updated-slug',
        position: 1,
        imageUrl: null,
        isAvailable: true,
        createdAt: null,
        updatedAt: null,
      };

      mockRepository.getMenuCategoryById.mockResolvedValue({ id: '1', slug: 'old-slug' });
      mockRepository.updateMenuCategory.mockResolvedValue(mockUpdatedCategory);

      const result = await service.updateMenuCategory(updateData);

      expect(mockRepository.getMenuCategoryById).toHaveBeenCalledWith('1');
      expect(mockRepository.updateMenuCategory).toHaveBeenCalledWith(updateData);
      expect(result).toEqual({
        id: '1',
        slug: 'updated-slug',
        position: 1,
        imageUrl: null,
        isAvailable: true,
        createdAt: null,
        updatedAt: null,
      });
    });

    it('should throw AppError.notFound when category not found', async () => {
      const updateData = { id: 'non-existent', slug: 'updated-slug' };

      mockRepository.getMenuCategoryById.mockResolvedValue(null);

      await expect(service.updateMenuCategory(updateData)).rejects.toThrow(AppError);
      await expect(service.updateMenuCategory(updateData)).rejects.toMatchObject({
        error: { message: 'Menu category with id non-existent not found' },
      });
    });

    it('should throw AppError.internalServerError on error', async () => {
      const updateData = { id: '1', slug: 'updated-slug' };

      mockRepository.getMenuCategoryById.mockResolvedValue({ id: '1', slug: 'old-slug' });
      mockRepository.updateMenuCategory.mockRejectedValue(new Error('DB error'));

      await expect(service.updateMenuCategory(updateData)).rejects.toThrow(AppError);
      await expect(service.updateMenuCategory(updateData)).rejects.toMatchObject({
        error: { message: 'Failed to update menu category' },
      });
    });
  });

  describe('changeMenuCategoryPosition', () => {
    it('should change category position moving down', async () => {
      const categoryToUpdate = { id: '1', slug: 'cat-1', position: 1 };
      const categories = [
        { id: '1', slug: 'cat-1', position: 1 },
        { id: '2', slug: 'cat-2', position: 2 },
        { id: '3', slug: 'cat-3', position: 3 },
      ];
      const updatedCategory = {
        id: '1',
        slug: 'cat-1',
        position: 3,
        imageUrl: null,
        isAvailable: true,
        createdAt: null,
        updatedAt: null,
      };

      mockRepository.getMenuCategoryById.mockResolvedValue(categoryToUpdate);
      mockRepository.getAllMenuCategories.mockResolvedValue(categories);
      mockRepository.changeMenuCategoryPosition.mockResolvedValue(updatedCategory);

      const result = await service.changeMenuCategoryPosition({ id: '1', position: 3 });

      expect(mockRepository.getMenuCategoryById).toHaveBeenCalledWith('1');
      expect(mockRepository.getAllMenuCategories).toHaveBeenCalled();
      expect(mockRepository.changeMenuCategoryPosition).toHaveBeenCalledWith('1', [
        { id: '1', position: 3 },
        { id: '2', position: 1 },
        { id: '3', position: 2 },
      ]);
      expect(result.position).toBe(3);
    });

    it('should change category position moving up', async () => {
      const categoryToUpdate = { id: '3', slug: 'cat-3', position: 3 };
      const categories = [
        { id: '1', slug: 'cat-1', position: 1 },
        { id: '2', slug: 'cat-2', position: 2 },
        { id: '3', slug: 'cat-3', position: 3 },
      ];
      const updatedCategory = {
        id: '3',
        slug: 'cat-3',
        position: 1,
        imageUrl: null,
        isAvailable: true,
        createdAt: null,
        updatedAt: null,
      };

      mockRepository.getMenuCategoryById.mockResolvedValue(categoryToUpdate);
      mockRepository.getAllMenuCategories.mockResolvedValue(categories);
      mockRepository.changeMenuCategoryPosition.mockResolvedValue(updatedCategory);

      const result = await service.changeMenuCategoryPosition({ id: '3', position: 1 });

      expect(mockRepository.changeMenuCategoryPosition).toHaveBeenCalledWith('3', [
        { id: '1', position: 2 },
        { id: '2', position: 3 },
        { id: '3', position: 1 },
      ]);
      expect(result.position).toBe(1);
    });

    it('should return category unchanged when position is the same', async () => {
      const categoryToUpdate = {
        id: '1',
        slug: 'cat-1',
        position: 2,
        imageUrl: null,
        isAvailable: true,
        createdAt: null,
        updatedAt: null,
      };

      mockRepository.getMenuCategoryById.mockResolvedValue(categoryToUpdate);

      const result = await service.changeMenuCategoryPosition({ id: '1', position: 2 });

      expect(result.position).toBe(2);
      expect(mockRepository.getAllMenuCategories).not.toHaveBeenCalled();
      expect(mockRepository.changeMenuCategoryPosition).not.toHaveBeenCalled();
    });

    it('should throw AppError.badRequest when position is out of bounds (too high)', async () => {
      const categoryToUpdate = { id: '1', slug: 'cat-1', position: 1 };
      const categories = [
        { id: '1', slug: 'cat-1', position: 1 },
        { id: '2', slug: 'cat-2', position: 2 },
        { id: '3', slug: 'cat-3', position: 3 },
      ];

      mockRepository.getMenuCategoryById.mockResolvedValue(categoryToUpdate);
      mockRepository.getAllMenuCategories.mockResolvedValue(categories);

      await expect(service.changeMenuCategoryPosition({ id: '1', position: 5 })).rejects.toThrow(AppError);
      await expect(service.changeMenuCategoryPosition({ id: '1', position: 5 })).rejects.toMatchObject({
        error: { message: 'Position must be between 1 and 3' },
      });
      expect(mockRepository.changeMenuCategoryPosition).not.toHaveBeenCalled();
    });

    it('should throw AppError.badRequest when position is less than 1', async () => {
      const categoryToUpdate = { id: '1', slug: 'cat-1', position: 1 };
      const categories = [
        { id: '1', slug: 'cat-1', position: 1 },
        { id: '2', slug: 'cat-2', position: 2 },
      ];

      mockRepository.getMenuCategoryById.mockResolvedValue(categoryToUpdate);
      mockRepository.getAllMenuCategories.mockResolvedValue(categories);

      await expect(service.changeMenuCategoryPosition({ id: '1', position: 0 })).rejects.toThrow(AppError);
      await expect(service.changeMenuCategoryPosition({ id: '1', position: 0 })).rejects.toMatchObject({
        error: { message: 'Position must be between 1 and 2' },
      });
    });

    it('should throw AppError.notFound when repository returns null after update', async () => {
      const categoryToUpdate = { id: '1', slug: 'cat-1', position: 1 };
      const categories = [
        { id: '1', slug: 'cat-1', position: 1 },
        { id: '2', slug: 'cat-2', position: 2 },
      ];

      mockRepository.getMenuCategoryById.mockResolvedValue(categoryToUpdate);
      mockRepository.getAllMenuCategories.mockResolvedValue(categories);
      mockRepository.changeMenuCategoryPosition.mockResolvedValue(null);

      await expect(service.changeMenuCategoryPosition({ id: '1', position: 2 })).rejects.toThrow(AppError);
      await expect(service.changeMenuCategoryPosition({ id: '1', position: 2 })).rejects.toMatchObject({
        error: { message: 'Menu category not found after position update' },
      });
    });

    it('should throw AppError.notFound when category not found', async () => {
      mockRepository.getMenuCategoryById.mockResolvedValue(null);

      await expect(service.changeMenuCategoryPosition({ id: 'non-existent', position: 1 })).rejects.toThrow(AppError);
      await expect(service.changeMenuCategoryPosition({ id: 'non-existent', position: 1 })).rejects.toMatchObject({
        error: { message: 'Menu category not found' },
      });
    });

    it('should throw AppError.internalServerError on unexpected error', async () => {
      const categoryToUpdate = { id: '1', slug: 'cat-1', position: 1 };

      mockRepository.getMenuCategoryById.mockResolvedValue(categoryToUpdate);
      mockRepository.getAllMenuCategories.mockRejectedValue(new Error('DB error'));

      await expect(service.changeMenuCategoryPosition({ id: '1', position: 2 })).rejects.toThrow(AppError);
      await expect(service.changeMenuCategoryPosition({ id: '1', position: 2 })).rejects.toMatchObject({
        error: { message: 'Failed to change menu category position' },
      });
    });
  });

  describe('deleteMenuCategory', () => {
    it('should delete a menu category and return success response', async () => {
      const categoryToDelete = { id: '1', slug: 'cat-1', position: 2 };
      const categories = [
        { id: '1', slug: 'cat-1', position: 2 },
        { id: '2', slug: 'cat-2', position: 1 },
        { id: '3', slug: 'cat-3', position: 3 },
      ];

      mockRepository.getMenuCategoryById.mockResolvedValue(categoryToDelete);
      mockRepository.hasMenuItems.mockResolvedValue(false);
      mockRepository.getAllMenuCategories.mockResolvedValue(categories);
      mockRepository.deleteMenuCategory.mockResolvedValue({ id: '1' });

      const result = await service.deleteMenuCategory('1');

      expect(mockRepository.getMenuCategoryById).toHaveBeenCalledWith('1');
      expect(mockRepository.getAllMenuCategories).toHaveBeenCalled();
      expect(mockRepository.deleteMenuCategory).toHaveBeenCalledWith('1', [{ id: '3', position: 2 }]);
      expect(result).toEqual({ success: true, message: 'Menu category deleted successfully' });
    });

    it('should delete a menu category without position updates when it is the last one', async () => {
      const categoryToDelete = { id: '1', slug: 'cat-1', position: 3 };
      const categories = [
        { id: '1', slug: 'cat-1', position: 3 },
        { id: '2', slug: 'cat-2', position: 1 },
        { id: '3', slug: 'cat-3', position: 2 },
      ];

      mockRepository.getMenuCategoryById.mockResolvedValue(categoryToDelete);
      mockRepository.hasMenuItems.mockResolvedValue(false);
      mockRepository.getAllMenuCategories.mockResolvedValue(categories);
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

    it('should throw AppError.conflict when category has menu items', async () => {
      const categoryToDelete = { id: '1', slug: 'cat-1', position: 1 };

      mockRepository.getMenuCategoryById.mockResolvedValue(categoryToDelete);
      mockRepository.hasMenuItems.mockResolvedValue(true);

      await expect(service.deleteMenuCategory('1')).rejects.toThrow(AppError);
      await expect(service.deleteMenuCategory('1')).rejects.toMatchObject({
        error: { message: 'Cannot delete menu category that has menu items. Remove the items first.' },
      });
      expect(mockRepository.deleteMenuCategory).not.toHaveBeenCalled();
    });

    it('should throw AppError.internalServerError on error', async () => {
      const categoryToDelete = { id: '1', slug: 'cat-1', position: 1 };

      mockRepository.getMenuCategoryById.mockResolvedValue(categoryToDelete);
      mockRepository.hasMenuItems.mockResolvedValue(false);
      mockRepository.getAllMenuCategories.mockRejectedValue(new Error('DB error'));

      await expect(service.deleteMenuCategory('1')).rejects.toThrow(AppError);
      await expect(service.deleteMenuCategory('1')).rejects.toMatchObject({
        error: { message: 'Failed to delete menu category' },
      });
    });
  });

  describe('createMenuCategoryTranslation', () => {
    it('should create a menu category translation', async () => {
      const createData = { title: 'Coffee', description: 'Hot drinks', language: 'EN', categoryId: 'cat-1' };
      const mockTranslation = { id: 't1', ...createData };

      mockRepository.createMenuCategoryTranslation.mockResolvedValue(mockTranslation);

      const result = await service.createMenuCategoryTranslation(createData);

      expect(mockRepository.createMenuCategoryTranslation).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockTranslation);
    });

    it('should throw AppError.badRequest for invalid language', async () => {
      const createData = { title: 'Coffee', language: 'INVALID', categoryId: 'cat-1' };

      await expect(service.createMenuCategoryTranslation(createData)).rejects.toThrow(AppError);
    });

    it('should throw AppError.internalServerError on unexpected error', async () => {
      const createData = { title: 'Coffee', language: 'EN', categoryId: 'cat-1' };

      mockRepository.createMenuCategoryTranslation.mockRejectedValue(new Error('DB error'));

      await expect(service.createMenuCategoryTranslation(createData)).rejects.toThrow(AppError);
      await expect(service.createMenuCategoryTranslation(createData)).rejects.toMatchObject({
        error: { message: 'Failed to create menu category translation' },
      });
    });
  });

  describe('updateMenuCategoryTranslation', () => {
    it('should update a menu category translation', async () => {
      const updateData = { id: 't1', title: 'Updated Title', description: 'Updated desc' };
      const mockUpdated = { ...updateData };

      mockRepository.updateMenuCategoryTranslation.mockResolvedValue(mockUpdated);

      const result = await service.updateMenuCategoryTranslation(updateData);

      expect(mockRepository.updateMenuCategoryTranslation).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockUpdated);
    });

    it('should throw AppError.internalServerError on unexpected error', async () => {
      const updateData = { id: 't1', title: 'Updated Title' };

      mockRepository.updateMenuCategoryTranslation.mockRejectedValue(new Error('DB error'));

      await expect(service.updateMenuCategoryTranslation(updateData)).rejects.toThrow(AppError);
      await expect(service.updateMenuCategoryTranslation(updateData)).rejects.toMatchObject({
        error: { message: 'Failed to update menu category translation' },
      });
    });
  });

  describe('deleteMenuCategoryTranslation', () => {
    it('should delete a translation and return success response', async () => {
      mockRepository.deleteMenuCategoryTranslation.mockResolvedValue({ id: 't1' });

      const result = await service.deleteMenuCategoryTranslation('t1');

      expect(mockRepository.deleteMenuCategoryTranslation).toHaveBeenCalledWith('t1');
      expect(result).toEqual({ success: true, message: 'Menu category translation deleted successfully' });
    });

    it('should throw AppError.internalServerError on unexpected error', async () => {
      mockRepository.deleteMenuCategoryTranslation.mockRejectedValue(new Error('DB error'));

      await expect(service.deleteMenuCategoryTranslation('t1')).rejects.toThrow(AppError);
      await expect(service.deleteMenuCategoryTranslation('t1')).rejects.toMatchObject({
        error: { message: 'Failed to delete menu category translation' },
      });
    });
  });
});
