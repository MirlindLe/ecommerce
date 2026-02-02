import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Role } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Get all products with pagination and filters
   * GET /api/products
   */
  @Get()
  @Public()
  getAllProducts(@Query() query: ProductQueryDto) {
    return this.productsService.getAllProducts(query);
  }

  /**
   * Get featured products
   * GET /api/products/featured
   */
  @Get('featured')
  @Public()
  getFeaturedProducts(@Query('limit') limit?: string) {
    return this.productsService.getFeaturedProducts(
      limit ? parseInt(limit) : 8,
    );
  }

  /**
   * Search products
   * GET /api/products/search
   */
  @Get('search')
  @Public()
  searchProducts(@Query('q') query: string, @Query('limit') limit?: string) {
    return this.productsService.searchProducts(
      query,
      limit ? parseInt(limit) : 10,
    );
  }

  /**
   * Get low stock products (Admin)
   * GET /api/products/low-stock
   */
  @Get('low-stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getLowStockProducts(@Query('threshold') threshold?: string) {
    return this.productsService.getLowStockProducts(
      threshold ? parseInt(threshold) : 10,
    );
  }

  /**
   * Get product by slug
   * GET /api/products/slug/:slug
   */
  @Get('slug/:slug')
  @Public()
  getProductBySlug(@Param('slug') slug: string) {
    return this.productsService.getProductBySlug(slug);
  }

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  @Get(':id')
  @Public()
  getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  /**
   * Get related products
   * GET /api/products/:id/related
   */
  @Get(':id/related')
  @Public()
  getRelatedProducts(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.productsService.getRelatedProducts(
      id,
      limit ? parseInt(limit) : 4,
    );
  }

  /**
   * Create product (Admin only)
   * POST /api/products
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createProduct(@Body() createDto: CreateProductDto) {
    return this.productsService.createProduct(createDto);
  }

  /**
   * Update product (Admin only)
   * PATCH /api/products/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateProduct(@Param('id') id: string, @Body() updateDto: UpdateProductDto) {
    return this.productsService.updateProduct(id, updateDto);
  }

  /**
   * Update product stock (Admin only)
   * PATCH /api/products/:id/stock
   */
  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateStock(@Param('id') id: string, @Body('stock') stock: number) {
    return this.productsService.updateStock(id, stock);
  }

  /**
   * Delete product (Admin only)
   * DELETE /api/products/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  deleteProduct(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }
}
