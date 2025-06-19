'use client';

import React, { useMemo } from 'react';
import { marked } from 'marked';
import { cn } from '@/lib/utils';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

// Clean markdown links before parsing
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

export function MarkdownView({ content, className }: MarkdownViewProps) {
  // Configure marked options globally
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown - enables tables
    breaks: true, // Line breaks are rendered as <br>
  });

  // Add a custom renderer to handle lists properly
  const renderer = new marked.Renderer();
  marked.use({ renderer });
  
  // Process the markdown content
  const html = useMemo(() => {
    try {
      // Clean links before parsing
      const cleanedContent = cleanMarkdownLinks(content);
      // Convert markdown to HTML
      const rawHtml = marked.parse(cleanedContent);
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
