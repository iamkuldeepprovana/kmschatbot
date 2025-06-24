# GCS URL Conversion Feature

This feature automatically converts Google Cloud Storage URLs (`gs://`) to public HTTPS URLs (`https://storage.googleapis.com/`) throughout the application.

## Implementation Details

1. A utility function `convertGcsUrlToHttps` in `lib/utils.ts` handles the conversion:
   - Converts URLs like `gs://bucket/path/to/file.ext` to `https://storage.googleapis.com/bucket/path/to/file.ext`
   - Works on both raw text and URLs within markdown links

2. Conversion happens at two levels:
   - In the main chat page (`app/page.tsx`), when API responses are received
   - In the markdown renderer (`components/MarkdownView.tsx`), as a fallback for any URLs missed by the first level

## Testing

A test page is available at `/test` to verify the URL conversion functionality:
1. Enter text containing a GCS URL
2. Click "Convert URL" to see the converted result
3. The page shows both the raw converted text and how it will appear when rendered as markdown

## Example

```
Original: gs://messerli/WI%20Updating-Appearance%20Non-appearance.docx
Converted: https://storage.googleapis.com/messerli/WI%20Updating-Appearance%20Non-appearance.docx
```

## Notes

- URL encoding of spaces is handled automatically
- Both standalone URLs and URLs within markdown links are converted
- Console logging is included for debugging purposes
