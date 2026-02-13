import { Test, TestingModule } from '@nestjs/testing';

import { MenuCategoryRepository } from '../menu-category.repository';
import { PrismaService } from 'src/prisma/prisma.service';

const prismaMock = {
  menuCategory: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  menuCategoryTranslation: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  menuItem: {
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('MenuCategoryRepository', () => {
  let repository: MenuCategoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MenuCategoryRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<MenuCategoryRepository>(MenuCategoryRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('getAllMenuCategories', () => {
    it('should fetch all menu categories ordered by position', async () => {
      const mockCategories = [
        { id: '1', slug: 'category-1', position: 1 },
        { id: '2', slug: 'category-2', position: 2 },
      ];
      prismaMock.menuCategory.findMany.mockResolvedValue(mockCategories);

      const result = await repository.getAllMenuCategories();

      expect(prismaMock.menuCategory.findMany).toHaveBeenCalledWith({
        orderBy: { position: 'asc' },
      });
      expect(result).toEqual(mockCategories);
    });
  });

  describe('getMenuCategoriesWithItemsByLanguage', () => {
    it('should fetch menu categories with translations and items for a specific language', async () => {
      const mockCategories = [
        {
          id: '1',
          slug: 'category-1',
          position: 1,
          menuCategoryTranslations: [{ id: 't1', language: 'UA', title: 'Category 1' }],
          menuItems: [
            {
              id: 'item-1',
              slug: 'item-1',
              position: 1,
              menuItemTranslations: [{ id: 'it1', language: 'UA', title: 'Item 1' }],
            },
          ],
        },
      ];
      prismaMock.menuCategory.findMany.mockResolvedValue(mockCategories);

      const result = await repository.getMenuCategoriesWithItemsByLanguage('UA' as never);

      expect(prismaMock.menuCategory.findMany).toHaveBeenCalledWith({
        orderBy: { position: 'asc' },
        include: {
          menuCategoryTranslations: {
            where: { language: 'UA' },
            select: { id: true, language: true, title: true, description: true },
          },
          menuItems: {
            orderBy: { position: 'asc' },
            include: {
              menuItemTranslations: {
                where: { language: 'UA' },
                select: { id: true, language: true, title: true, description: true },
              },
            },
          },
        },
      });
      expect(result).toEqual(mockCategories);
    });
  });

  describe('getMenuCategoriesWithTranslations', () => {
    it('should fetch menu categories with translations for a specific language', async () => {
      const mockCategories = [
        {
          id: '1',
          slug: 'category-1',
          position: 1,
          menuCategoryTranslations: [{ id: 't1', language: 'EN', title: 'Category 1' }],
        },
        {
          id: '2',
          slug: 'category-2',
          position: 2,
          menuCategoryTranslations: [{ id: 't2', language: 'EN', title: 'Category 2' }],
        },
      ];
      prismaMock.menuCategory.findMany.mockResolvedValue(mockCategories);

      const result = await repository.getMenuCategoriesWithTranslations('EN' as never);

      expect(prismaMock.menuCategory.findMany).toHaveBeenCalledWith({
        orderBy: { position: 'asc' },
        include: {
          menuCategoryTranslations: {
            where: { language: 'EN' },
            select: { id: true, language: true, title: true, description: true },
          },
        },
      });
      expect(result).toEqual(mockCategories);
    });
  });

  describe('getMenuCategoryById', () => {
    it('should fetch a menu category by its ID', async () => {
      const mockCategory = { id: '1', slug: 'test-category' };
      prismaMock.menuCategory.findUnique.mockResolvedValue(mockCategory);

      const result = await repository.getMenuCategoryById('1');

      expect(prismaMock.menuCategory.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should return null when category is not found', async () => {
      prismaMock.menuCategory.findUnique.mockResolvedValue(null);

      const result = await repository.getMenuCategoryById('non-existent');

      expect(prismaMock.menuCategory.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
      });
      expect(result).toBeNull();
    });
  });

  describe('getMenuCategoryByIdWithTranslations', () => {
    it('should fetch a menu category by ID with all translations', async () => {
      const mockCategory = {
        id: '1',
        slug: 'test-category',
        menuCategoryTranslations: [{ id: 't1', language: 'EN', title: 'Test', description: null }],
      };
      prismaMock.menuCategory.findUnique.mockResolvedValue(mockCategory);

      const result = await repository.getMenuCategoryByIdWithTranslations('1');

      expect(prismaMock.menuCategory.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          menuCategoryTranslations: {
            select: { id: true, language: true, title: true, description: true },
          },
        },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should return null when category is not found', async () => {
      prismaMock.menuCategory.findUnique.mockResolvedValue(null);

      const result = await repository.getMenuCategoryByIdWithTranslations('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('hasMenuItems', () => {
    it('should return true when category has menu items', async () => {
      prismaMock.menuItem.count.mockResolvedValue(3);

      const result = await repository.hasMenuItems('cat-1');

      expect(prismaMock.menuItem.count).toHaveBeenCalledWith({
        where: { categoryId: 'cat-1' },
      });
      expect(result).toBe(true);
    });

    it('should return false when category has no menu items', async () => {
      prismaMock.menuItem.count.mockResolvedValue(0);

      const result = await repository.hasMenuItems('empty-cat');

      expect(prismaMock.menuItem.count).toHaveBeenCalledWith({
        where: { categoryId: 'empty-cat' },
      });
      expect(result).toBe(false);
    });
  });

  describe('createMenuCategory', () => {
    it('should create a menu category with all fields', async () => {
      const mockCreatedCategory = {
        id: '1',
        slug: 'new-category',
        isAvailable: true,
        imageUrl: 'http://example.com/image.jpg',
        position: 3,
      };
      prismaMock.menuCategory.create.mockResolvedValue(mockCreatedCategory);

      const result = await repository.createMenuCategory({
        data: {
          slug: 'new-category',
          isAvailable: true,
          imageUrl: 'http://example.com/image.jpg',
        },
        lastPosition: 2,
      });

      expect(prismaMock.menuCategory.create).toHaveBeenCalledWith({
        data: {
          slug: 'new-category',
          isAvailable: true,
          imageUrl: 'http://example.com/image.jpg',
          position: 3,
        },
      });
      expect(result).toEqual(mockCreatedCategory);
    });

    it('should create a menu category without optional fields', async () => {
      const mockCreatedCategory = {
        id: '1',
        slug: 'simple-category',
        position: 1,
      };
      prismaMock.menuCategory.create.mockResolvedValue(mockCreatedCategory);

      const result = await repository.createMenuCategory({
        data: {
          slug: 'simple-category',
        },
        lastPosition: 0,
      });

      expect(prismaMock.menuCategory.create).toHaveBeenCalledWith({
        data: {
          slug: 'simple-category',
          position: 1,
        },
      });
      expect(result).toEqual(mockCreatedCategory);
    });
  });

  describe('updateMenuCategory', () => {
    it('should update a menu category with all fields', async () => {
      const mockUpdatedCategory = {
        id: '1',
        slug: 'updated-category',
        isAvailable: false,
        imageUrl: 'http://example.com/new-image.jpg',
      };
      prismaMock.menuCategory.update.mockResolvedValue(mockUpdatedCategory);

      const result = await repository.updateMenuCategory({
        id: '1',
        slug: 'updated-category',
        isAvailable: false,
        imageUrl: 'http://example.com/new-image.jpg',
      });

      expect(prismaMock.menuCategory.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          slug: 'updated-category',
          isAvailable: false,
          imageUrl: 'http://example.com/new-image.jpg',
        },
      });
      expect(result).toEqual(mockUpdatedCategory);
    });

    it('should update a menu category with partial fields', async () => {
      const mockUpdatedCategory = {
        id: '1',
        slug: 'only-slug-updated',
      };
      prismaMock.menuCategory.update.mockResolvedValue(mockUpdatedCategory);

      const result = await repository.updateMenuCategory({
        id: '1',
        slug: 'only-slug-updated',
      });

      expect(prismaMock.menuCategory.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          slug: 'only-slug-updated',
        },
      });
      expect(result).toEqual(mockUpdatedCategory);
    });
  });

  describe('deleteMenuCategory', () => {
    it('should delete a menu category by its ID', async () => {
      const mockDeletedCategory = { id: '1', slug: 'deleted-category' };

      prismaMock.$transaction.mockImplementation(async (callback: (prisma: typeof prismaMock) => Promise<unknown>) => {
        const mockPrismaInTransaction = {
          menuCategory: {
            delete: jest.fn().mockResolvedValue(mockDeletedCategory),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(mockPrismaInTransaction as unknown as typeof prismaMock);
      });

      const result = await repository.deleteMenuCategory('1');

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockDeletedCategory);
    });

    it('should delete a menu category and update positions of remaining categories', async () => {
      const mockDeletedCategory = { id: '1', slug: 'deleted-category', position: 1 };
      const positionUpdates = [
        { id: '2', position: 1 },
        { id: '3', position: 2 },
      ];

      prismaMock.$transaction.mockImplementation(async (callback: (prisma: typeof prismaMock) => Promise<unknown>) => {
        const mockPrismaInTransaction = {
          menuCategory: {
            delete: jest.fn().mockResolvedValue(mockDeletedCategory),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(mockPrismaInTransaction as unknown as typeof prismaMock);
      });

      const result = await repository.deleteMenuCategory('1', positionUpdates);

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockDeletedCategory);
    });
  });

  describe('changeMenuCategoryPosition', () => {
    it('should update positions for multiple categories in a transaction', async () => {
      const mockUpdatedCategory = { id: '1', slug: 'category-1', position: 2 };
      const positionUpdates = [
        { id: '1', position: 2 },
        { id: '2', position: 1 },
      ];

      prismaMock.$transaction.mockImplementation(async (callback: (prisma: typeof prismaMock) => Promise<unknown>) => {
        const mockPrismaInTransaction = {
          menuCategory: {
            update: jest.fn().mockResolvedValue({}),
            findUnique: jest.fn().mockResolvedValue(mockUpdatedCategory),
          },
        };
        return callback(mockPrismaInTransaction as unknown as typeof prismaMock);
      });

      const result = await repository.changeMenuCategoryPosition('1', positionUpdates);

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedCategory);
    });

    it('should handle single position update', async () => {
      const mockUpdatedCategory = { id: '3', slug: 'category-3', position: 1 };
      const positionUpdates = [{ id: '3', position: 1 }];

      prismaMock.$transaction.mockImplementation(async (callback: (prisma: typeof prismaMock) => Promise<unknown>) => {
        const mockPrismaInTransaction = {
          menuCategory: {
            update: jest.fn().mockResolvedValue({}),
            findUnique: jest.fn().mockResolvedValue(mockUpdatedCategory),
          },
        };
        return callback(mockPrismaInTransaction as unknown as typeof prismaMock);
      });

      const result = await repository.changeMenuCategoryPosition('3', positionUpdates);

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedCategory);
    });
  });

  describe('createMenuCategoryTranslation', () => {
    it('should create a translation with all fields', async () => {
      const mockTranslation = {
        id: 't1',
        title: 'Coffee',
        description: 'Hot drinks',
        language: 'EN',
        categoryId: 'cat-1',
      };
      prismaMock.menuCategoryTranslation.create.mockResolvedValue(mockTranslation);

      const result = await repository.createMenuCategoryTranslation({
        title: 'Coffee',
        description: 'Hot drinks',
        language: 'EN',
        categoryId: 'cat-1',
      });

      expect(prismaMock.menuCategoryTranslation.create).toHaveBeenCalledWith({
        data: {
          title: 'Coffee',
          description: 'Hot drinks',
          language: 'EN',
          categoryId: 'cat-1',
        },
      });
      expect(result).toEqual(mockTranslation);
    });

    it('should create a translation without description', async () => {
      const mockTranslation = {
        id: 't2',
        title: 'Кава',
        language: 'UA',
        categoryId: 'cat-1',
      };
      prismaMock.menuCategoryTranslation.create.mockResolvedValue(mockTranslation);

      const result = await repository.createMenuCategoryTranslation({
        title: 'Кава',
        language: 'UA',
        categoryId: 'cat-1',
      });

      expect(prismaMock.menuCategoryTranslation.create).toHaveBeenCalledWith({
        data: {
          title: 'Кава',
          description: undefined,
          language: 'UA',
          categoryId: 'cat-1',
        },
      });
      expect(result).toEqual(mockTranslation);
    });
  });

  describe('updateMenuCategoryTranslation', () => {
    it('should update a translation with all fields', async () => {
      const mockUpdated = {
        id: 't1',
        title: 'Updated Title',
        description: 'Updated description',
      };
      prismaMock.menuCategoryTranslation.update.mockResolvedValue(mockUpdated);

      const result = await repository.updateMenuCategoryTranslation({
        id: 't1',
        title: 'Updated Title',
        description: 'Updated description',
      });

      expect(prismaMock.menuCategoryTranslation.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: {
          title: 'Updated Title',
          description: 'Updated description',
        },
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('deleteMenuCategoryTranslation', () => {
    it('should delete a translation by id', async () => {
      const mockDeleted = { id: 't1', title: 'Deleted', language: 'EN', categoryId: 'cat-1' };
      prismaMock.menuCategoryTranslation.delete.mockResolvedValue(mockDeleted);

      const result = await repository.deleteMenuCategoryTranslation('t1');

      expect(prismaMock.menuCategoryTranslation.delete).toHaveBeenCalledWith({
        where: { id: 't1' },
      });
      expect(result).toEqual(mockDeleted);
    });
  });
});
