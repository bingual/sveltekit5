import { PrismaClient } from '@prisma/client';
import { DEV } from 'esm-env';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (DEV) globalForPrisma.prisma = prisma;
