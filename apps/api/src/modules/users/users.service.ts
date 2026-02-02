import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  UpdateProfileDto,
  CreateAddressDto,
  UpdateAddressDto,
  ChangePasswordDto,
} from './dto';
import { AuthService } from '../auth/auth.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        addresses: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isEmailVerified: true,
      },
    });

    return updatedUser;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  /**
   * Get user addresses
   */
  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Create new address
   */
  async createAddress(userId: string, createAddressDto: CreateAddressDto) {
    // If this is the first address or marked as default, update other addresses
    if (createAddressDto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // Check if user has no addresses, make this one default
    const existingAddresses = await this.prisma.address.count({
      where: { userId },
    });

    return this.prisma.address.create({
      data: {
        ...createAddressDto,
        userId,
        isDefault: createAddressDto.isDefault || existingAddresses === 0,
      },
    });
  }

  /**
   * Update address
   */
  async updateAddress(
    userId: string,
    addressId: string,
    updateAddressDto: UpdateAddressDto,
  ) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('You can only update your own addresses');
    }

    // If setting as default, update other addresses
    if (updateAddressDto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: updateAddressDto,
    });
  }

  /**
   * Delete address
   */
  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('You can only delete your own addresses');
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    // If deleted address was default, make another one default
    if (address.isDefault) {
      const firstAddress = await this.prisma.address.findFirst({
        where: { userId },
      });

      if (firstAddress) {
        await this.prisma.address.update({
          where: { id: firstAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: 'Address deleted successfully' };
  }

  /**
   * Set default address
   */
  async setDefaultAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('You can only update your own addresses');
    }

    // Remove default from all other addresses
    await this.prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    // Set this address as default
    return this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }

  /**
   * Get user order history
   */
  async getOrderHistory(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: {
          items: {
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
          shippingAddress: true,
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============ ADMIN METHODS ============

  /**
   * Get all users (Admin only)
   */
  async getAllUsers(
    page = 1,
    limit = 10,
    search?: string,
    role?: string,
    isActive?: boolean,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }

    if (role) {
      where.role = role as 'USER' | 'ADMIN';
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID (Admin only)
   */
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        lastLogin: true,
        addresses: true,
        orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
          },
        },
        _count: {
          select: { orders: true, reviews: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user status (Admin only)
   */
  async updateUserStatus(id: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });
  }

  /**
   * Update user role (Admin only)
   */
  async updateUserRole(id: string, role: 'USER' | 'ADMIN') {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });
  }

  /**
   * Delete user (Admin only)
   */
  async deleteUser(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete by deactivating
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'User deleted successfully' };
  }
}
