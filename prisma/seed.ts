import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated-types/client';
import { Language } from './generated-types/enums';
import { config } from 'dotenv';

config({
  path: '.env.local',
});

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const categories = [
  {
    slug: 'coffee',
    position: 1,
    translations: [
      { language: Language.EN, title: 'Coffee', description: 'Our finest coffee selection' },
      { language: Language.UA, title: 'Кава', description: 'Наш найкращий вибір кави' },
      { language: Language.RU, title: 'Кофе', description: 'Наш лучший выбор кофе' },
    ],
    items: [
      {
        slug: 'espresso',
        price: '3.50',
        position: 1,
        translations: [
          { language: Language.EN, title: 'Espresso', description: 'Classic Italian espresso' },
          { language: Language.UA, title: 'Еспресо', description: 'Класичний італійський еспресо' },
          { language: Language.RU, title: 'Эспрессо', description: 'Классический итальянский эспрессо' },
        ],
      },
      {
        slug: 'cappuccino',
        price: '4.50',
        position: 2,
        translations: [
          { language: Language.EN, title: 'Cappuccino', description: 'Espresso with steamed milk foam' },
          { language: Language.UA, title: 'Капучіно', description: 'Еспресо зі збитим молоком' },
          { language: Language.RU, title: 'Капучино', description: 'Эспрессо со взбитым молоком' },
        ],
      },
      {
        slug: 'latte',
        price: '5.00',
        position: 3,
        translations: [
          { language: Language.EN, title: 'Latte', description: 'Espresso with lots of steamed milk' },
          { language: Language.UA, title: 'Лате', description: 'Еспресо з великою кількістю молока' },
          { language: Language.RU, title: 'Латте', description: 'Эспрессо с большим количеством молока' },
        ],
      },
    ],
  },
  {
    slug: 'tea',
    position: 2,
    translations: [
      { language: Language.EN, title: 'Tea', description: 'Premium tea collection' },
      { language: Language.UA, title: 'Чай', description: 'Преміальна колекція чаю' },
      { language: Language.RU, title: 'Чай', description: 'Премиальная коллекция чая' },
    ],
    items: [
      {
        slug: 'green-tea',
        price: '3.00',
        position: 1,
        translations: [
          { language: Language.EN, title: 'Green Tea', description: 'Japanese sencha green tea' },
          { language: Language.UA, title: 'Зелений чай', description: 'Японський зелений чай сенча' },
          { language: Language.RU, title: 'Зелёный чай', description: 'Японский зелёный чай сенча' },
        ],
      },
      {
        slug: 'black-tea',
        price: '3.00',
        position: 2,
        translations: [
          { language: Language.EN, title: 'Black Tea', description: 'Classic Ceylon black tea' },
          { language: Language.UA, title: 'Чорний чай', description: 'Класичний цейлонський чорний чай' },
          { language: Language.RU, title: 'Чёрный чай', description: 'Классический цейлонский чёрный чай' },
        ],
      },
    ],
  },
  {
    slug: 'desserts',
    position: 3,
    translations: [
      { language: Language.EN, title: 'Desserts', description: 'Sweet treats and pastries' },
      { language: Language.UA, title: 'Десерти', description: 'Солодощі та випічка' },
      { language: Language.RU, title: 'Десерты', description: 'Сладости и выпечка' },
    ],
    items: [
      {
        slug: 'cheesecake',
        price: '6.50',
        position: 1,
        translations: [
          { language: Language.EN, title: 'Cheesecake', description: 'New York style cheesecake' },
          { language: Language.UA, title: 'Чізкейк', description: 'Чізкейк у нью-йоркському стилі' },
          { language: Language.RU, title: 'Чизкейк', description: 'Чизкейк в нью-йоркском стиле' },
        ],
      },
      {
        slug: 'croissant',
        price: '4.00',
        position: 2,
        translations: [
          { language: Language.EN, title: 'Croissant', description: 'Buttery French croissant' },
          { language: Language.UA, title: 'Круасан', description: 'Вершковий французький круасан' },
          { language: Language.RU, title: 'Круассан', description: 'Масляный французский круассан' },
        ],
      },
      {
        slug: 'tiramisu',
        price: '7.00',
        position: 3,
        translations: [
          { language: Language.EN, title: 'Tiramisu', description: 'Classic Italian tiramisu' },
          { language: Language.UA, title: 'Тірамісу', description: 'Класичне італійське тірамісу' },
          { language: Language.RU, title: 'Тирамису', description: 'Классическое итальянское тирамису' },
        ],
      },
    ],
  },
];

async function main() {
  console.log('Seeding database...');

  // Clear existing data (respect FK order)
  await prisma.menuItemTranslation.deleteMany();
  await prisma.menuCategoryTranslation.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();

  for (const category of categories) {
    const createdCategory = await prisma.menuCategory.create({
      data: {
        slug: category.slug,
        position: category.position,
        menuCategoryTranslations: {
          create: category.translations,
        },
      },
    });

    for (const item of category.items) {
      await prisma.menuItem.create({
        data: {
          slug: item.slug,
          price: item.price,
          position: item.position,
          categoryId: createdCategory.id,
          menuItemTranslations: {
            create: item.translations,
          },
        },
      });
    }

    console.log(`Created category "${category.slug}" with ${category.items.length} items`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
