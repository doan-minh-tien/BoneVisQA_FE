'use client';

import { useCallback, useRef } from 'react';

/**
 * Guard + form contract for Visual QA chat submit (Student image page pattern).
 *
 * - Call `preventDefault()` on the form `onSubmit` so the browser does not navigate/reload.
 * - Use `isSubmittingRef` so a second click before React re-renders `loading` does not double-post.
 * - Append the optimistic turn in the same tick as clearing the composer (see `appendOptimisticQuestionTurn`).
 */
export function useVisualQaChatSubmit() {
  const isSubmittingRef = useRef(false);

  const beginSubmit = useCallback(() => {
    if (isSubmittingRef.current) return false;
    isSubmittingRef.current = true;
    return true;
  }, []);

  const endSubmit = useCallback(() => {
    isSubmittingRef.current = false;
  }, []);

  return { isSubmittingRef, beginSubmit, endSubmit };
}

export {
  appendOptimisticQuestionTurn,
  mergeTurnsByIdentity,
  removeOptimisticTurnByClientRequestId,
} from '@/lib/student/visual-qa-chat-turns';
