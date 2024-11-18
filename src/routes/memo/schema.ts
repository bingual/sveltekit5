import { z } from 'zod';

const validImageTypes = ['image/jpg', 'image/jpeg', 'image/png'];
export const FormDataSchema = z.object({
  id: z.string().trim().optional(),
  title: z.string().min(2, '제목은 최소 2자 이상 입력해 주십시오.').trim(),
  content: z.string().min(1, '내용을 입력하세요.').trim(),
});
