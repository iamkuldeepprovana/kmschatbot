import { useState, useEffect, useRef, useCallback } from 'react';

export function useTypewriter(content: string | undefined, speed = 10, onComplete?: () => void) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const contentRef = useRef(content || '');
  const currentIndexRef = useRef(0);

  // Reset function to handle new content
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    contentRef.current = content || '';
    currentIndexRef.current = 0;
    setDisplayedContent('');
    setIsComplete(false);
  }, [content]);

  // Type the next character
  const typeNextChar = useCallback(() => {
    if (currentIndexRef.current < contentRef.current.length) {
      setDisplayedContent(contentRef.current.slice(0, currentIndexRef.current + 1));
      currentIndexRef.current++;

      // Schedule next character
      timeoutRef.current = setTimeout(typeNextChar, speed);
    } else {
      setIsComplete(true);
      onComplete?.();
    }
  }, [speed, onComplete]);

  useEffect(() => {
    reset();
    if (contentRef.current) {
      timeoutRef.current = setTimeout(typeNextChar, speed);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, speed, reset, typeNextChar]);

  return { displayedContent, isComplete };
}
