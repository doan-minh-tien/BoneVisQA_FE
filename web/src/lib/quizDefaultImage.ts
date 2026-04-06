import type { QuizQuestionDto } from '@/lib/api/types';
import { resolveApiAssetUrl } from '@/lib/api/client';

/** Ảnh tĩnh trong `public/` — dùng khi import / câu hỏi chưa gắn ảnh (chỉ UI, không ghi DB). */
export const DEFAULT_QUIZ_QUESTION_IMAGE = '/images/quiz-question-default.svg';

export function hasQuizQuestionCustomImage(
  question: Pick<QuizQuestionDto, 'imageUrl'>,
  caseThumbnail?: string | null,
): boolean {
  const u = (question.imageUrl || caseThumbnail || '').toString().trim();
  return Boolean(u);
}

/** Src cho thẻ img: API path hoặc URL đầy đủ nếu có; không thì ảnh mặc định (same-origin). */
export function getLecturerQuestionImageSrc(
  question: Pick<QuizQuestionDto, 'imageUrl'>,
  caseThumbnail?: string | null,
): string {
  if (hasQuizQuestionCustomImage(question, caseThumbnail)) {
    return resolveApiAssetUrl(question.imageUrl || caseThumbnail || '');
  }
  return DEFAULT_QUIZ_QUESTION_IMAGE;
}
