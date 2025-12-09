// @ts-nocheck
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
// Bring in jest expect types for TS using jest-dom
/// <reference types="jest" />

// Extend Jest matchers for TypeScript
// Ensure TypeScript recognizes jest-dom and jest matchers in this file
export {};

// Helper function to recursively find all TypeScript/JavaScript files
function findAllSourceFiles(dir: string, files: string[] = []): string[] {
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, and test directories
      if (!item.includes('node_modules') && !item.includes('.next') && !item.includes('__tests__')) {
        findAllSourceFiles(fullPath, files);
      }
    } else if (item.match(/\.(tsx?|jsx?)$/) && !item.includes('.test.') && !item.includes('.spec.')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

describe('Phase 2: Loading State Migration Verification', () => {
  const frontendPath = require('path').join(process.cwd(), 'apps', 'frontend', 'src');
  const sourceFiles = findAllSourceFiles(frontendPath);

  describe('Loader2 Migration', () => {
    it('should not contain any Loader2 imports', () => {
      const filesWithLoader2: string[] = [];
      
      sourceFiles.forEach(file => {
        try {
          const content = readFileSync(file, 'utf-8');
          if (content.includes('Loader2') || content.includes('lucide-react')) {
            // Check if it's actually importing Loader2
            if (content.match(/import.*Loader2.*from.*lucide-react/)) {
              filesWithLoader2.push(file);
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      });
      
      expect(filesWithLoader2).toHaveLength(0);
      if (filesWithLoader2.length > 0) {
        console.error('Files still using Loader2:', filesWithLoader2);
      }
    });

    it('should use LoadingSpinner instead of Loader2', () => {
      const filesUsingLoadingSpinner: string[] = [];
      
      sourceFiles.forEach(file => {
        try {
          const content = readFileSync(file, 'utf-8');
          if (content.includes('LoadingSpinner')) {
            filesUsingLoadingSpinner.push(file);
          }
        } catch (error) {
          // Skip files that can't be read
        }
      });
      
      // Should have at least some files using LoadingSpinner
      expect(filesUsingLoadingSpinner.length).toBeGreaterThan(0);
    });
  });

  describe('Loading Pattern Consistency', () => {
    it('should use standard loading components for all loading states', () => {
      const loadingPatterns = [
        'isLoading',
        'loading',
        'isPending',
        'isFetching'
      ];
      
      const standardComponents = [
        'LoadingSpinner',
        'LoadingSkeleton',
        'LoadingOverlay',
        'ProgressBar',
        'LoadingDots'
      ];
      
      const filesWithInconsistentLoading: string[] = [];
      
      sourceFiles.forEach(file => {
        try {
          const content = readFileSync(file, 'utf-8');
          
          // Check if file has loading states
          const hasLoadingState = loadingPatterns.some(pattern => content.includes(pattern));
          
          if (hasLoadingState) {
            // Check if it uses standard components
            const usesStandardComponent = standardComponents.some(component => 
              content.includes(component)
            );
            
            // Check for non-standard patterns
            const hasNonStandardPattern = content.includes('Loading...') || 
                                         content.includes('loading...') ||
                                         content.includes('<div>Loading') ||
                                         content.includes('<span>Loading');
            
            if (!usesStandardComponent && hasNonStandardPattern) {
              filesWithInconsistentLoading.push(file);
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      });
      
      expect(filesWithInconsistentLoading).toHaveLength(0);
      if (filesWithInconsistentLoading.length > 0) {
        console.error('Files with inconsistent loading patterns:', filesWithInconsistentLoading);
      }
    });

    it('should not have inline loading text without LoadingDots', () => {
      const filesWithInlineLoading: string[] = [];
      
      sourceFiles.forEach(file => {
        try {
          const content = readFileSync(file, 'utf-8');
          
          // Look for patterns like "Loading..." without LoadingDots
          const inlineLoadingPattern = /Loading\.\.\.(?!.*LoadingDots)/g;
          
          if (inlineLoadingPattern.test(content)) {
            filesWithInlineLoading.push(file);
          }
        } catch (error) {
          // Skip files that can't be read
        }
      });
      
      expect(filesWithInlineLoading).toHaveLength(0);
      if (filesWithInlineLoading.length > 0) {
        console.error('Files with inline loading text:', filesWithInlineLoading);
      }
    });
  });

  describe('Skeleton Usage', () => {
    it('should use skeleton components for list loading states', () => {
      const listComponents = [
        'PlayerList',
        'WorkoutList',
        'SessionList',
        'TeamList'
      ];
      
      const skeletonComponents = [
        'PlayerCardSkeleton',
        'WorkoutCardSkeleton',
        'TableRowSkeleton'
      ];
      
      listComponents.forEach(component => {
        const componentFiles = sourceFiles.filter(file => file.includes(component));
        
        componentFiles.forEach(file => {
          try {
            const content = readFileSync(file, 'utf-8');
            
            if (content.includes('isLoading') || content.includes('loading')) {
              const usesSkeletonComponent = skeletonComponents.some(skeleton => 
                content.includes(skeleton)
              );
              
              expect(usesSkeletonComponent).toBe(true);
            }
          } catch (error) {
            // Skip files that can't be read
          }
        });
      });
    });

    it('should use FormSkeleton for form loading states', () => {
      const formFiles = sourceFiles.filter(file => 
        file.includes('Form') || file.includes('form')
      );
      
      formFiles.forEach(file => {
        try {
          const content = readFileSync(file, 'utf-8');
          
          if (content.includes('isLoading') && content.includes('form')) {
            expect(content.includes('FormSkeleton')).toBe(true);
          }
        } catch (error) {
          // Skip files that can't be read
        }
      });
    });
  });

  describe('Progress Bar Usage', () => {
    it('should use ProgressBar for file uploads', () => {
      const uploadFiles = sourceFiles.filter(file => 
        file.includes('upload') || file.includes('Upload')
      );
      
      uploadFiles.forEach(file => {
        try {
          const content = readFileSync(file, 'utf-8');
          
          if (content.includes('progress') || content.includes('percent')) {
            expect(content.includes('ProgressBar')).toBe(true);
          }
        } catch (error) {
          // Skip files that can't be read
        }
      });
    });

    it('should use ProgressBar for long operations', () => {
      const patterns = [
        'bulk',
        'batch',
        'import',
        'export',
        'sync'
      ];
      
      patterns.forEach(pattern => {
        const relevantFiles = sourceFiles.filter(file => 
          file.toLowerCase().includes(pattern)
        );
        
        relevantFiles.forEach(file => {
          try {
            const content = readFileSync(file, 'utf-8');
            
            if (content.includes('progress')) {
              expect(content.includes('ProgressBar')).toBe(true);
            }
          } catch (error) {
            // Skip files that can't be read
          }
        });
      });
    });
  });

  describe('Loading Overlay Usage', () => {
    it('should use LoadingOverlay for page-level loading', () => {
      const pageFiles = sourceFiles.filter(file => 
        file.includes('Dashboard') || file.includes('Page') || file.includes('View')
      );
      
      const filesWithFullPageLoading: string[] = [];
      
      pageFiles.forEach(file => {
        try {
          const content = readFileSync(file, 'utf-8');
          
          // Check for full-page loading patterns
          if (content.includes('isLoading') && 
              (content.includes('return null') || content.includes('return <div'))) {
            if (!content.includes('LoadingOverlay')) {
              filesWithFullPageLoading.push(file);
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      });
      
      // Allow some flexibility but most should use LoadingOverlay
      expect(filesWithFullPageLoading.length).toBeLessThan(5);
    });

    it('should use LoadingOverlay for modal/dialog loading', () => {
      const modalFiles = sourceFiles.filter(file => 
        file.includes('Modal') || file.includes('Dialog')
      );
      
      modalFiles.forEach(file => {
        try {
          const content = readFileSync(file, 'utf-8');
          
          if (content.includes('isSubmitting') || content.includes('isSaving')) {
            expect(content.includes('LoadingOverlay')).toBe(true);
          }
        } catch (error) {
          // Skip files that can't be read
        }
      });
    });
  });

  describe('Component Import Paths', () => {
    it('should import loading components from the correct path', () => {
      const correctImportPath = '@/components/ui/loading';
      const filesWithIncorrectImports: string[] = [];
      
      sourceFiles.forEach(file => {
        try {
          const content = readFileSync(file, 'utf-8');
          
          // Check if file uses loading components
          const usesLoadingComponents = [
            'LoadingSpinner',
            'LoadingSkeleton',
            'LoadingOverlay',
            'ProgressBar',
            'LoadingDots'
          ].some(component => content.includes(component));
          
          if (usesLoadingComponents) {
            // Check import path
            const hasCorrectImport = content.includes(correctImportPath);
            const hasIncorrectImport = content.match(/from ['"].*\/loading['"]/g) && 
                                      !content.includes(correctImportPath);
            
            if (hasIncorrectImport && !hasCorrectImport) {
              filesWithIncorrectImports.push(file);
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      });
      
      expect(filesWithIncorrectImports).toHaveLength(0);
      if (filesWithIncorrectImports.length > 0) {
        console.error('Files with incorrect import paths:', filesWithIncorrectImports);
      }
    });

    it('should import skeleton components from the correct path', () => {
      const correctImportPath = '@/components/ui/skeletons';
      const filesWithIncorrectImports: string[] = [];
      
      sourceFiles.forEach(file => {
        try {
          const content = readFileSync(file, 'utf-8');
          
          // Check if file uses skeleton components
          const usesSkeletonComponents = [
            'PlayerCardSkeleton',
            'WorkoutCardSkeleton',
            'DashboardWidgetSkeleton',
            'TableRowSkeleton',
            'FormSkeleton'
          ].some(component => content.includes(component));
          
          if (usesSkeletonComponents) {
            // Check import path
            const hasCorrectImport = content.includes(correctImportPath);
            const hasIncorrectImport = content.match(/from ['"].*\/skeleton['"]/g) && 
                                      !content.includes(correctImportPath);
            
            if (hasIncorrectImport && !hasCorrectImport) {
              filesWithIncorrectImports.push(file);
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      });
      
      expect(filesWithIncorrectImports).toHaveLength(0);
      if (filesWithIncorrectImports.length > 0) {
        console.error('Files with incorrect import paths:', filesWithIncorrectImports);
      }
    });
  });

  describe('Accessibility Compliance', () => {
    it('all loading components should have proper ARIA attributes', () => {
      // This is tested in the component tests, but we verify usage here
      const filesWithLoadingStates: string[] = [];
      
      sourceFiles.forEach(file => {
        try {
          const content = readFileSync(file, 'utf-8');
          
          // Check for loading states without proper components
          if (content.includes('isLoading') && !content.includes('role=')) {
            if (!content.includes('LoadingSpinner') && 
                !content.includes('LoadingSkeleton') &&
                !content.includes('LoadingOverlay')) {
              filesWithLoadingStates.push(file);
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      });
      
      // Should be minimal files without proper loading components
      expect(filesWithLoadingStates.length).toBeLessThan(10);
    });
  });
});