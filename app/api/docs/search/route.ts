import { NextRequest } from 'next/server';
import { withApiErrorHandling } from '@/app/lib/apiUtils';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

interface SearchResult {
  title: string;
  description: string;
  url: string;
  category: string;
  excerpt: string;
  tags: string[];
}

export async function GET(request: NextRequest) {
  return withApiErrorHandling(request, async () => {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';

    if (!query) {
      return { results: [] };
    }

    const docs = await searchDocumentation(query);
    return { results: docs };
  });
}

async function searchDocumentation(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const docsDir = path.join(process.cwd(), 'docs');

  // Function to search in a specific directory
  const searchDirectory = (dirPath: string, category: string) => {
    try {
      if (!fs.existsSync(dirPath)) {
        return;
      }

      const items = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);

        if (item.isDirectory()) {
          // Recursively search subdirectories
          searchDirectory(itemPath, category);
        } else if (item.name.endsWith('.md')) {
          try {
            const content = fs.readFileSync(itemPath, 'utf8');
            const { data, content: markdownContent } = matter(content);
            
            // Skip files without proper frontmatter
            if (!data.title) {
              continue;
            }
            
            // Calculate score based on matches in title, description, and content
            const titleScore = data.title.toLowerCase().includes(query.toLowerCase()) ? 3 : 0;
            const descriptionScore = data.description?.toLowerCase().includes(query.toLowerCase()) ? 2 : 0;
            const contentScore = markdownContent.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
            
            const totalScore = titleScore + descriptionScore + contentScore;
            
            // Only include if there's a match
            if (totalScore > 0) {
              // Extract an excerpt around the search term
              let excerpt = '';
              const lowerContent = markdownContent.toLowerCase();
              const queryPosition = lowerContent.indexOf(query.toLowerCase());
              
              if (queryPosition !== -1) {
                const start = Math.max(0, queryPosition - 40);
                const end = Math.min(markdownContent.length, queryPosition + query.length + 40);
                excerpt = markdownContent.substring(start, end);
                
                // Add ellipsis if needed
                if (start > 0) excerpt = '...' + excerpt;
                if (end < markdownContent.length) excerpt = excerpt + '...';
              }
              
              // Calculate the URL for the document
              const relativePath = path.relative(docsDir, itemPath);
              const urlPath = '/docs/' + relativePath.replace(/\.md$/, '');
              
              results.push({
                title: data.title,
                description: data.description || '',
                url: urlPath,
                category: determineCategory(relativePath, data.tags || []),
                excerpt: excerpt || (data.description || '').substring(0, 100),
                tags: data.tags || []
              });
            }
          } catch (error) {
            console.error(`Error processing ${itemPath}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
    }
  };

  // Search through documentation directories
  try {
    searchDirectory(path.join(docsDir, 'architecture'), 'Architecture');
    searchDirectory(path.join(docsDir, 'patterns'), 'Patterns');
    searchDirectory(path.join(docsDir, 'reference'), 'Reference');
    searchDirectory(path.join(docsDir, 'guides'), 'Guides');
    searchDirectory(path.join(docsDir, 'decisions'), 'Decisions');
    searchDirectory(path.join(docsDir, 'standards'), 'Standards');
  } catch (error) {
    console.error('Error searching documentation:', error);
  }

  // Sort results by score (higher scores first)
  results.sort((a, b) => {
    // Check if title matches
    const aTitleMatch = a.title.toLowerCase().includes(query.toLowerCase());
    const bTitleMatch = b.title.toLowerCase().includes(query.toLowerCase());
    
    if (aTitleMatch && !bTitleMatch) return -1;
    if (!aTitleMatch && bTitleMatch) return 1;
    
    // If titles match equally, check description
    const aDescMatch = a.description.toLowerCase().includes(query.toLowerCase());
    const bDescMatch = b.description.toLowerCase().includes(query.toLowerCase());
    
    if (aDescMatch && !bDescMatch) return -1;
    if (!aDescMatch && bDescMatch) return 1;
    
    // If all else is equal, sort by title
    return a.title.localeCompare(b.title);
  });

  return results;
}

// Helper to determine the document category
function determineCategory(filePath: string, tags: string[]): string {
  if (filePath.startsWith('architecture/')) return 'Architecture';
  if (filePath.startsWith('patterns/')) {
    if (filePath.includes('component-patterns')) return 'Component Patterns';
    if (filePath.includes('hooks-patterns')) return 'Hook Patterns';
    if (filePath.includes('api-patterns')) return 'API Patterns';
    return 'Patterns';
  }
  if (filePath.startsWith('reference/')) {
    if (filePath.includes('components')) return 'Components';
    if (filePath.includes('hooks')) return 'Hooks';
    if (filePath.includes('utilities')) return 'Utilities';
    return 'Reference';
  }
  if (filePath.startsWith('guides/')) {
    if (filePath.includes('developer')) return 'Developer Guides';
    if (filePath.includes('operations')) return 'Operations Guides';
    return 'Guides';
  }
  if (filePath.startsWith('decisions/')) return 'Decisions';
  if (filePath.startsWith('standards/')) return 'Standards';
  
  // If we can't determine from path, check tags
  for (const tag of tags) {
    if (['architecture', 'pattern', 'component', 'hook', 'utility', 'guide'].includes(tag)) {
      return tag.charAt(0).toUpperCase() + tag.slice(1);
    }
  }
  
  return 'Documentation';
} 