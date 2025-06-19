'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { marked } from 'marked';
import { cn } from '@/lib/utils';
import { useTypewriter } from '@/hooks/useTypewriter';

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
  if (!markdown) return '';
  return markdown.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, text, url) => {
      const cleanUrl = url.trim();
      if (cleanUrl.includes(' ') && !(cleanUrl.startsWith('<') && cleanUrl.endsWith('>'))) {
        return `[${text}](${cleanUrl.replace(/ /g, '%20')})`;
      }
      return match;
    }
  );
}

export function TypewriterText({ content, onComplete, className, speed = 10 }: TypewriterTextProps) {
  // Validate and clean input content
  const validContent = typeof content === 'string' ? content : '';
  const contentRef = useRef(validContent);
  
  // Use our custom hook for typewriter effect
  const { displayedContent, isComplete } = useTypewriter(validContent, speed, onComplete);

  // Process the markdown with proper cleanup and caching
  const processedHtml = useMemo(() => {
    if (!displayedContent) return '';
    
    const cleanedContent = cleanMarkdownLinks(displayedContent);
    return Promise.resolve(marked(cleanedContent)).then(html => 
      // Ensure tables are wrapped in a scrollable container
      (typeof html === 'string' ? html : String(html))
        .replace(/<table/g, '<div class="overflow-x-auto w-full"><table')
        .replace(/<\/table>/g, '</table></div>')
    );
  }, [displayedContent]);

  // Handle async markdown rendering
  const [html, setHtml] = useState<string>('');
  
  useEffect(() => {
    Promise.resolve(processedHtml).then(result => setHtml(result));
  }, [processedHtml]);

  return (
    <div 
      className={cn(
        className,
        'markdown-content overflow-hidden max-w-full',
        'prose-pre:overflow-x-auto prose-pre:max-w-full',
        'prose-table:w-full prose-table:overflow-x-auto'
      )}
    >
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
