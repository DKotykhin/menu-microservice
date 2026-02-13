import type {
  MenuCategoryWithTranslation,
  MenuCategoryWithItems,
  MenuCategory,
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
