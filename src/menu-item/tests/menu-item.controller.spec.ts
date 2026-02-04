import { Test, TestingModule } from '@nestjs/testing';

import { MenuItemController } from '../menu-item.controller';
import { MenuItemService } from '../menu-item.service';

const mockService = {
  getMenuItemById: jest.fn(),
  getMenuItemsByCategoryId: jest.fn(),
  createMenuItem: jest.fn(),
  updateMenuItem: jest.fn(),
  deleteMenuItem: jest.fn(),
  changeMenuItemPosition: jest.fn(),
};

describe('MenuItemController', () => {
  let controller: MenuItemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuItemController],
      providers: [{ provide: MenuItemService, useValue: mockService }],
    }).compile();

    controller = module.get<MenuItemController>(MenuItemController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMenuItemById', () => {
    it('should return a menu item by ID', async () => {
      const mockMenuItem = { id: '1', title: 'Espresso', price: '3.5' };
      mockService.getMenuItemById.mockResolvedValue(mockMenuItem);

      const result = await controller.getMenuItemById({ id: '1' });

      expect(mockService.getMenuItemById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockMenuItem);
    });
  });

  describe('getMenuItemsByCategoryId', () => {
    it('should return menu items for a category', async () => {
      const mockMenuItems = {
        menuItems: [
          { id: '1', title: 'Espresso', categoryId: 'cat-1' },
          { id: '2', title: 'Americano', categoryId: 'cat-1' },
        ],
      };
      mockService.getMenuItemsByCategoryId.mockResolvedValue(mockMenuItems);

      const result = await controller.getMenuItemsByCategoryId({ id: 'cat-1' });

      expect(mockService.getMenuItemsByCategoryId).toHaveBeenCalledWith('cat-1');
      expect(result).toEqual(mockMenuItems);
    });

    it('should return empty menu items array when no items in category', async () => {
      const mockMenuItems = { menuItems: [] };
      mockService.getMenuItemsByCategoryId.mockResolvedValue(mockMenuItems);

      const result = await controller.getMenuItemsByCategoryId({ id: 'empty-cat' });

      expect(mockService.getMenuItemsByCategoryId).toHaveBeenCalledWith('empty-cat');
      expect(result).toEqual(mockMenuItems);
    });
  });

  describe('createMenuItem', () => {
    it('should create a menu item and return it', async () => {
      const createData = {
        language: 'UA',
        title: 'Лате',
        description: 'Кава з молоком',
        price: '4.5',
        menuCategory: { id: 'cat-1' },
      };
      const mockCreatedItem = { id: '1', ...createData, position: 1, categoryId: 'cat-1' };
      mockService.createMenuItem.mockResolvedValue(mockCreatedItem);

      const result = await controller.createMenuItem(createData);

      expect(mockService.createMenuItem).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockCreatedItem);
    });

    it('should create a menu item with all optional fields', async () => {
      const createData = {
        language: 'EN',
        title: 'Espresso',
        description: 'Strong coffee',
        price: '3.5',
        isAvailable: true,
        imageUrl: 'http://example.com/espresso.jpg',
        menuCategory: { id: 'cat-1' },
      };
      const mockCreatedItem = { id: '1', ...createData, position: 1, categoryId: 'cat-1' };
      mockService.createMenuItem.mockResolvedValue(mockCreatedItem);

      const result = await controller.createMenuItem(createData);

      expect(mockService.createMenuItem).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockCreatedItem);
    });
  });

  describe('updateMenuItem', () => {
    it('should update a menu item and return it', async () => {
      const updateData = { id: '1', title: 'Updated Title' };
      const mockUpdatedItem = { id: '1', title: 'Updated Title' };
      mockService.updateMenuItem.mockResolvedValue(mockUpdatedItem);

      const result = await controller.updateMenuItem(updateData);

      expect(mockService.updateMenuItem).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockUpdatedItem);
    });

    it('should update a menu item with all fields', async () => {
      const updateData = {
        id: '1',
        language: 'UA',
        title: 'Оновлена назва',
        description: 'Оновлений опис',
        price: '5.5',
        isAvailable: false,
        imageUrl: 'http://example.com/new-image.jpg',
      };
      const mockUpdatedItem = { ...updateData };
      mockService.updateMenuItem.mockResolvedValue(mockUpdatedItem);

      const result = await controller.updateMenuItem(updateData);

      expect(mockService.updateMenuItem).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockUpdatedItem);
    });
  });

  describe('deleteMenuItem', () => {
    it('should delete a menu item and return status response', async () => {
      const mockResponse = { success: true, message: 'Menu item with id 1 deleted successfully' };
      mockService.deleteMenuItem.mockResolvedValue(mockResponse);

      const result = await controller.deleteMenuItem({ id: '1' });

      expect(mockService.deleteMenuItem).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('changeMenuItemPosition', () => {
    it('should change item position and return updated item', async () => {
      const positionData = { id: '1', position: 3 };
      const mockUpdatedItem = { id: '1', title: 'Item', position: 3 };
      mockService.changeMenuItemPosition.mockResolvedValue(mockUpdatedItem);

      const result = await controller.changeMenuItemPosition(positionData);

      expect(mockService.changeMenuItemPosition).toHaveBeenCalledWith(positionData);
      expect(result).toEqual(mockUpdatedItem);
    });

    it('should change item position moving up', async () => {
      const positionData = { id: '3', position: 1 };
      const mockUpdatedItem = { id: '3', title: 'Item 3', position: 1 };
      mockService.changeMenuItemPosition.mockResolvedValue(mockUpdatedItem);

      const result = await controller.changeMenuItemPosition(positionData);

      expect(mockService.changeMenuItemPosition).toHaveBeenCalledWith(positionData);
      expect(result).toEqual(mockUpdatedItem);
    });
  });
});
