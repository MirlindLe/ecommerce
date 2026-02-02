import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Auth } from '../../common/decorators/auth.decorator';
import { Role } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Public()
  getAllCategories() {
    return this.categoriesService.getAllCategories();
  }

  @Get('admin/all')
  @Auth(Role.ADMIN)
  getAllCategoriesFlat() {
    return this.categoriesService.getAllCategoriesFlat();
  }

  @Get(':id')
  @Public()
  getCategoryById(@Param('id') id: string) {
    return this.categoriesService.getCategoryById(id);
  }

  @Get('slug/:slug')
  @Public()
  getCategoryBySlug(@Param('slug') slug: string) {
    return this.categoriesService.getCategoryBySlug(slug);
  }

  @Post()
  @Auth(Role.ADMIN)
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.updateCategory(id, dto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  deleteCategory(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }
}
