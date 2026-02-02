import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AddToWishlistDto } from './dto';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async getWishlist(userId: string) {
    const wishlistItems = await this.prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: wishlistItems.map((item) => ({
        id: item.id,
        addedAt: item.createdAt,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          description: item.product.description,
          price: item.product.price,
          compareAtPrice: item.product.compareAtPrice,
          images: JSON.parse(item.product.images || '[]'),
          stock: item.product.stock,
          isActive: item.product.isActive,
          rating: item.product.rating,
          category: item.product.category,
          inStock: item.product.stock > 0,
        },
      })),
      count: wishlistItems.length,
    };
  }

  async addToWishlist(userId: string, dto: AddToWishlistDto) {
    // Verify product exists and is active
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      throw new NotFoundException('Product is no longer available');
    }

    // Check if already in wishlist
    const existingItem = await this.prisma.wishlistItem.findFirst({
      where: {
        userId,
        productId: dto.productId,
      },
    });

    if (existingItem) {
      throw new ConflictException('Product is already in your wishlist');
    }

    const wishlistItem = await this.prisma.wishlistItem.create({
      data: {
        userId,
        productId: dto.productId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: true,
          },
        },
      },
    });

    return {
      message: 'Product added to wishlist',
      item: wishlistItem,
    };
  }

  async removeFromWishlist(userId: string, productId: string) {
    const wishlistItem = await this.prisma.wishlistItem.findFirst({
      where: {
        userId,
        productId,
      },
    });

    if (!wishlistItem) {
      throw new NotFoundException('Product not found in wishlist');
    }

    await this.prisma.wishlistItem.delete({
      where: { id: wishlistItem.id },
    });

    return { message: 'Product removed from wishlist' };
  }

  async clearWishlist(userId: string) {
    await this.prisma.wishlistItem.deleteMany({
      where: { userId },
    });

    return { message: 'Wishlist cleared' };
  }

  async checkInWishlist(userId: string, productId: string) {
    const wishlistItem = await this.prisma.wishlistItem.findFirst({
      where: {
        userId,
        productId,
      },
    });

    return { inWishlist: !!wishlistItem };
  }

  async moveToCart(userId: string, productId: string) {
    // Check if product is in wishlist
    const wishlistItem = await this.prisma.wishlistItem.findFirst({
      where: {
        userId,
        productId,
      },
      include: {
        product: true,
      },
    });

    if (!wishlistItem) {
      throw new NotFoundException('Product not found in wishlist');
    }

    // Check stock
    if (wishlistItem.product.stock < 1) {
      throw new ConflictException('Product is out of stock');
    }

    // Get or create cart
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    // Check if product already in cart
    const existingCartItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    if (existingCartItem) {
      // Update quantity
      await this.prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + 1,
        },
      });
    } else {
      // Add to cart
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity: 1,
        },
      });
    }

    // Remove from wishlist
    await this.prisma.wishlistItem.delete({
      where: { id: wishlistItem.id },
    });

    return { message: 'Product moved to cart' };
  }
}
