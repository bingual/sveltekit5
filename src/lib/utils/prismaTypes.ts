import type { Prisma } from '@prisma/client';

export type PostWithImages = Prisma.PostGetPayload<{
  include: {
    images: {
      select: {
        url: true;
      };
    };
  };
}>;
