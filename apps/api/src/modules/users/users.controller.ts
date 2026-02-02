import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Role } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  UpdateProfileDto,
  CreateAddressDto,
  UpdateAddressDto,
  ChangePasswordDto,
} from './dto';

interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ============ PROFILE ROUTES ============

  /**
   * Get current user profile
   * GET /api/users/profile
   */
  @Get('profile')
  getProfile(@Request() req: { user: AuthenticatedUser }) {
    return this.usersService.getProfile(req.user.id);
  }

  /**
   * Update current user profile
   * PATCH /api/users/profile
   */
  @Patch('profile')
  updateProfile(
    @Request() req: { user: AuthenticatedUser },
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, updateDto);
  }

  /**
   * Change password
   * POST /api/users/change-password
   */
  @Post('change-password')
  changePassword(
    @Request() req: { user: AuthenticatedUser },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(req.user.id, changePasswordDto);
  }

  // ============ ADDRESS ROUTES ============

  /**
   * Get user addresses
   * GET /api/users/addresses
   */
  @Get('addresses')
  getAddresses(@Request() req: { user: AuthenticatedUser }) {
    return this.usersService.getAddresses(req.user.id);
  }

  /**
   * Create new address
   * POST /api/users/addresses
   */
  @Post('addresses')
  createAddress(
    @Request() req: { user: AuthenticatedUser },
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.usersService.createAddress(req.user.id, createAddressDto);
  }

  /**
   * Update address
   * PATCH /api/users/addresses/:addressId
   */
  @Patch('addresses/:addressId')
  updateAddress(
    @Request() req: { user: AuthenticatedUser },
    @Param('addressId') addressId: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(
      req.user.id,
      addressId,
      updateAddressDto,
    );
  }

  /**
   * Delete address
   * DELETE /api/users/addresses/:addressId
   */
  @Delete('addresses/:addressId')
  deleteAddress(
    @Request() req: { user: AuthenticatedUser },
    @Param('addressId') addressId: string,
  ) {
    return this.usersService.deleteAddress(req.user.id, addressId);
  }

  /**
   * Set default address
   * PATCH /api/users/addresses/:addressId/default
   */
  @Patch('addresses/:addressId/default')
  setDefaultAddress(
    @Request() req: { user: AuthenticatedUser },
    @Param('addressId') addressId: string,
  ) {
    return this.usersService.setDefaultAddress(req.user.id, addressId);
  }

  // ============ ORDER HISTORY ============

  /**
   * Get order history
   * GET /api/users/orders
   */
  @Get('orders')
  getOrderHistory(
    @Request() req: { user: AuthenticatedUser },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getOrderHistory(
      req.user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  // ============ ADMIN ROUTES ============

  /**
   * Get all users (Admin only)
   * GET /api/users
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.usersService.getAllUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
      role,
      isActive !== undefined ? isActive === 'true' : undefined,
    );
  }

  /**
   * Get user by ID (Admin only)
   * GET /api/users/:id
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  /**
   * Update user status (Admin only)
   * PATCH /api/users/:id/status
   */
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateUserStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.usersService.updateUserStatus(id, isActive);
  }

  /**
   * Update user role (Admin only)
   * PATCH /api/users/:id/role
   */
  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateUserRole(
    @Param('id') id: string,
    @Body('role') role: 'USER' | 'ADMIN',
  ) {
    return this.usersService.updateUserRole(id, role);
  }

  /**
   * Delete user (Admin only)
   * DELETE /api/users/:id
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  deleteUser(
    @Request() req: { user: AuthenticatedUser },
    @Param('id') id: string,
  ) {
    return this.usersService.deleteUser(id, req.user.id);
  }
}
