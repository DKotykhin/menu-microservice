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
    it('should return a menu item by ID', async () => {
      const mockMenuItem = { id: '1', title: 'Espresso', price: '3.5' };
      mockRepository.getMenuItemById.mockResolvedValue(mockMenuItem);

      const result = await service.getMenuItemById('1');

      expect(mockRepository.getMenuItemById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockMenuItem);
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
    it('should return menu items for a category', async () => {
      const mockMenuItems = [
        { id: '1', title: 'Espresso', categoryId: 'cat-1' },
        { id: '2', title: 'Americano', categoryId: 'cat-1' },
      ];
      mockRepository.getMenuItemsByCategoryId.mockResolvedValue(mockMenuItems);

      const result = await service.getMenuItemsByCategoryId('cat-1');

      expect(mockRepository.getMenuItemsByCategoryId).toHaveBeenCalledWith('cat-1');
      expect(result).toEqual({ menuItems: mockMenuItems });
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
        language: 'UA',
        title: 'Лате',
        description: 'Кава з молоком',
        price: '4.5',
        menuCategory: { id: 'cat-1' },
      };
      const mockCreatedItem = { id: '1', ...createData, position: 1 };

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
        language: 'UA',
        title: 'Лате',
        description: 'Кава з молоком',
        price: '4.5',
        menuCategory: { id: 'cat-1' },
      };
      const existingItems = [
        { id: '1', title: 'Espresso', position: 1 },
        { id: '2', title: 'Americano', position: 3 },
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
        language: 'UA',
        title: 'Лате',
        description: 'Кава з молоком',
        price: '4.5',
        menuCategory: { id: 'cat-1' },
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
      const updateData = { id: '1', title: 'Updated Title' };
      const mockUpdatedItem = { id: '1', title: 'Updated Title' };

      mockRepository.getMenuItemById.mockResolvedValue(mockUpdatedItem);
      mockRepository.updateMenuItem.mockResolvedValue(mockUpdatedItem);

      const result = await service.updateMenuItem(updateData);

      expect(mockRepository.updateMenuItem).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockUpdatedItem);
    });

    it('should update a menu item with all fields', async () => {
      const updateData = {
        id: '1',
        title: 'Updated Title',
        description: 'Updated Description',
        price: '5.5',
        isAvailable: false,
        imageUrl: 'http://example.com/new-image.jpg',
      };
      const mockUpdatedItem = { ...updateData };

      mockRepository.getMenuItemById.mockResolvedValue({ id: '1', title: 'Old Title' });
      mockRepository.updateMenuItem.mockResolvedValue(mockUpdatedItem);

      const result = await service.updateMenuItem(updateData);

      expect(mockRepository.updateMenuItem).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockUpdatedItem);
    });

    it('should throw AppError.notFound when item not found', async () => {
      const updateData = { id: 'non-existent', title: 'Updated Title' };

      mockRepository.getMenuItemById.mockResolvedValue(null);

      await expect(service.updateMenuItem(updateData)).rejects.toThrow(AppError);
      await expect(service.updateMenuItem(updateData)).rejects.toMatchObject({
        error: { message: 'Menu item with id non-existent not found' },
      });
    });

    it('should throw AppError.internalServerError on error', async () => {
      const updateData = { id: '1', title: 'Updated Title' };

      mockRepository.getMenuItemById.mockResolvedValue({ id: '1', title: 'Old Title' });
      mockRepository.updateMenuItem.mockRejectedValue(new Error('DB error'));

      await expect(service.updateMenuItem(updateData)).rejects.toThrow(AppError);
      await expect(service.updateMenuItem(updateData)).rejects.toMatchObject({
        error: { message: 'Failed to update menu item' },
      });
    });
  });

  describe('deleteMenuItem', () => {
    it('should delete a menu item and return success response', async () => {
      const itemToDelete = { id: '1', title: 'Item 1', position: 2, categoryId: 'cat-1' };
      const items = [
        { id: '1', title: 'Item 1', position: 2 },
        { id: '2', title: 'Item 2', position: 1 },
        { id: '3', title: 'Item 3', position: 3 },
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
      const itemToDelete = { id: '1', title: 'Item 1', position: 3, categoryId: 'cat-1' };
      const items = [
        { id: '1', title: 'Item 1', position: 3 },
        { id: '2', title: 'Item 2', position: 1 },
        { id: '3', title: 'Item 3', position: 2 },
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
      const itemToDelete = { id: '1', title: 'Item 1', position: 1, categoryId: 'cat-1' };

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
      const itemToUpdate = { id: '1', title: 'Item 1', position: 1, categoryId: 'cat-1' };
      const items = [
        { id: '1', title: 'Item 1', position: 1 },
        { id: '2', title: 'Item 2', position: 2 },
        { id: '3', title: 'Item 3', position: 3 },
      ];
      const updatedItem = { id: '1', title: 'Item 1', position: 3 };

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
      const itemToUpdate = { id: '3', title: 'Item 3', position: 3, categoryId: 'cat-1' };
      const items = [
        { id: '1', title: 'Item 1', position: 1 },
        { id: '2', title: 'Item 2', position: 2 },
        { id: '3', title: 'Item 3', position: 3 },
      ];
      const updatedItem = { id: '3', title: 'Item 3', position: 1 };

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
      const itemToUpdate = { id: '1', title: 'Item 1', position: 1, categoryId: 'cat-1' };

      mockRepository.getMenuItemById.mockResolvedValue(itemToUpdate);
      mockRepository.getMenuItemsByCategoryId.mockRejectedValue(new Error('DB error'));

      await expect(service.changeMenuItemPosition({ id: '1', position: 2 })).rejects.toThrow(AppError);
      await expect(service.changeMenuItemPosition({ id: '1', position: 2 })).rejects.toMatchObject({
        error: { message: 'Failed to change menu item position' },
      });
    });
  });
});
