export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export class PaginationUtil {
  static getSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static getMeta(total: number, page: number, limit: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  static parsePaginationParams(query: any): PaginationParams {
    return {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder === 'asc' ? 'asc' : 'desc',
    };
  }
}
