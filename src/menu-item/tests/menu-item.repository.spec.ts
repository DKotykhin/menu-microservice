import { Test, TestingModule } from '@nestjs/testing';

import { MenuItemRepository } from '../menu-item.repository';
import { PrismaService } from 'src/prisma/prisma.service';

const prismaMock = {
  menuItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('MenuItemRepository', () => {
  let repository: MenuItemRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MenuItemRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<MenuItemRepository>(MenuItemRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('getMenuItemById', () => {
    it('should fetch a menu item by its ID', async () => {
      const mockMenuItem = {
        id: '1',
        title: 'Espresso',
        description: 'Strong coffee',
        price: 3.5,
        language: 'EN',
        position: 1,
        categoryId: 'cat-1',
      };
      prismaMock.menuItem.findUnique.mockResolvedValue(mockMenuItem);

      const result = await repository.getMenuItemById('1');

      expect(prismaMock.menuItem.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockMenuItem);
    });

    it('should return null when menu item is not found', async () => {
      prismaMock.menuItem.findUnique.mockResolvedValue(null);

      const result = await repository.getMenuItemById('non-existent');

      expect(prismaMock.menuItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
      });
      expect(result).toBeNull();
    });
  });

  describe('getMenuItemsByCategoryId', () => {
    it('should fetch menu items for a specific category', async () => {
      const mockMenuItems = [
        { id: '1', title: 'Espresso', categoryId: 'cat-1', position: 1 },
        { id: '2', title: 'Americano', categoryId: 'cat-1', position: 2 },
      ];
      prismaMock.menuItem.findMany.mockResolvedValue(mockMenuItems);

      const result = await repository.getMenuItemsByCategoryId('cat-1');

      expect(prismaMock.menuItem.findMany).toHaveBeenCalledWith({
        where: { categoryId: 'cat-1' },
      });
      expect(result).toEqual(mockMenuItems);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no items in category', async () => {
      prismaMock.menuItem.findMany.mockResolvedValue([]);

      const result = await repository.getMenuItemsByCategoryId('empty-cat');

      expect(prismaMock.menuItem.findMany).toHaveBeenCalledWith({
        where: { categoryId: 'empty-cat' },
      });
      expect(result).toEqual([]);
    });
  });

  describe('createMenuItem', () => {
    it('should create a menu item with all fields', async () => {
      const mockCreatedItem = {
        id: '1',
        language: 'UA',
        title: 'Лате',
        description: 'Кава з молоком',
        price: 4.5,
        isAvailable: true,
        imageUrl: 'http://example.com/latte.jpg',
        position: 3,
        categoryId: 'cat-1',
      };
      prismaMock.menuItem.create.mockResolvedValue(mockCreatedItem);

      const result = await repository.createMenuItem({
        data: {
          language: 'UA',
          title: 'Лате',
          description: 'Кава з молоком',
          price: '4.5',
          isAvailable: true,
          imageUrl: 'http://example.com/latte.jpg',
          menuCategory: { id: 'cat-1' },
        },
        lastPosition: 2,
      });

      expect(prismaMock.menuItem.create).toHaveBeenCalledWith({
        data: {
          language: 'UA',
          title: 'Лате',
          description: 'Кава з молоком',
          price: '4.5',
          isAvailable: true,
          imageUrl: 'http://example.com/latte.jpg',
          position: 3,
          categoryId: 'cat-1',
        },
      });
      expect(result).toEqual(mockCreatedItem);
    });

    it('should create a menu item without optional fields', async () => {
      const mockCreatedItem = {
        id: '1',
        language: 'EN',
        title: 'Espresso',
        description: 'Strong coffee',
        price: 3.0,
        position: 1,
        categoryId: 'cat-1',
      };
      prismaMock.menuItem.create.mockResolvedValue(mockCreatedItem);

      const result = await repository.createMenuItem({
        data: {
          language: 'EN',
          title: 'Espresso',
          description: 'Strong coffee',
          price: '3.0',
          menuCategory: { id: 'cat-1' },
        },
        lastPosition: 0,
      });

      expect(prismaMock.menuItem.create).toHaveBeenCalledWith({
        data: {
          language: 'EN',
          title: 'Espresso',
          description: 'Strong coffee',
          price: '3.0',
          position: 1,
          categoryId: 'cat-1',
        },
      });
      expect(result).toEqual(mockCreatedItem);
    });

    it('should create a menu item with isAvailable set to false', async () => {
      const mockCreatedItem = {
        id: '1',
        language: 'EN',
        title: 'Seasonal Special',
        description: 'Limited time offer',
        price: 5.0,
        isAvailable: false,
        position: 1,
        categoryId: 'cat-1',
      };
      prismaMock.menuItem.create.mockResolvedValue(mockCreatedItem);

      const result = await repository.createMenuItem({
        data: {
          language: 'EN',
          title: 'Seasonal Special',
          description: 'Limited time offer',
          price: '5.0',
          isAvailable: false,
          menuCategory: { id: 'cat-1' },
        },
        lastPosition: 0,
      });

      expect(prismaMock.menuItem.create).toHaveBeenCalledWith({
        data: {
          language: 'EN',
          title: 'Seasonal Special',
          description: 'Limited time offer',
          price: '5.0',
          isAvailable: false,
          position: 1,
          categoryId: 'cat-1',
        },
      });
      expect(result).toEqual(mockCreatedItem);
    });
  });

  describe('updateMenuItem', () => {
    it('should update a menu item with all fields', async () => {
      const mockUpdatedItem = {
        id: '1',
        language: 'UA',
        title: 'Оновлена назва',
        description: 'Оновлений опис',
        price: 5.5,
        isAvailable: false,
        imageUrl: 'http://example.com/new-image.jpg',
      };
      prismaMock.menuItem.update.mockResolvedValue(mockUpdatedItem);

      const result = await repository.updateMenuItem({
        id: '1',
        language: 'UA',
        title: 'Оновлена назва',
        description: 'Оновлений опис',
        price: '5.5',
        isAvailable: false,
        imageUrl: 'http://example.com/new-image.jpg',
      });

      expect(prismaMock.menuItem.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          language: 'UA',
          title: 'Оновлена назва',
          description: 'Оновлений опис',
          price: '5.5',
          isAvailable: false,
          imageUrl: 'http://example.com/new-image.jpg',
        },
      });
      expect(result).toEqual(mockUpdatedItem);
    });

    it('should update a menu item with partial fields', async () => {
      const mockUpdatedItem = {
        id: '1',
        title: 'Only Title Updated',
      };
      prismaMock.menuItem.update.mockResolvedValue(mockUpdatedItem);

      const result = await repository.updateMenuItem({
        id: '1',
        title: 'Only Title Updated',
      });

      expect(prismaMock.menuItem.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          title: 'Only Title Updated',
        },
      });
      expect(result).toEqual(mockUpdatedItem);
    });

    it('should update only the price', async () => {
      const mockUpdatedItem = {
        id: '1',
        price: 7.99,
      };
      prismaMock.menuItem.update.mockResolvedValue(mockUpdatedItem);

      const result = await repository.updateMenuItem({
        id: '1',
        price: '7.99',
      });

      expect(prismaMock.menuItem.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          price: '7.99',
        },
      });
      expect(result).toEqual(mockUpdatedItem);
    });

    it('should update isAvailable to false', async () => {
      const mockUpdatedItem = {
        id: '1',
        isAvailable: false,
      };
      prismaMock.menuItem.update.mockResolvedValue(mockUpdatedItem);

      const result = await repository.updateMenuItem({
        id: '1',
        isAvailable: false,
      });

      expect(prismaMock.menuItem.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          isAvailable: false,
        },
      });
      expect(result).toEqual(mockUpdatedItem);
    });
  });

  describe('deleteMenuItem', () => {
    it('should delete a menu item and update positions of remaining items', async () => {
      const mockDeletedItem = { id: '1', title: 'Deleted Item', position: 1 };
      const positionUpdates = [
        { id: '2', position: 1 },
        { id: '3', position: 2 },
      ];

      prismaMock.$transaction.mockImplementation(async (callback: (prisma: typeof prismaMock) => Promise<unknown>) => {
        const mockPrismaInTransaction = {
          menuItem: {
            delete: jest.fn().mockResolvedValue(mockDeletedItem),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(mockPrismaInTransaction as unknown as typeof prismaMock);
      });

      const result = await repository.deleteMenuItem('1', positionUpdates);

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockDeletedItem);
    });

    it('should delete a menu item without position updates', async () => {
      const mockDeletedItem = { id: '1', title: 'Last Item', position: 1 };

      prismaMock.$transaction.mockImplementation(async (callback: (prisma: typeof prismaMock) => Promise<unknown>) => {
        const mockPrismaInTransaction = {
          menuItem: {
            delete: jest.fn().mockResolvedValue(mockDeletedItem),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(mockPrismaInTransaction as unknown as typeof prismaMock);
      });

      const result = await repository.deleteMenuItem('1');

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockDeletedItem);
    });
  });

  describe('changeMenuItemPosition', () => {
    it('should update positions for multiple menu items in a transaction', async () => {
      const mockUpdatedItem = { id: '1', title: 'Menu Item', position: 2 };
      const positionUpdates = [
        { id: '1', position: 2 },
        { id: '2', position: 1 },
      ];

      prismaMock.$transaction.mockImplementation(async (callback: (prisma: typeof prismaMock) => Promise<unknown>) => {
        const mockPrismaInTransaction = {
          menuItem: {
            update: jest.fn().mockResolvedValue({}),
            findUnique: jest.fn().mockResolvedValue(mockUpdatedItem),
          },
        };
        return callback(mockPrismaInTransaction as unknown as typeof prismaMock);
      });

      const result = await repository.changeMenuItemPosition('1', positionUpdates);

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedItem);
    });

    it('should handle single position update', async () => {
      const mockUpdatedItem = { id: '3', title: 'Menu Item 3', position: 1 };
      const positionUpdates = [{ id: '3', position: 1 }];

      prismaMock.$transaction.mockImplementation(async (callback: (prisma: typeof prismaMock) => Promise<unknown>) => {
        const mockPrismaInTransaction = {
          menuItem: {
            update: jest.fn().mockResolvedValue({}),
            findUnique: jest.fn().mockResolvedValue(mockUpdatedItem),
          },
        };
        return callback(mockPrismaInTransaction as unknown as typeof prismaMock);
      });

      const result = await repository.changeMenuItemPosition('3', positionUpdates);

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedItem);
    });

    it('should handle multiple position updates for reordering', async () => {
      const mockUpdatedItem = { id: '2', title: 'Menu Item 2', position: 3 };
      const positionUpdates = [
        { id: '1', position: 1 },
        { id: '2', position: 3 },
        { id: '3', position: 2 },
      ];

      prismaMock.$transaction.mockImplementation(async (callback: (prisma: typeof prismaMock) => Promise<unknown>) => {
        const mockPrismaInTransaction = {
          menuItem: {
            update: jest.fn().mockResolvedValue({}),
            findUnique: jest.fn().mockResolvedValue(mockUpdatedItem),
          },
        };
        return callback(mockPrismaInTransaction as unknown as typeof prismaMock);
      });

      const result = await repository.changeMenuItemPosition('2', positionUpdates);

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedItem);
    });
  });
});
