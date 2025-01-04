import { filter } from 'remeda';
import { z } from 'zod';

export const formDataSchema = z.object({
  id: z.string().trim().optional(),
  title: z.string().min(2, '제목은 최소 2자 이상 입력해 주십시오.').trim(),
  content: z.string().min(1, '내용을 입력하세요.').trim(),
});

const validImageTypes = ['image/jpg', 'image/jpeg', 'image/png'];

export const imageFilesSchema = z
  .array(
    z.object({
      type: z.string(),
    }),
  )
  .superRefine((files, ctx) => {
    if (files.length <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '파일을 최소 1개 업로드해야 합니다.',
      });
    }
    if (files.length > 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '파일은 최대 8개까지 업로드할 수 있습니다.',
      });
    }
    const invalidFiles = filter(files, (file) => !validImageTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '파일 형식이 잘못되었습니다. jpg, jpeg, png만 허용됩니다.',
      });
    }
  });
