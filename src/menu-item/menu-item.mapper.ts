import type { MenuItemWithTranslation } from 'src/generated-types/menu-item';
import type { MenuItemWithTranslationsPayload } from './menu-item.repository';

export function toMenuItemWithTranslation(prisma: MenuItemWithTranslationsPayload): MenuItemWithTranslation {
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
