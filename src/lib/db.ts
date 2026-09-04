import { PrismaClient, Prisma } from '@prisma/client';

// ============================================================
// Global Prisma Client Singleton (prevents multiple instances)
// ============================================================

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ============================================================
// Custom Logger for Development
// ============================================================

class PrismaQueryLogger {
  private isDev: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV === 'development';
  }

  log(query: string, params?: string) {
    if (!this.isDev) return;
    
    const timestamp = new Date().toISOString();
    const formattedParams = params ? ` | Params: ${params}` : '';
    console.log(`\x1b[36m[PRISMA]\x1b[0m ${timestamp}${formattedParams}`);
    console.log(`\x1b[90m${query.substring(0, 200)}${query.length > 200 ? '...' : ''}\x1b[0m`);
  }

  error(message: string, error?: unknown) {
    const timestamp = new Date().toISOString();
    console.error(`\x1b[31m[PRISMA ERROR]\x1b[0m ${timestamp}: ${message}`, error || '');
  }
}

const logger = new PrismaQueryLogger();

// ============================================================
// Prisma Client Configuration
// ============================================================

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'warn' },
        ]
      : [
          { emit: 'stdout', level: 'error' },
        ],
    // Error format for better debugging
    errorFormat: 'pretty',
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

// ============================================================
// Query Logging in Development
// ============================================================

if (process.env.NODE_ENV === 'development' && !globalForPrisma.prisma) {
  (db as any).$on('query', (e: { query: string; params: string; duration: number }) => {
    logger.log(e.query, e.params);
  });

  (db as any).$on('error', (e: { message: string; target: unknown }) => {
    logger.error(e.message, e.target);
  });

  (db as any).$on('warn', (e: { message: string; target: unknown }) => {
    console.warn(`\x1b[33m[PRISMA WARN]\x1b[0m: ${e.message}`);
  });
}

// Save to global in development for hot reloading
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// ============================================================
// Database Health Check
// ============================================================

export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  const start = Date.now();
  
  try {
    await db.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      latency: Date.now() - start,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return {
      status: 'unhealthy',
      latency: Date.now() - start,
      error: message,
    };
  }
}

// ============================================================
// Safe Query Executor with Error Handling
// ============================================================

type SafeQueryResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string };

export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  context = 'database'
): Promise<SafeQueryResult<T>> {
  try {
    const data = await queryFn();
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`${context} operation failed: ${message}`, error);
    return { success: false, error: message };
  }
}

// ============================================================
// Transaction Helper
// ============================================================

export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: { timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel }
): Promise<T> {
  return db.$transaction(fn, options);
}

// ============================================================
// Pagination Helpers
// ============================================================

export interface PaginationParams {
  page?: number;
  perPage?: number;
  maxPerPage?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export async function paginate<T>(
  model: {
    count: (args?: Record<string, unknown>) => Promise<number>;
    findMany: (args?: Record<string, unknown>) => Promise<T[]>;
  },
  params: PaginationParams & {
    where?: Record<string, unknown>;
    orderBy?: Record<string, unknown>;
    include?: Record<string, unknown>;
    select?: Record<string, unknown>;
  }
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(
    params.perPage ?? 20,
    params.maxPerPage ?? 100
  );
  const skip = (page - 1) * perPage;

  const [data, totalItems] = await Promise.all([
    model.findMany({
      where: params.where,
      orderBy: params.orderBy,
      include: params.include,
      select: params.select,
      skip,
      take: perPage,
    }),
    model.count({ where: params.where }),
  ]);

  const totalPages = Math.ceil(totalItems / perPage);

  return {
    data,
    pagination: {
      page,
      perPage,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

// ============================================================
// Export Types
// ============================================================

export type { PrismaClient, Prisma };
