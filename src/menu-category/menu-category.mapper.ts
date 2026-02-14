import type {
  MenuCategoryWithTranslation,
  MenuCategoryWithItems,
  MenuCategory,
  FlatMenuCategoryWithItems,
} from 'src/generated-types/menu-category';
import type { MenuItemWithTranslation } from 'src/generated-types/menu-item';
import type { MenuCategoryWithItemsPayload, MenuCategoryWithTranslationsPayload } from './menu-category.repository';
import type { MenuCategory as PrismaMenuCategory } from 'prisma/generated-types/client';

export function toMenuCategory(prisma: PrismaMenuCategory): MenuCategory {
  return {
    id: prisma.id,
    slug: prisma.slug,
    position: prisma.position,
    imageUrl: prisma.imageUrl,
    isAvailable: prisma.isAvailable,
    createdAt: prisma.createdAt,
    updatedAt: prisma.updatedAt,
  };
}

export function toMenuCategoryWithTranslation(
  prisma: MenuCategoryWithTranslationsPayload,
): MenuCategoryWithTranslation {
  return {
    id: prisma.id,
    slug: prisma.slug,
    position: prisma.position,
    imageUrl: prisma.imageUrl,
    isAvailable: prisma.isAvailable,
    translations: prisma.menuCategoryTranslations,
  };
}

export function toMenuCategoryWithItems(prisma: MenuCategoryWithItemsPayload): MenuCategoryWithItems {
  return {
    id: prisma.id,
    slug: prisma.slug,
    position: prisma.position,
    imageUrl: prisma.imageUrl,
    isAvailable: prisma.isAvailable,
    translations: prisma.menuCategoryTranslations,
    menuItems: prisma.menuItems.map(toMenuItemWithTranslation),
  };
}

function toMenuItemWithTranslation(prisma: MenuCategoryWithItemsPayload['menuItems'][number]): MenuItemWithTranslation {
  return {
    id: prisma.id,
    slug: prisma.slug,
    price: prisma.price,
    imageUrl: prisma.imageUrl,
    isAvailable: prisma.isAvailable,
    position: prisma.position,
    translations: prisma.menuItemTranslations,
  };
}

export function toMenuCategoryListWithTranslation(prisma: MenuCategoryWithItemsPayload[]): FlatMenuCategoryWithItems[] {
  return prisma.map((category) => ({
    id: category.id,
    slug: category.slug,
    position: category.position,
    imageUrl: category.imageUrl,
    isAvailable: category.isAvailable,
    language: category.menuCategoryTranslations[0]?.language || '', // Assuming at least one translation exists
    title: category.menuCategoryTranslations[0]?.title || '', // Assuming at least one translation exists
    description: category.menuCategoryTranslations[0]?.description || '', // Assuming at least one translation exists
    menuItems: category.menuItems.map((item) => ({
      id: item.id,
      slug: item.slug,
      price: item.price,
      imageUrl: item.imageUrl,
      isAvailable: item.isAvailable,
      position: item.position,
      language: item.menuItemTranslations[0]?.language || '', // Assuming at least one translation exists
      title: item.menuItemTranslations[0]?.title || '', // Assuming at least one translation exists
      description: item.menuItemTranslations[0]?.description || '', // Assuming at least one translation exists
    })),
  }));
}
