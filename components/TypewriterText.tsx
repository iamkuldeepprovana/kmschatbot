'use client';

import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { cn } from '@/lib/utils';

interface TypewriterTextProps {
  content: string;
  onComplete?: () => void;
  className?: string;
  speed?: number;
}

// Configure marked options for proper markdown rendering
marked.setOptions({
  breaks: true,  // Add line breaks
  gfm: true      // Use GitHub Flavored Markdown
});

// Clean markdown links by encoding spaces as %20 in URLs
function cleanMarkdownLinks(markdown: string): string {
  return markdown.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, text, url) => {
      // If the URL contains spaces and is not already encoded
      if (url.includes(' ') && !(url.startsWith('<') && url.endsWith('>'))) {
        return `[${text}](${url.replace(/ /g, '%20')})`;
      }
      return match;
    }
  );
}

export function TypewriterText({ content, onComplete, className, speed = 10 }: TypewriterTextProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let currentIndex = 0;
    setIsComplete(false);
    setDisplayedContent('');
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (currentIndex < content.length) {
        setDisplayedContent(prev => prev + content[currentIndex]);
        currentIndex++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsComplete(true);
        onComplete?.();
      }
    }, speed); // Adjust speed here (lower number = faster)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [content, onComplete, speed]);

  // Process the markdown to ensure bullet points are rendered properly
  const processedHtml = marked.parse(cleanMarkdownLinks(displayedContent));

  return (
    <div className={cn(className, 'markdown-content overflow-hidden max-w-full')}>
      <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
    </div>
  );
}
