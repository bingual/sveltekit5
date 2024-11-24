import type { Prisma } from '@prisma/client';

export type MemoWithImages = Prisma.MemoGetPayload<{
  include: {
    images: {
      select: {
        url: true;
      };
    };
  };
}>;
