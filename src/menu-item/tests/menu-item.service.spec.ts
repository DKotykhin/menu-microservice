import { Test, TestingModule } from '@nestjs/testing';

import { MenuItemService } from '../menu-item.service';
import { MenuItemRepository } from '../menu-item.repository';
import { AppError } from 'src/utils/errors/app-error';

const mockRepository = {
  getMenuItemById: jest.fn(),
  getMenuItemsByCategoryId: jest.fn(),
  createMenuItem: jest.fn(),
  updateMenuItem: jest.fn(),
  deleteMenuItem: jest.fn(),
  changeMenuItemPosition: jest.fn(),
  createMenuItemTranslation: jest.fn(),
  updateMenuItemTranslation: jest.fn(),
  deleteMenuItemTranslation: jest.fn(),
};

describe('MenuItemService', () => {
  let service: MenuItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MenuItemService, { provide: MenuItemRepository, useValue: mockRepository }],
    }).compile();

    service = module.get<MenuItemService>(MenuItemService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMenuItemById', () => {
    it('should return a mapped menu item by ID', async () => {
      const mockRepoItem = {
        id: '1',
        slug: 'espresso',
        price: '3.50',
        imageUrl: null,
        isAvailable: true,
        position: 1,
        categoryId: 'cat-1',
        menuItemTranslations: [
          { id: 't1', title: 'Espresso', description: 'Strong coffee', language: 'EN', itemId: '1' },
        ],
      };
      mockRepository.getMenuItemById.mockResolvedValue(mockRepoItem);

      const result = await service.getMenuItemById('1');

      expect(mockRepository.getMenuItemById).toHaveBeenCalledWith('1');
      expect(result).toEqual({
        id: '1',
        slug: 'espresso',
        price: '3.50',
        imageUrl: null,
        isAvailable: true,
        position: 1,
        translations: [{ id: 't1', title: 'Espresso', description: 'Strong coffee', language: 'EN', itemId: '1' }],
      });
    });

    it('should throw AppError.notFound when menu item not found', async () => {
      mockRepository.getMenuItemById.mockResolvedValue(null);

      await expect(service.getMenuItemById('non-existent')).rejects.toThrow(AppError);
      await expect(service.getMenuItemById('non-existent')).rejects.toMatchObject({
        error: { message: 'Menu item with id non-existent not found' },
      });
    });

    it('should throw AppError.internalServerError on unexpected error', async () => {
      mockRepository.getMenuItemById.mockRejectedValue(new Error('DB error'));

      await expect(service.getMenuItemById('1')).rejects.toThrow(AppError);
      await expect(service.getMenuItemById('1')).rejects.toMatchObject({
        error: { message: 'Failed to fetch menu item by id' },
      });
    });
  });

  describe('getMenuItemsByCategoryId', () => {
    it('should return mapped menu items for a category', async () => {
      const mockRepoItems = [
        {
          id: '1',
          slug: 'espresso',
          price: '3.50',
          imageUrl: null,
          isAvailable: true,
          position: 1,
          categoryId: 'cat-1',
          menuItemTranslations: [{ id: 't1', title: 'Espresso', language: 'EN', itemId: '1' }],
        },
        {
          id: '2',
          slug: 'americano',
          price: '4.00',
          imageUrl: null,
          isAvailable: true,
          position: 2,
          categoryId: 'cat-1',
          menuItemTranslations: [{ id: 't2', title: 'Americano', language: 'EN', itemId: '2' }],
        },
      ];
      mockRepository.getMenuItemsByCategoryId.mockResolvedValue(mockRepoItems);

      const result = await service.getMenuItemsByCategoryId('cat-1');

      expect(mockRepository.getMenuItemsByCategoryId).toHaveBeenCalledWith('cat-1');
      expect(result).toEqual({
        menuItems: [
          {
            id: '1',
            slug: 'espresso',
            price: '3.50',
            imageUrl: null,
            isAvailable: true,
            position: 1,
            translations: [{ id: 't1', title: 'Espresso', language: 'EN', itemId: '1' }],
          },
          {
            id: '2',
            slug: 'americano',
            price: '4.00',
            imageUrl: null,
            isAvailable: true,
            position: 2,
            translations: [{ id: 't2', title: 'Americano', language: 'EN', itemId: '2' }],
          },
        ],
      });
    });

    it('should return empty array when no items in category', async () => {
      mockRepository.getMenuItemsByCategoryId.mockResolvedValue([]);

      const result = await service.getMenuItemsByCategoryId('empty-cat');

      expect(mockRepository.getMenuItemsByCategoryId).toHaveBeenCalledWith('empty-cat');
      expect(result).toEqual({ menuItems: [] });
    });

    it('should throw AppError.internalServerError on unexpected error', async () => {
      mockRepository.getMenuItemsByCategoryId.mockRejectedValue(new Error('DB error'));

      await expect(service.getMenuItemsByCategoryId('cat-1')).rejects.toThrow(AppError);
      await expect(service.getMenuItemsByCategoryId('cat-1')).rejects.toMatchObject({
        error: { message: 'Failed to fetch menu items by category' },
      });
    });
  });

  describe('createMenuItem', () => {
    it('should create a new menu item', async () => {
      const createData = {
        slug: 'latte',
        price: '4.50',
        categoryId: 'cat-1',
      };
      const mockCreatedItem = { id: '1', ...createData, position: 1, isAvailable: true };

      mockRepository.getMenuItemsByCategoryId.mockResolvedValue([]);
      mockRepository.createMenuItem.mockResolvedValue(mockCreatedItem);

      const result = await service.createMenuItem(createData);

      expect(mockRepository.getMenuItemsByCategoryId).toHaveBeenCalledWith('cat-1');
      expect(mockRepository.createMenuItem).toHaveBeenCalledWith({
        data: createData,
        lastPosition: 0,
      });
      expect(result).toEqual(mockCreatedItem);
    });

    it('should calculate correct position when items exist', async () => {
      const createData = {
        slug: 'latte',
        price: '4.50',
        categoryId: 'cat-1',
      };
      const existingItems = [
        { id: '1', slug: 'espresso', position: 1 },
        { id: '2', slug: 'americano', position: 3 },
      ];
      const mockCreatedItem = { id: '3', ...createData, position: 4 };

      mockRepository.getMenuItemsByCategoryId.mockResolvedValue(existingItems);
      mockRepository.createMenuItem.mockResolvedValue(mockCreatedItem);

      const result = await service.createMenuItem(createData);

      expect(mockRepository.createMenuItem).toHaveBeenCalledWith({
        data: createData,
        lastPosition: 3,
      });
      expect(result).toEqual(mockCreatedItem);
    });

    it('should throw AppError.internalServerError on unexpected error', async () => {
      const createData = {
        slug: 'latte',
        price: '4.50',
        categoryId: 'cat-1',
      };

      mockRepository.getMenuItemsByCategoryId.mockResolvedValue([]);
      mockRepository.createMenuItem.mockRejectedValue(new Error('DB error'));

      await expect(service.createMenuItem(createData)).rejects.toThrow(AppError);
      await expect(service.createMenuItem(createData)).rejects.toMatchObject({
        error: { message: 'Failed to create menu item' },
      });
    });
  });

  describe('updateMenuItem', () => {
    it('should update a menu item', async () => {
      const updateData = { id: '1', slug: 'updated-slug' };
      const mockUpdatedItem = { id: '1', slug: 'updated-slug', price: '3.50', isAvailable: true, position: 1 };

      mockRepository.getMenuItemById.mockResolvedValue({ id: '1', slug: 'old-slug' });
      mockRepository.updateMenuItem.mockResolvedValue(mockUpdatedItem);

      const result = await service.updateMenuItem(updateData);

      expect(mockRepository.updateMenuItem).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockUpdatedItem);
    });

    it('should update a menu item with all fields', async () => {
      const updateData = {
        id: '1',
        slug: 'updated-slug',
        price: '5.50',
        isAvailable: false,
        imageUrl: 'http://example.com/new-image.jpg',
      };
      const mockUpdatedItem = { ...updateData };

      mockRepository.getMenuItemById.mockResolvedValue({ id: '1', slug: 'old-slug' });
      mockRepository.updateMenuItem.mockResolvedValue(mockUpdatedItem);

      const result = await service.updateMenuItem(updateData);

      expect(mockRepository.updateMenuItem).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockUpdatedItem);
    });

    it('should throw AppError.notFound when item not found', async () => {
      const updateData = { id: 'non-existent', slug: 'updated-slug' };

      mockRepository.getMenuItemById.mockResolvedValue(null);

      await expect(service.updateMenuItem(updateData)).rejects.toThrow(AppError);
      await expect(service.updateMenuItem(updateData)).rejects.toMatchObject({
        error: { message: 'Menu item with id non-existent not found' },
      });
    });

    it('should throw AppError.internalServerError on error', async () => {
      const updateData = { id: '1', slug: 'updated-slug' };

      mockRepository.getMenuItemById.mockResolvedValue({ id: '1', slug: 'old-slug' });
      mockRepository.updateMenuItem.mockRejectedValue(new Error('DB error'));

      await expect(service.updateMenuItem(updateData)).rejects.toThrow(AppError);
      await expect(service.updateMenuItem(updateData)).rejects.toMatchObject({
        error: { message: 'Failed to update menu item' },
      });
    });
  });

  describe('deleteMenuItem', () => {
    it('should delete a menu item and return success response', async () => {
      const itemToDelete = { id: '1', slug: 'item-1', position: 2, categoryId: 'cat-1' };
      const items = [
        { id: '1', slug: 'item-1', position: 2 },
        { id: '2', slug: 'item-2', position: 1 },
        { id: '3', slug: 'item-3', position: 3 },
      ];

      mockRepository.getMenuItemById.mockResolvedValue(itemToDelete);
      mockRepository.getMenuItemsByCategoryId.mockResolvedValue(items);
      mockRepository.deleteMenuItem.mockResolvedValue({ id: '1' });

      const result = await service.deleteMenuItem('1');

      expect(mockRepository.getMenuItemById).toHaveBeenCalledWith('1');
      expect(mockRepository.getMenuItemsByCategoryId).toHaveBeenCalledWith('cat-1');
      expect(mockRepository.deleteMenuItem).toHaveBeenCalledWith('1', [{ id: '3', position: 2 }]);
      expect(result).toEqual({ success: true, message: 'Menu item with id 1 deleted successfully' });
    });

    it('should delete a menu item without position updates when it is the last one', async () => {
      const itemToDelete = { id: '1', slug: 'item-1', position: 3, categoryId: 'cat-1' };
      const items = [
        { id: '1', slug: 'item-1', position: 3 },
        { id: '2', slug: 'item-2', position: 1 },
        { id: '3', slug: 'item-3', position: 2 },
      ];

      mockRepository.getMenuItemById.mockResolvedValue(itemToDelete);
      mockRepository.getMenuItemsByCategoryId.mockResolvedValue(items);
      mockRepository.deleteMenuItem.mockResolvedValue({ id: '1' });

      const result = await service.deleteMenuItem('1');

      expect(mockRepository.deleteMenuItem).toHaveBeenCalledWith('1', []);
      expect(result).toEqual({ success: true, message: 'Menu item with id 1 deleted successfully' });
    });

    it('should throw AppError.notFound when item not found', async () => {
      mockRepository.getMenuItemById.mockResolvedValue(null);

      await expect(service.deleteMenuItem('non-existent')).rejects.toThrow(AppError);
      await expect(service.deleteMenuItem('non-existent')).rejects.toMatchObject({
        error: { message: 'Menu item with id non-existent not found' },
      });
    });

    it('should throw AppError.internalServerError on error', async () => {
      const itemToDelete = { id: '1', slug: 'item-1', position: 1, categoryId: 'cat-1' };

      mockRepository.getMenuItemById.mockResolvedValue(itemToDelete);
      mockRepository.getMenuItemsByCategoryId.mockRejectedValue(new Error('DB error'));

      await expect(service.deleteMenuItem('1')).rejects.toThrow(AppError);
      await expect(service.deleteMenuItem('1')).rejects.toMatchObject({
        error: { message: 'Failed to delete menu item' },
      });
    });
  });

  describe('changeMenuItemPosition', () => {
    it('should change item position moving down', async () => {
      const itemToUpdate = { id: '1', slug: 'item-1', position: 1, categoryId: 'cat-1' };
      const items = [
        { id: '1', slug: 'item-1', position: 1 },
        { id: '2', slug: 'item-2', position: 2 },
        { id: '3', slug: 'item-3', position: 3 },
      ];
      const updatedItem = { id: '1', slug: 'item-1', position: 3 };

      mockRepository.getMenuItemById.mockResolvedValue(itemToUpdate);
      mockRepository.getMenuItemsByCategoryId.mockResolvedValue(items);
      mockRepository.changeMenuItemPosition.mockResolvedValue(updatedItem);

      const result = await service.changeMenuItemPosition({ id: '1', position: 3 });

      expect(mockRepository.getMenuItemById).toHaveBeenCalledWith('1');
      expect(mockRepository.getMenuItemsByCategoryId).toHaveBeenCalledWith('cat-1');
      expect(mockRepository.changeMenuItemPosition).toHaveBeenCalledWith('1', [
        { id: '1', position: 3 },
        { id: '2', position: 1 },
        { id: '3', position: 2 },
      ]);
      expect(result).toEqual(updatedItem);
    });

    it('should change item position moving up', async () => {
      const itemToUpdate = { id: '3', slug: 'item-3', position: 3, categoryId: 'cat-1' };
      const items = [
        { id: '1', slug: 'item-1', position: 1 },
        { id: '2', slug: 'item-2', position: 2 },
        { id: '3', slug: 'item-3', position: 3 },
      ];
      const updatedItem = { id: '3', slug: 'item-3', position: 1 };

      mockRepository.getMenuItemById.mockResolvedValue(itemToUpdate);
      mockRepository.getMenuItemsByCategoryId.mockResolvedValue(items);
      mockRepository.changeMenuItemPosition.mockResolvedValue(updatedItem);

      const result = await service.changeMenuItemPosition({ id: '3', position: 1 });

      expect(mockRepository.changeMenuItemPosition).toHaveBeenCalledWith('3', [
        { id: '1', position: 2 },
        { id: '2', position: 3 },
        { id: '3', position: 1 },
      ]);
      expect(result).toEqual(updatedItem);
    });

    it('should throw AppError.notFound when item not found', async () => {
      mockRepository.getMenuItemById.mockResolvedValue(null);

      await expect(service.changeMenuItemPosition({ id: 'non-existent', position: 1 })).rejects.toThrow(AppError);
      await expect(service.changeMenuItemPosition({ id: 'non-existent', position: 1 })).rejects.toMatchObject({
        error: { message: 'Menu item not found' },
      });
    });

    it('should throw AppError.internalServerError on unexpected error', async () => {
      const itemToUpdate = { id: '1', slug: 'item-1', position: 1, categoryId: 'cat-1' };

      mockRepository.getMenuItemById.mockResolvedValue(itemToUpdate);
      mockRepository.getMenuItemsByCategoryId.mockRejectedValue(new Error('DB error'));

      await expect(service.changeMenuItemPosition({ id: '1', position: 2 })).rejects.toThrow(AppError);
      await expect(service.changeMenuItemPosition({ id: '1', position: 2 })).rejects.toMatchObject({
        error: { message: 'Failed to change menu item position' },
      });
    });
  });

  describe('createMenuItemTranslation', () => {
    it('should create a menu item translation', async () => {
      const createData = { title: 'Espresso', description: 'Strong coffee', language: 'EN', itemId: '1' };
      const mockTranslation = { id: 't1', ...createData };

      mockRepository.createMenuItemTranslation.mockResolvedValue(mockTranslation);

      const result = await service.createMenuItemTranslation(createData);

      expect(mockRepository.createMenuItemTranslation).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockTranslation);
    });

    it('should throw AppError.badRequest for invalid language', async () => {
      const createData = { title: 'Espresso', language: 'INVALID', itemId: '1' };

      await expect(service.createMenuItemTranslation(createData)).rejects.toThrow(AppError);
    });

    it('should throw AppError.internalServerError on unexpected error', async () => {
      const createData = { title: 'Espresso', language: 'EN', itemId: '1' };

      mockRepository.createMenuItemTranslation.mockRejectedValue(new Error('DB error'));

      await expect(service.createMenuItemTranslation(createData)).rejects.toThrow(AppError);
      await expect(service.createMenuItemTranslation(createData)).rejects.toMatchObject({
        error: { message: 'Failed to create menu item translation' },
      });
    });
  });

  describe('updateMenuItemTranslation', () => {
    it('should update a menu item translation', async () => {
      const updateData = { id: 't1', title: 'Updated Title', description: 'Updated desc' };
      const mockUpdated = { ...updateData };

      mockRepository.updateMenuItemTranslation.mockResolvedValue(mockUpdated);

      const result = await service.updateMenuItemTranslation(updateData);

      expect(mockRepository.updateMenuItemTranslation).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockUpdated);
    });

    it('should throw AppError.internalServerError on unexpected error', async () => {
      const updateData = { id: 't1', title: 'Updated Title' };

      mockRepository.updateMenuItemTranslation.mockRejectedValue(new Error('DB error'));

      await expect(service.updateMenuItemTranslation(updateData)).rejects.toThrow(AppError);
      await expect(service.updateMenuItemTranslation(updateData)).rejects.toMatchObject({
        error: { message: 'Failed to update menu item translation' },
      });
    });
  });

  describe('deleteMenuItemTranslation', () => {
    it('should delete a translation and return success response', async () => {
      mockRepository.deleteMenuItemTranslation.mockResolvedValue({ id: 't1' });

      const result = await service.deleteMenuItemTranslation('t1');

      expect(mockRepository.deleteMenuItemTranslation).toHaveBeenCalledWith('t1');
      expect(result).toEqual({ success: true, message: 'Menu item translation with id t1 deleted successfully' });
    });

    it('should throw AppError.internalServerError on unexpected error', async () => {
      mockRepository.deleteMenuItemTranslation.mockRejectedValue(new Error('DB error'));

      await expect(service.deleteMenuItemTranslation('t1')).rejects.toThrow(AppError);
      await expect(service.deleteMenuItemTranslation('t1')).rejects.toMatchObject({
        error: { message: 'Failed to delete menu item translation' },
      });
    });
  });
});
