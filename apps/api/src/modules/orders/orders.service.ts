import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderStatus } from './dto';
import { EmailService } from '../../common/services/email.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async getUserOrders(userId: string, query: Record<string, unknown>) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const status = query.status as string | undefined;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
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
          },
          shippingAddress: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    // Parse product images from JSON string
    const ordersWithParsedImages = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: item.product
          ? {
              ...item.product,
              images: JSON.parse(item.product.images || '[]'),
            }
          : null,
      })),
    }));

    return {
      orders: ordersWithParsedImages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllOrders(query: Record<string, unknown>) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const status = query.status as string | undefined;
    const search = query.search as string | undefined;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { user: { email: { contains: search } } },
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
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
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          shippingAddress: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(userId: string, id: string, isAdmin: boolean = false) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
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
        },
        shippingAddress: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user owns this order (unless admin)
    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    // Parse product images from JSON string
    return {
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: item.product
          ? {
              ...item.product,
              images: JSON.parse(item.product.images || '[]'),
            }
          : null,
      })),
    };
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    // Verify the address belongs to the user
    const address = await this.prisma.address.findFirst({
      where: {
        id: dto.addressId,
        userId,
      },
    });

    if (!address) {
      throw new BadRequestException('Invalid shipping address');
    }

    // Get the user's cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate stock for all items
    for (const item of cart.items) {
      if (item.quantity > item.product.stock) {
        throw new BadRequestException(
          `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}`,
        );
      }
    }

    // Calculate totals
    let subtotal = new Decimal(0);
    const orderItems = cart.items.map((item) => {
      const itemTotal = item.product.price.mul(item.quantity);
      subtotal = subtotal.add(itemTotal);
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
      };
    });

    // Generate order number
    const orderNumber = this.generateOrderNumber();

    // Create the order in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: 'PENDING',
          subtotal,
          tax: subtotal.mul(0.1), // 10% tax
          shippingCost: new Decimal(10), // Flat shipping
          total: subtotal.add(subtotal.mul(0.1)).add(10),
          notes: dto.notes,
          shippingAddressId: dto.addressId,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
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
          },
          shippingAddress: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Update product stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Clear the cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    // Get user for email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // Send order confirmation email
    if (user) {
      await this.emailService.sendOrderConfirmationEmail(
        user.email,
        user.firstName,
        order.orderNumber,
        order.total.toString(),
      );
    }

    return order;
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate status transition
    this.validateStatusTransition(order.status, dto.status);

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.status === OrderStatus.SHIPPED && {
          shippedAt: new Date(),
        }),
        ...(dto.status === OrderStatus.DELIVERED && {
          deliveredAt: new Date(),
        }),
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        shippingAddress: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Send status update email
    await this.emailService.sendEmail({
      to: order.user.email,
      subject: `Order ${order.orderNumber} - Status Update`,
      html: `
        <h1>Order Status Update</h1>
        <p>Hi ${order.user.firstName},</p>
        <p>Your order <strong>${order.orderNumber}</strong> status has been updated to: <strong>${dto.status}</strong></p>
        <p>Thank you for shopping with us!</p>
      `,
    });

    // If cancelled or refunded, restore stock
    if (
      dto.status === OrderStatus.CANCELLED ||
      dto.status === OrderStatus.REFUNDED
    ) {
      await this.restoreOrderStock(id);
    }

    return updatedOrder;
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    // Only pending orders can be cancelled by user
    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        'Only pending orders can be cancelled. Please contact support.',
      );
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        shippingAddress: true,
      },
    });

    // Restore stock
    await this.restoreOrderStock(orderId);

    // Send cancellation email
    await this.emailService.sendEmail({
      to: order.user.email,
      subject: `Order ${order.orderNumber} - Cancelled`,
      html: `
        <h1>Order Cancelled</h1>
        <p>Hi ${order.user.firstName},</p>
        <p>Your order <strong>${order.orderNumber}</strong> has been cancelled.</p>
        <p>If you have any questions, please contact our support team.</p>
      `,
    });

    return updatedOrder;
  }

  private async restoreOrderStock(orderId: string) {
    const orderItems = await this.prisma.orderItem.findMany({
      where: { orderId },
    });

    for (const item of orderItems) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }
  }

  private validateStatusTransition(
    currentStatus: string,
    newStatus: string,
  ): void {
    const validTransitions: Record<string, string[]> = {
      PENDING: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED', 'CANCELLED'],
      DELIVERED: ['REFUNDED'],
      CANCELLED: [],
      REFUNDED: [],
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  async getOrderStats() {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      todayOrders,
      thisMonthOrders,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { status: 'PROCESSING' } }),
      this.prisma.order.count({ where: { status: 'SHIPPED' } }),
      this.prisma.order.count({ where: { status: 'DELIVERED' } }),
      this.prisma.order.count({ where: { status: 'CANCELLED' } }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      }),
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      todayOrders,
      thisMonthOrders,
    };
  }
}
