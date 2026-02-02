import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async getProductReviews(productId: string, query: Record<string, unknown>) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const sortBy = (query.sortBy as string) || 'createdAt';
    const sortOrder = (query.sortOrder as 'asc' | 'desc') || 'desc';
    const rating = query.rating ? Number(query.rating) : undefined;
    const skip = (page - 1) * limit;

    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const where: Record<string, unknown> = { productId };
    if (rating) {
      where.rating = rating;
    }

    const [reviews, total, stats] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
      this.getProductReviewStats(productId),
    ]);

    return {
      reviews,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductReviewStats(productId: string) {
    const stats = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const distribution = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: { rating: true },
    });

    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    distribution.forEach((d) => {
      ratingDistribution[d.rating] = d._count.rating;
    });

    return {
      averageRating: stats._avg.rating || 0,
      totalReviews: stats._count.rating,
      ratingDistribution,
    };
  }

  async createReview(userId: string, dto: CreateReviewDto) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user already reviewed this product
    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId,
        productId: dto.productId,
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this product');
    }

    // Verify user has purchased this product (delivered orders only)
    const hasPurchased = await this.prisma.orderItem.findFirst({
      where: {
        productId: dto.productId,
        order: {
          userId,
          status: 'DELIVERED',
        },
      },
    });

    if (!hasPurchased) {
      throw new BadRequestException(
        'You can only review products you have purchased and received',
      );
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Update product average rating
    await this.updateProductRating(dto.productId);

    return review;
  }

  async updateReview(userId: string, id: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    const updatedReview = await this.prisma.review.update({
      where: { id },
      data: {
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Update product average rating if rating changed
    if (dto.rating) {
      await this.updateProductRating(review.productId);
    }

    return updatedReview;
  }

  async deleteReview(userId: string, id: string, isAdmin: boolean = false) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.review.delete({
      where: { id },
    });

    // Update product average rating
    await this.updateProductRating(review.productId);

    return { message: 'Review deleted successfully' };
  }

  async getUserReviews(userId: string, query: Record<string, unknown>) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { userId } }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllReviews(query: Record<string, unknown>) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const rating = query.rating ? Number(query.rating) : undefined;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (rating) {
      where.rating = rating;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async updateProductRating(productId: string) {
    const stats = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
    });

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        rating: stats._avg.rating || 0,
      },
    });
  }
}
