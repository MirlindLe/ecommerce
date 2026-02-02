import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      totalUsers,
      newUsersToday,
      newUsersThisMonth,
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalOrders,
      ordersToday,
      ordersThisMonth,
      pendingOrders,
      processingOrders,
      totalRevenue,
      revenueToday,
      revenueThisMonth,
      revenueLastMonth,
      totalCategories,
      totalReviews,
      averageOrderValue,
    ] = await Promise.all([
      // Users
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: thisMonth } },
      }),
      // Products
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.count({
        where: { stock: { lte: 10, gt: 0 }, isActive: true },
      }),
      this.prisma.product.count({
        where: { stock: 0, isActive: true },
      }),
      // Orders
      this.prisma.order.count(),
      this.prisma.order.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: thisMonth } },
      }),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { status: 'PROCESSING' } }),
      // Revenue
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
          paymentStatus: 'PAID',
        },
      }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: today },
          status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
          paymentStatus: 'PAID',
        },
      }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: thisMonth },
          status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
          paymentStatus: 'PAID',
        },
      }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: lastMonth, lte: lastMonthEnd },
          status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
          paymentStatus: 'PAID',
        },
      }),
      // Others
      this.prisma.category.count(),
      this.prisma.review.count(),
      this.prisma.order.aggregate({
        _avg: { total: true },
        where: {
          status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
          paymentStatus: 'PAID',
        },
      }),
    ]);

    // Calculate growth
    const lastMonthRevenue = revenueLastMonth._sum.total?.toNumber() || 0;
    const thisMonthRevenue = revenueThisMonth._sum.total?.toNumber() || 0;
    const revenueGrowth =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    return {
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newThisMonth: newUsersThisMonth,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
      },
      orders: {
        total: totalOrders,
        today: ordersToday,
        thisMonth: ordersThisMonth,
        pending: pendingOrders,
        processing: processingOrders,
      },
      revenue: {
        total: totalRevenue._sum.total?.toNumber() || 0,
        today: revenueToday._sum.total?.toNumber() || 0,
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        growth: Math.round(revenueGrowth * 100) / 100,
      },
      metrics: {
        categories: totalCategories,
        reviews: totalReviews,
        averageOrderValue: averageOrderValue._avg.total?.toNumber() || 0,
      },
    };
  }

  async getAnalytics(query?: Record<string, unknown>) {
    const period = (query?.period as string) || '30d';
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get daily revenue data
    const revenueData = await this.getDailyRevenue(startDate);

    // Get daily orders data
    const ordersData = await this.getDailyOrders(startDate);

    // Get top selling products
    const topProducts = await this.getTopSellingProducts();

    // Get top categories by revenue
    const topCategories = await this.getTopCategories();

    // Get order status distribution
    const orderStatusDistribution = await this.getOrderStatusDistribution();

    // Get recent orders
    const recentOrders = await this.getRecentOrders();

    // Get customer acquisition trend
    const customerAcquisition = await this.getCustomerAcquisition(startDate);

    return {
      period,
      revenueChart: revenueData,
      ordersChart: ordersData,
      topProducts,
      topCategories,
      orderStatusDistribution,
      recentOrders,
      customerAcquisition,
    };
  }

  private async getDailyRevenue(startDate: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
        paymentStatus: 'PAID',
      },
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const dailyRevenue: Record<string, number> = {};
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + order.total.toNumber();
    });

    return Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue * 100) / 100,
    }));
  }

  private async getDailyOrders(startDate: Date) {
    const orders = await this.prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: { id: true },
    });

    const dailyOrders: Record<string, number> = {};
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      dailyOrders[date] = (dailyOrders[date] || 0) + order._count.id;
    });

    return Object.entries(dailyOrders).map(([date, count]) => ({
      date,
      orders: count,
    }));
  }

  private async getTopSellingProducts(limit: number = 10) {
    const products = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const productIds = products.map((p) => p.productId);
    const productDetails = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: true,
      },
    });

    const productMap = new Map(productDetails.map((p) => [p.id, p]));

    return products.map((p) => ({
      product: productMap.get(p.productId),
      totalSold: p._sum.quantity,
      orderCount: p._count.id,
    }));
  }

  private async getTopCategories(limit: number = 5) {
    const orderItems = await this.prisma.orderItem.findMany({
      include: {
        product: {
          select: {
            categoryId: true,
          },
        },
      },
    });

    const categoryRevenue: Record<string, number> = {};
    orderItems.forEach((item) => {
      if (item.product?.categoryId) {
        categoryRevenue[item.product.categoryId] =
          (categoryRevenue[item.product.categoryId] || 0) +
          item.price.toNumber() * item.quantity;
      }
    });

    const sortedCategories = Object.entries(categoryRevenue)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);

    const categoryIds = sortedCategories.map(([id]) => id);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    return sortedCategories.map(([id, revenue]) => ({
      category: categoryMap.get(id),
      revenue: Math.round(revenue * 100) / 100,
    }));
  }

  private async getOrderStatusDistribution() {
    const distribution = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    return distribution.map((d) => ({
      status: d.status,
      count: d._count.id,
    }));
  }

  private async getRecentOrders(limit: number = 10) {
    return this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
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
          take: 3,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
      },
    });
  }

  private async getCustomerAcquisition(startDate: Date) {
    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const dailyUsers: Record<string, number> = {};
    users.forEach((user) => {
      const date = user.createdAt.toISOString().split('T')[0];
      dailyUsers[date] = (dailyUsers[date] || 0) + 1;
    });

    return Object.entries(dailyUsers).map(([date, count]) => ({
      date,
      newUsers: count,
    }));
  }

  async getSalesReport(query: Record<string, unknown>) {
    const startDate = query.startDate
      ? new Date(query.startDate as string)
      : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const endDate = query.endDate
      ? new Date(query.endDate as string)
      : new Date();

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
        paymentStatus: 'PAID',
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                categoryId: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.total.toNumber(),
      0,
    );
    const totalOrders = orders.length;
    const totalItemsSold = orders.reduce(
      (sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    );

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        totalItemsSold,
        averageOrderValue:
          totalOrders > 0
            ? Math.round((totalRevenue / totalOrders) * 100) / 100
            : 0,
      },
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        status: order.status,
        total: order.total,
        itemCount: order.items.length,
        customer: order.user,
      })),
    };
  }

  async getInventoryReport() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        stock: true,
        price: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { stock: 'asc' },
    });

    const outOfStock = products.filter((p) => p.stock === 0);
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10);
    const inStock = products.filter((p) => p.stock > 10);

    const totalInventoryValue = products.reduce(
      (sum, p) => sum + p.price.toNumber() * p.stock,
      0,
    );

    return {
      summary: {
        totalProducts: products.length,
        outOfStockCount: outOfStock.length,
        lowStockCount: lowStock.length,
        inStockCount: inStock.length,
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
      },
      outOfStock,
      lowStock,
      allProducts: products,
    };
  }

  async getCustomerReport() {
    const users = await this.prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
        orders: {
          where: {
            status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
            paymentStatus: 'PAID',
          },
          select: {
            total: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const customerData = users.map((user) => {
      const totalSpent = user.orders.reduce(
        (sum, order) => sum + order.total.toNumber(),
        0,
      );
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        joinedAt: user.createdAt,
        orderCount: user._count.orders,
        totalSpent: Math.round(totalSpent * 100) / 100,
      };
    });

    // Top customers by spending
    const topCustomers = [...customerData]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      summary: {
        totalCustomers: users.length,
        customersWithOrders: users.filter((u) => u._count.orders > 0).length,
      },
      topCustomers,
      allCustomers: customerData,
    };
  }
}
