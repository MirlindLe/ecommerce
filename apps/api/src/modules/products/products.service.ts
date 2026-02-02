import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all products with pagination, filtering, and sorting
   */
  async getAllProducts(query: ProductQueryDto) {
    const {
      page = 1,
      limit = 12,
      search,
      categoryId,
      categorySlug,
      minPrice,
      maxPrice,
      isFeatured,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    // Category filter - include child categories
    if (categoryId) {
      // Get all child category IDs
      const childCategories = await this.prisma.category.findMany({
        where: { parentId: categoryId },
        select: { id: true },
      });
      const categoryIds = [categoryId, ...childCategories.map((c) => c.id)];
      where.categoryId = { in: categoryIds };
    } else if (categorySlug) {
      const category = await this.prisma.category.findUnique({
        where: { slug: categorySlug },
      });
      if (category) {
        // Get all child category IDs
        const childCategories = await this.prisma.category.findMany({
          where: { parentId: category.id },
          select: { id: true },
        });
        const categoryIds = [category.id, ...childCategories.map((c) => c.id)];
        where.categoryId = { in: categoryIds };
      }
    }

    // Price filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Featured filter
    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    // In stock filter
    if (inStock) {
      where.stock = { gt: 0 };
    }

    // Build orderBy
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'price':
        orderBy.price = sortOrder;
        break;
      case 'name':
        orderBy.name = sortOrder;
        break;
      case 'createdAt':
      default:
        orderBy.createdAt = sortOrder;
        break;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          reviews: {
            select: { rating: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    // Calculate average rating for each product
    const productsWithRating = products.map((product) => {
      const ratings = product.reviews.map((r) => r.rating);
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;
      const { reviews, ...productData } = product;
      return {
        ...productData,
        images: JSON.parse(productData.images || '[]'),
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length,
      };
    });

    return {
      data: productsWithRating,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        reviews: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Calculate average rating
    const ratings = product.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

    return {
      ...product,
      images: JSON.parse(product.images || '[]'),
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: product.reviews.length,
    };
  }

  /**
   * Get product by slug
   */
  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        reviews: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const ratings = product.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

    return {
      ...product,
      images: JSON.parse(product.images || '[]'),
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: product.reviews.length,
    };
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit = 8) {
    const products = await this.prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        reviews: {
          select: { rating: true },
        },
      },
      take: limit,
    });

    return products.map((product) => {
      const ratings = product.reviews.map((r) => r.rating);
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;
      const { reviews, ...productData } = product;
      return {
        ...productData,
        images: JSON.parse(productData.images || '[]'),
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length,
      };
    });
  }

  /**
   * Get related products
   */
  async getRelatedProducts(productId: string, limit = 4) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return [];
    }

    const products = await this.prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: productId },
        isActive: true,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        reviews: {
          select: { rating: true },
        },
      },
      take: limit,
    });

    return products.map((p) => {
      const ratings = p.reviews.map((r) => r.rating);
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;
      const { reviews, ...productData } = p;
      return {
        ...productData,
        images: JSON.parse(productData.images || '[]'),
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length,
      };
    });
  }

  /**
   * Search products
   */
  async searchProducts(query: string, limit = 10) {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: true,
      },
      take: limit,
    });

    return products.map((p) => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
    }));
  }

  // ============ ADMIN METHODS ============

  /**
   * Create product (Admin only)
   */
  async createProduct(createDto: CreateProductDto) {
    // Check if SKU already exists
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: createDto.sku },
    });

    if (existingSku) {
      throw new ConflictException('Product with this SKU already exists');
    }

    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createDto.categoryId },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    // Generate slug from name
    const slug = this.generateSlug(createDto.name);

    // Check if slug exists
    const existingSlug = await this.prisma.product.findUnique({
      where: { slug },
    });

    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    const product = await this.prisma.product.create({
      data: {
        ...createDto,
        slug: finalSlug,
        images: JSON.stringify(createDto.images),
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return {
      ...product,
      images: JSON.parse(product.images || '[]'),
    };
  }

  /**
   * Update product (Admin only)
   */
  async updateProduct(id: string, updateDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if SKU already exists (if changing)
    if (updateDto.sku && updateDto.sku !== product.sku) {
      const existingSku = await this.prisma.product.findUnique({
        where: { sku: updateDto.sku },
      });

      if (existingSku) {
        throw new ConflictException('Product with this SKU already exists');
      }
    }

    // Verify category exists (if changing)
    if (updateDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateDto.categoryId },
      });

      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    // Update slug if name changes
    let slug = product.slug;
    if (updateDto.name && updateDto.name !== product.name) {
      slug = this.generateSlug(updateDto.name);
      const existingSlug = await this.prisma.product.findFirst({
        where: { slug, id: { not: id } },
      });
      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const { images, ...restDto } = updateDto;
    const updateData: Prisma.ProductUpdateInput = {
      ...restDto,
      slug,
    };

    if (images) {
      updateData.images = JSON.stringify(images);
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return {
      ...updatedProduct,
      images: JSON.parse(updatedProduct.images || '[]'),
    };
  }

  /**
   * Delete product (Admin only)
   */
  async deleteProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Soft delete by deactivating
    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Product deleted successfully' };
  }

  /**
   * Update product stock
   */
  async updateStock(id: string, quantity: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: { stock: quantity },
      select: { id: true, name: true, stock: true },
    });
  }

  /**
   * Get low stock products (Admin only)
   */
  async getLowStockProducts(threshold = 10) {
    return this.prisma.product.findMany({
      where: {
        stock: { lte: threshold },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        category: {
          select: { name: true },
        },
      },
      orderBy: { stock: 'asc' },
    });
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
