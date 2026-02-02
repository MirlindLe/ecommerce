import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user's cart with items and totals
   */
  async getCart(userId: string) {
    // Get or create cart
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                compareAtPrice: true,
                images: true,
                stock: true,
                isActive: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  compareAtPrice: true,
                  images: true,
                  stock: true,
                  isActive: true,
                },
              },
            },
          },
        },
      });
    }

    // Calculate totals
    const items = cart.items.map((item: any) => {
      const price = item.product.price;
      const priceNum =
        typeof price === 'object' && price.toNumber
          ? price.toNumber()
          : Number(price);
      return {
        ...item,
        price: priceNum,
        product: {
          ...item.product,
          price: priceNum,
          images: JSON.parse(item.product.images || '[]'),
        },
        itemTotal: new Decimal(price.toString()).mul(item.quantity),
      };
    });

    const subtotal = items.reduce(
      (acc: Decimal, item: any) => acc.add(item.itemTotal),
      new Decimal(0),
    );

    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    return {
      id: cart.id,
      items,
      subtotal: subtotal.toNumber(),
      itemCount,
    };
  }

  /**
   * Add item to cart
   */
  async addToCart(userId: string, addItemDto: AddToCartDto) {
    const { productId, quantity } = addItemDto;

    // Verify product exists and is active
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }

    // Check stock
    if (product.stock < quantity) {
      throw new BadRequestException(
        `Only ${product.stock} items available in stock`,
      );
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

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      if (product.stock < newQuantity) {
        throw new BadRequestException(
          `Only ${product.stock} items available in stock`,
        );
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Add new item
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(
    userId: string,
    itemId: string,
    updateDto: UpdateCartItemDto,
  ) {
    const { quantity } = updateDto;

    // Find the cart item
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Verify ownership
    if (cartItem.cart.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    // Check stock
    if (cartItem.product.stock < quantity) {
      throw new BadRequestException(
        `Only ${cartItem.product.stock} items available in stock`,
      );
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(userId: string, itemId: string) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (cartItem.cart.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId);
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return {
        message: 'Cart is already empty',
        items: [],
        subtotal: 0,
        itemCount: 0,
      };
    }

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return {
      message: 'Cart cleared successfully',
      items: [],
      subtotal: 0,
      itemCount: 0,
    };
  }

  /**
   * Get cart item count (for header badge)
   */
  async getCartItemCount(userId: string): Promise<number> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          select: { quantity: true },
        },
      },
    });

    if (!cart) {
      return 0;
    }

    return cart.items.reduce((acc, item) => acc + item.quantity, 0);
  }

  /**
   * Validate cart items before checkout
   * Returns list of any issues with items
   */
  async validateCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                compareAtPrice: true,
                stock: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return { valid: false, errors: ['Cart is empty'] };
    }

    const errors: string[] = [];
    const validItems: any[] = [];

    for (const item of cart.items) {
      if (!item.product.isActive) {
        errors.push(`${item.product.name} is no longer available`);
      } else if (item.product.stock < item.quantity) {
        if (item.product.stock === 0) {
          errors.push(`${item.product.name} is out of stock`);
        } else {
          errors.push(
            `Only ${item.product.stock} of ${item.product.name} available`,
          );
        }
      } else {
        validItems.push(item);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      items: validItems,
    };
  }
}
