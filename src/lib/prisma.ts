import { DEV } from 'esm-env';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (DEV) globalForPrisma.prisma = prisma;
