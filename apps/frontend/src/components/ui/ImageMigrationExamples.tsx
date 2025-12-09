/**
 * Image Migration Examples
 * This file demonstrates how to migrate from <img> tags to the OptimizedImage component
 */

import React from 'react';
import { OptimizedImage, Avatar, TeamLogo, HeroImage } from './OptimizedImage';

export const ImageMigrationExamples = () => {
  return (
    <div className="space-y-8 p-8">
      <h1 className="text-2xl font-bold">Image Migration Examples</h1>
      
      {/* Example 1: Basic image replacement */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Basic Image</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Before (img tag):</p>
            <pre className="bg-gray-100 p-2 text-xs overflow-x-auto">
{`<img 
  src="/path/to/image.jpg" 
  alt="Description" 
  className="w-full h-auto"
/>`}
            </pre>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">After (OptimizedImage):</p>
            <pre className="bg-gray-100 p-2 text-xs overflow-x-auto">
{`<OptimizedImage
  src="/path/to/image.jpg"
  alt="Description"
  width={800}
  height={600}
  className="w-full h-auto"
/>`}
            </pre>
          </div>
        </div>
      </section>

      {/* Example 2: Avatar images */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Avatar Images</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Before:</p>
            <pre className="bg-gray-100 p-2 text-xs overflow-x-auto">
{`<img 
  src={user.avatar} 
  alt={user.name}
  className="w-10 h-10 rounded-full"
/>`}
            </pre>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">After:</p>
            <pre className="bg-gray-100 p-2 text-xs overflow-x-auto">
{`<Avatar
  src={user.avatar}
  alt={user.name}
  size="md" // sm, md, lg, xl
  priority={index < 3} // First 3 avatars
/>`}
            </pre>
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-4">
          <Avatar src="/images/avatars/example.jpg" alt="User" size="sm" />
          <Avatar src="/images/avatars/example.jpg" alt="User" size="md" />
          <Avatar src="/images/avatars/example.jpg" alt="User" size="lg" />
          <Avatar src="/images/avatars/example.jpg" alt="User" size="xl" />
        </div>
      </section>

      {/* Example 3: Team logos */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Team Logos</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Before:</p>
            <pre className="bg-gray-100 p-2 text-xs overflow-x-auto">
{`<img 
  src={team.logo} 
  alt={team.name}
  className="w-16 h-16"
/>`}
            </pre>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">After:</p>
            <pre className="bg-gray-100 p-2 text-xs overflow-x-auto">
{`<TeamLogo
  src={team.logo}
  alt={team.name}
  size="md" // sm, md, lg
/>`}
            </pre>
          </div>
        </div>
      </section>

      {/* Example 4: Background/Hero images */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Hero/Background Images</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Before:</p>
            <pre className="bg-gray-100 p-2 text-xs overflow-x-auto">
{`<div className="relative h-96">
  <img 
    src="/hero.jpg" 
    alt="Hero"
    className="absolute inset-0 w-full h-full object-cover"
  />
</div>`}
            </pre>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">After:</p>
            <pre className="bg-gray-100 p-2 text-xs overflow-x-auto">
{`<div className="relative h-96">
  <HeroImage
    src="/hero.jpg"
    alt="Hero"
    className="object-cover"
    priority // Above the fold
  />
</div>`}
            </pre>
          </div>
        </div>
      </section>

      {/* Example 5: Responsive images */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Responsive Images</h2>
        
        <pre className="bg-gray-100 p-2 text-xs overflow-x-auto">
{`<OptimizedImage
  src="/path/to/image.jpg"
  alt="Responsive image"
  width={1200}
  height={800}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  quality={90} // Higher quality for important images
  placeholder="blur" // blur or empty
  blurDataURL={generatedBlurDataURL} // Optional custom blur
/>`}
        </pre>
      </section>

      {/* Example 6: External images */}
      <section>
        <h2 className="text-xl font-semibold mb-4">External Images</h2>
        
        <pre className="bg-gray-100 p-2 text-xs overflow-x-auto">
{`// For external images, ensure the domain is added to next.config.js
<OptimizedImage
  src="https://example.com/image.jpg"
  alt="External image"
  width={400}
  height={300}
  unoptimized={false} // Next.js will still optimize external images
/>`}
        </pre>
      </section>

      {/* Migration checklist */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Migration Checklist</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Replace all {'<img>'} tags with {'<OptimizedImage>'}</li>
          <li>Add width and height props (required unless using fill)</li>
          <li>Use specialized components for avatars and logos</li>
          <li>Add priority prop for above-the-fold images</li>
          <li>Configure sizes prop for responsive images</li>
          <li>Add domains to next.config.js for external images</li>
          <li>Generate blur placeholders for important images</li>
          <li>Test loading states and error fallbacks</li>
        </ul>
      </section>
    </div>
  );
};