import { Controller, Get, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Auth } from '../../common/decorators/auth.decorator';
import { Role } from '../../common/guards/roles.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @Auth(Role.ADMIN)
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('analytics')
  @Auth(Role.ADMIN)
  getAnalytics(@Query() query: Record<string, unknown>) {
    return this.adminService.getAnalytics(query);
  }

  @Get('reports/sales')
  @Auth(Role.ADMIN)
  getSalesReport(@Query() query: Record<string, unknown>) {
    return this.adminService.getSalesReport(query);
  }

  @Get('reports/inventory')
  @Auth(Role.ADMIN)
  getInventoryReport() {
    return this.adminService.getInventoryReport();
  }

  @Get('reports/customers')
  @Auth(Role.ADMIN)
  getCustomerReport() {
    return this.adminService.getCustomerReport();
  }
}
