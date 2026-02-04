import { Module } from '@nestjs/common';
import { MenuCategoryService } from './menu-category.service';
import { MenuCategoryController } from './menu-category.controller';
import { MenuCategoryRepository } from './menu-category.repository';

@Module({
  imports: [],
  controllers: [MenuCategoryController],
  providers: [MenuCategoryService, MenuCategoryRepository],
})
export class MenuCategoryModule {}
