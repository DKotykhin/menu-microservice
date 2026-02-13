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
  createMenuItemTranslation: jest.fn(),
  updateMenuItemTranslation: jest.fn(),
  deleteMenuItemTranslation: jest.fn(),
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
      const mockMenuItem = {
        id: '1',
        slug: 'espresso',
        price: '3.50',
        isAvailable: true,
        position: 1,
        translations: [{ id: 't1', title: 'Espresso', language: 'EN' }],
      };
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
          { id: '1', slug: 'espresso', price: '3.50', position: 1, translations: [] },
          { id: '2', slug: 'americano', price: '4.00', position: 2, translations: [] },
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
        slug: 'espresso',
        price: '4.50',
        categoryId: 'cat-1',
      };
      const mockCreatedItem = { id: '1', ...createData, position: 1, isAvailable: true };
      mockService.createMenuItem.mockResolvedValue(mockCreatedItem);

      const result = await controller.createMenuItem(createData);

      expect(mockService.createMenuItem).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockCreatedItem);
    });

    it('should create a menu item with all optional fields', async () => {
      const createData = {
        slug: 'espresso',
        price: '3.50',
        isAvailable: true,
        imageUrl: 'http://example.com/espresso.jpg',
        categoryId: 'cat-1',
      };
      const mockCreatedItem = { id: '1', ...createData, position: 1 };
      mockService.createMenuItem.mockResolvedValue(mockCreatedItem);

      const result = await controller.createMenuItem(createData);

      expect(mockService.createMenuItem).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockCreatedItem);
    });
  });

  describe('updateMenuItem', () => {
    it('should update a menu item and return it', async () => {
      const updateData = { id: '1', slug: 'updated-slug' };
      const mockUpdatedItem = { id: '1', slug: 'updated-slug', price: '3.50', isAvailable: true, position: 1 };
      mockService.updateMenuItem.mockResolvedValue(mockUpdatedItem);

      const result = await controller.updateMenuItem(updateData);

      expect(mockService.updateMenuItem).toHaveBeenCalledWith(updateData);
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
      const mockUpdatedItem = { id: '1', slug: 'item-1', position: 3 };
      mockService.changeMenuItemPosition.mockResolvedValue(mockUpdatedItem);

      const result = await controller.changeMenuItemPosition(positionData);

      expect(mockService.changeMenuItemPosition).toHaveBeenCalledWith(positionData);
      expect(result).toEqual(mockUpdatedItem);
    });

    it('should change item position moving up', async () => {
      const positionData = { id: '3', position: 1 };
      const mockUpdatedItem = { id: '3', slug: 'item-3', position: 1 };
      mockService.changeMenuItemPosition.mockResolvedValue(mockUpdatedItem);

      const result = await controller.changeMenuItemPosition(positionData);

      expect(mockService.changeMenuItemPosition).toHaveBeenCalledWith(positionData);
      expect(result).toEqual(mockUpdatedItem);
    });
  });

  describe('createMenuItemTranslation', () => {
    it('should create a translation and return it', async () => {
      const createData = { title: 'Espresso', description: 'Strong coffee', language: 'EN', itemId: '1' };
      const mockTranslation = { id: 't1', ...createData };
      mockService.createMenuItemTranslation.mockResolvedValue(mockTranslation);

      const result = await controller.createMenuItemTranslation(createData);

      expect(mockService.createMenuItemTranslation).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockTranslation);
    });
  });

  describe('updateMenuItemTranslation', () => {
    it('should update a translation and return it', async () => {
      const updateData = { id: 't1', title: 'Updated Title', description: 'Updated desc' };
      const mockUpdated = { ...updateData };
      mockService.updateMenuItemTranslation.mockResolvedValue(mockUpdated);

      const result = await controller.updateMenuItemTranslation(updateData);

      expect(mockService.updateMenuItemTranslation).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('deleteMenuItemTranslation', () => {
    it('should delete a translation and return status response', async () => {
      const mockResponse = { success: true, message: 'Menu item translation with id t1 deleted successfully' };
      mockService.deleteMenuItemTranslation.mockResolvedValue(mockResponse);

      const result = await controller.deleteMenuItemTranslation({ id: 't1' });

      expect(mockService.deleteMenuItemTranslation).toHaveBeenCalledWith('t1');
      expect(result).toEqual(mockResponse);
    });
  });
});
