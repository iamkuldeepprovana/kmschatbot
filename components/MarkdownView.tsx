'use client';

import React, { useMemo } from 'react';
import { marked } from 'marked';
import { cn } from '@/lib/utils';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export function MarkdownView({ content, className }: MarkdownViewProps) {
  // Configure marked options
  marked.use({
    gfm: true, // GitHub Flavored Markdown - enables tables
    breaks: true, // Line breaks are rendered as <br>
  });
  // Process the markdown content
  const html = useMemo(() => {
    try {
      // Convert markdown to HTML
      const rawHtml = marked.parse(content);
      return rawHtml;
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return content;
    }
  }, [content]);

  return (
    <div 
      className={cn(
        className,
        'markdown-content overflow-hidden max-w-full'
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
