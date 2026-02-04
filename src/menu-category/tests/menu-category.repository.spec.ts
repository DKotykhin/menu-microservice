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

  describe('getMenuCategoriesWithItemsByLanguage', () => {
    it('should fetch menu categories with items for a specific language', async () => {
      const mockCategories = [
        {
          id: '1',
          language: 'UA',
          title: 'Category 1',
          position: 1,
          menuItems: [{ id: 'item-1', title: 'Item 1', position: 1 }],
        },
        {
          id: '2',
          language: 'UA',
          title: 'Category 2',
          position: 2,
          menuItems: [],
        },
      ];
      prismaMock.menuCategory.findMany.mockResolvedValue(mockCategories);

      const result = await repository.getMenuCategoriesWithItemsByLanguage('UA' as never);

      expect(prismaMock.menuCategory.findMany).toHaveBeenCalledWith({
        where: { language: 'UA' },
        orderBy: { position: 'asc' },
        include: {
          menuItems: {
            orderBy: { position: 'asc' },
          },
        },
      });
      expect(result).toEqual(mockCategories);
      expect(result).toHaveLength(2);
    });
  });

  describe('getMenuCategoriesByLanguage', () => {
    it('should fetch menu categories for a specific language', async () => {
      const mockCategories = [
        { id: '1', language: 'EN', title: 'Category 1', position: 1 },
        { id: '2', language: 'EN', title: 'Category 2', position: 2 },
      ];
      prismaMock.menuCategory.findMany.mockResolvedValue(mockCategories);

      const result = await repository.getMenuCategoriesByLanguage('EN' as never);

      expect(prismaMock.menuCategory.findMany).toHaveBeenCalledWith({
        where: { language: 'EN' },
        orderBy: { position: 'asc' },
      });
      expect(result).toEqual(mockCategories);
    });
  });

  describe('getMenuCategoryById', () => {
    it('should fetch a menu category by its ID', async () => {
      const mockCategory = { id: '1', title: 'Test Category' };
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

  describe('createMenuCategory', () => {
    it('should create a menu category with all fields', async () => {
      const mockCreatedCategory = {
        id: '1',
        language: 'UA',
        title: 'New Category',
        description: 'Description',
        isAvailable: true,
        imageUrl: 'http://example.com/image.jpg',
        position: 3,
      };
      prismaMock.menuCategory.create.mockResolvedValue(mockCreatedCategory);

      const result = await repository.createMenuCategory({
        data: {
          language: 'UA',
          title: 'New Category',
          description: 'Description',
          isAvailable: true,
          imageUrl: 'http://example.com/image.jpg',
        },
        lastPosition: 2,
      });

      expect(prismaMock.menuCategory.create).toHaveBeenCalledWith({
        data: {
          language: 'UA',
          title: 'New Category',
          description: 'Description',
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
        language: 'EN',
        title: 'Simple Category',
        description: 'Desc',
        position: 1,
      };
      prismaMock.menuCategory.create.mockResolvedValue(mockCreatedCategory);

      const result = await repository.createMenuCategory({
        data: {
          language: 'EN',
          title: 'Simple Category',
          description: 'Desc',
        },
        lastPosition: 0,
      });

      expect(prismaMock.menuCategory.create).toHaveBeenCalledWith({
        data: {
          language: 'EN',
          title: 'Simple Category',
          description: 'Desc',
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
        language: 'UA',
        title: 'Updated Title',
        description: 'Updated Description',
        isAvailable: false,
        imageUrl: 'http://example.com/new-image.jpg',
      };
      prismaMock.menuCategory.update.mockResolvedValue(mockUpdatedCategory);

      const result = await repository.updateMenuCategory({
        id: '1',
        language: 'UA',
        title: 'Updated Title',
        description: 'Updated Description',
        isAvailable: false,
        imageUrl: 'http://example.com/new-image.jpg',
      });

      expect(prismaMock.menuCategory.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          language: 'UA',
          title: 'Updated Title',
          description: 'Updated Description',
          isAvailable: false,
          imageUrl: 'http://example.com/new-image.jpg',
        },
      });
      expect(result).toEqual(mockUpdatedCategory);
    });

    it('should update a menu category with partial fields', async () => {
      const mockUpdatedCategory = {
        id: '1',
        title: 'Only Title Updated',
      };
      prismaMock.menuCategory.update.mockResolvedValue(mockUpdatedCategory);

      const result = await repository.updateMenuCategory({
        id: '1',
        title: 'Only Title Updated',
      });

      expect(prismaMock.menuCategory.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          title: 'Only Title Updated',
        },
      });
      expect(result).toEqual(mockUpdatedCategory);
    });
  });

  describe('deleteMenuCategory', () => {
    it('should delete a menu category by its ID', async () => {
      const mockDeletedCategory = { id: '1', title: 'Deleted Category' };

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
      const mockDeletedCategory = { id: '1', title: 'Deleted Category', position: 1 };
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
      const mockUpdatedCategory = { id: '1', title: 'Category', position: 2 };
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
      const mockUpdatedCategory = { id: '3', title: 'Category 3', position: 1 };
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
});
