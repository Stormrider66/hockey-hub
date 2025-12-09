/**
 * TemplateCard Component
 * 
 * Enhanced template card with ratings, analytics, and social features
 */

import React, { useState } from 'react';
import { 
  Star, 
  Download, 
  Eye, 
  Heart, 
  Bookmark,
  Users,
  Clock,
  Crown,
  Verified,
  TrendingUp,
  MoreHorizontal,
  Play,
  Award,
  Zap,
  Target,
  Activity,
  Dumbbell
} from '@/components/icons';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TemplateMarketplaceItem } from '../../types/template.types';
import { useTranslation } from 'react-i18next';

interface TemplateCardProps {
  template: TemplateMarketplaceItem;
  onSelect: (template: TemplateMarketplaceItem) => void;
  onPreview: (templateId: string) => void;
  onInteraction: (templateId: string, action: 'viewed' | 'downloaded' | 'bookmarked' | 'liked') => void;
  currentUserId: string;
  compact?: boolean;
  listView?: boolean;
  showTrendingBadge?: boolean;
}

const WORKOUT_TYPE_ICONS = {
  STRENGTH: Dumbbell,
  CONDITIONING: Activity,
  HYBRID: Zap,
  AGILITY: Target,
} as const;

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-800 border-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  advanced: 'bg-orange-100 text-orange-800 border-orange-200',
  elite: 'bg-red-100 text-red-800 border-red-200',
} as const;

const CERTIFICATION_COLORS = {
  basic: 'bg-blue-100 text-blue-800',
  professional: 'bg-purple-100 text-purple-800',
  expert: 'bg-amber-100 text-amber-800',
} as const;

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  onPreview,
  onInteraction,
  currentUserId,
  compact = false,
  listView = false,
  showTrendingBadge = false
}) => {
  const { t } = useTranslation('physicalTrainer');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(template.socialMetrics.likes);
  
  const WorkoutIcon = WORKOUT_TYPE_ICONS[template.type as keyof typeof WORKOUT_TYPE_ICONS];
  
  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInteraction(template.id, 'viewed');
    onPreview(template.id);
  };
  
  const handleSelect = () => {
    onInteraction(template.id, 'downloaded');
    onSelect(template);
  };
  
  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    onInteraction(template.id, 'bookmarked');
  };
  
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    onInteraction(template.id, 'liked');
  };
  
  const renderStarRating = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    
    return (
      <div className="flex items-center">
        {Array.from({ length: fullStars }, (_, i) => (
          <Star key={i} className={cn(iconSize, 'fill-yellow-400 text-yellow-400')} />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className={cn(iconSize, 'text-gray-300')} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className={cn(iconSize, 'fill-yellow-400 text-yellow-400')} />
            </div>
          </div>
        )}
        {Array.from({ length: 5 - Math.ceil(rating) }, (_, i) => (
          <Star key={i + fullStars} className={cn(iconSize, 'text-gray-300')} />
        ))}
      </div>
    );
  };
  
  const renderBadges = () => (
    <div className="flex flex-wrap gap-1 mb-2">
      {showTrendingBadge && (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <TrendingUp className="h-3 w-3 mr-1" />
          Trending
        </Badge>
      )}
      
      {template.isPremium && (
        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <Crown className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      )}
      
      {template.officialApproval && (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <Verified className="h-3 w-3 mr-1" />
          Official
        </Badge>
      )}
      
      {template.certificationLevel && (
        <Badge 
          variant="outline" 
          className={cn('text-xs', CERTIFICATION_COLORS[template.certificationLevel])}
        >
          <Award className="h-3 w-3 mr-1" />
          {template.certificationLevel.charAt(0).toUpperCase() + template.certificationLevel.slice(1)}
        </Badge>
      )}
      
      <Badge 
        variant="outline" 
        className={cn('text-xs', DIFFICULTY_COLORS[template.difficulty])}
      >
        {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
      </Badge>
    </div>
  );
  
  const renderCreatorInfo = () => (
    <div className="flex items-center gap-2 mb-3">
      <Avatar className="h-6 w-6">
        <AvatarFallback className="text-xs">
          {template.creatorInfo.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>{template.creatorInfo.name}</span>
        {template.creatorInfo.verified && (
          <Verified className="h-3 w-3 text-blue-500" />
        )}
      </div>
    </div>
  );
  
  const renderStats = (inline: boolean = false) => {
    const statsClass = inline ? 'flex items-center gap-4' : 'grid grid-cols-2 gap-2';
    const itemClass = inline ? 'flex items-center gap-1' : 'flex items-center gap-1 text-xs';
    
    return (
      <div className={cn(statsClass, 'text-muted-foreground')}>
        <div className={itemClass}>
          <Download className="h-3 w-3" />
          <span>{template.downloadCount.toLocaleString()}</span>
        </div>
        <div className={itemClass}>
          <Users className="h-3 w-3" />
          <span>{template.reviewCount}</span>
        </div>
        <div className={itemClass}>
          <Clock className="h-3 w-3" />
          <span>{template.duration}min</span>
        </div>
        <div className={itemClass}>
          <Heart className={cn('h-3 w-3', isLiked && 'fill-red-500 text-red-500')} />
          <span>{likeCount}</span>
        </div>
      </div>
    );
  };
  
  const renderActionButtons = () => (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePreview}>
              <Play className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Preview</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={handleBookmark}
            >
              <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bookmark</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={handleLike}
            >
              <Heart className={cn('h-4 w-4', isLiked && 'fill-red-500 text-red-500')} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Like</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handlePreview}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
  
  if (listView) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="p-3 rounded-lg bg-primary/10">
                  <WorkoutIcon className="h-6 w-6 text-primary" />
                </div>
              </div>
              
              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 
                      className="font-semibold text-lg line-clamp-1 cursor-pointer hover:underline"
                      onClick={handleSelect}
                    >
                      {template.name}
                    </h3>
                    {renderCreatorInfo()}
                  </div>
                  <div className="flex items-center gap-2">
                    {template.isPremium && template.price && (
                      <Badge className="bg-green-100 text-green-800">
                        ${template.price}
                      </Badge>
                    )}
                    {!template.isPremium && (
                      <Badge variant="outline">Free</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mb-3">
                  {renderStarRating(template.averageStarRating)}
                  <span className="text-sm text-muted-foreground">
                    ({template.reviewCount} reviews)
                  </span>
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs', DIFFICULTY_COLORS[template.difficulty])}
                  >
                    {template.difficulty}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {template.description}
                </p>
                
                {renderStats(true)}
              </div>
              
              {/* Actions */}
              <div className="flex-shrink-0">
                {renderActionButtons()}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-full"
    >
      <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <WorkoutIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {renderActionButtons()}
            </div>
          </div>
          
          {renderBadges()}
          
          <CardTitle 
            className="text-lg line-clamp-2 cursor-pointer hover:underline"
            onClick={handleSelect}
          >
            {template.name}
          </CardTitle>
          
          {renderCreatorInfo()}
          
          <div className="flex items-center gap-2 mb-2">
            {renderStarRating(template.averageStarRating)}
            <span className="text-sm text-muted-foreground">
              ({template.reviewCount})
            </span>
            {template.isPremium && template.price && (
              <Badge className="ml-auto bg-green-100 text-green-800">
                ${template.price}
              </Badge>
            )}
            {!template.isPremium && (
              <Badge variant="outline" className="ml-auto">Free</Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {!compact && (
            <CardDescription className="mb-4 line-clamp-3">
              {template.description}
            </CardDescription>
          )}
          
          {renderStats()}
          
          <div className="flex items-center gap-2 mt-4">
            <Button 
              onClick={handleSelect}
              className="flex-1"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              {template.isPremium ? 'Purchase' : 'Download'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePreview}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TemplateCard;