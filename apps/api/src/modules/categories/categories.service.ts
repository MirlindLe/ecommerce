import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all categories with hierarchy
   */
  async getAllCategories() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
            },
            _count: { select: { products: true } },
          },
        },
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });

    return categories;
  }

  /**
   * Get all categories flat list (for admin)
   */
  async getAllCategoriesFlat() {
    return this.prisma.category.findMany({
      include: {
        parent: {
          select: { id: true, name: true },
        },
        _count: { select: { products: true, children: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          where: { isActive: true },
        },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          where: { isActive: true },
        },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  /**
   * Create category (Admin only)
   */
  async createCategory(createDto: CreateCategoryDto) {
    // Generate slug from name
    const slug = this.generateSlug(createDto.name);

    // Check if slug already exists
    const existingSlug = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictException('Category with this name already exists');
    }

    // Verify parent exists if provided
    if (createDto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: createDto.parentId },
      });

      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    return this.prisma.category.create({
      data: {
        ...createDto,
        slug,
      },
      include: {
        parent: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Update category (Admin only)
   */
  async updateCategory(id: string, updateDto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Update slug if name changes
    let slug = category.slug;
    if (updateDto.name && updateDto.name !== category.name) {
      slug = this.generateSlug(updateDto.name);

      const existingSlug = await this.prisma.category.findFirst({
        where: { slug, id: { not: id } },
      });

      if (existingSlug) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    // Verify parent exists if provided
    if (updateDto.parentId) {
      if (updateDto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      const parent = await this.prisma.category.findUnique({
        where: { id: updateDto.parentId },
      });

      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...updateDto,
        slug,
      },
      include: {
        parent: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Delete category (Admin only)
   */
  async deleteCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, children: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category has products
    if (category._count.products > 0) {
      throw new BadRequestException(
        'Cannot delete category with products. Move or delete products first.',
      );
    }

    // Check if category has children
    if (category._count.children > 0) {
      throw new BadRequestException(
        'Cannot delete category with subcategories. Delete subcategories first.',
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
}
