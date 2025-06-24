'use client';

import React, { useMemo } from 'react';
import { marked } from 'marked';
import { cn, convertGcsUrlToHttps } from '@/lib/utils';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

// Clean markdown links before parsing
function cleanMarkdownLinks(markdown: string): string {
  // First, convert any gs:// links to https://storage.googleapis.com/
  let processed = convertGcsUrlToHttps(markdown);
  
  // Then handle space encoding in URLs
  return processed.replace(
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
  console.log('Rendering MarkdownView:', { content, className });
  
  // Clean any gs:// URLs in the raw content (outside of markdown links)
  const convertedContent = useMemo(() => {
    return convertGcsUrlToHttps(content);
  }, [content]);
  
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
      const cleanedContent = cleanMarkdownLinks(convertedContent);
      // Convert markdown to HTML
      const rawHtml = marked.parse(cleanedContent);
      return rawHtml;
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return convertedContent;
    }
  }, [convertedContent]);
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
