// Design utilities for Hockey Hub
// Following the established design system patterns from the workflow guidelines

/**
 * Event type color mappings
 * @param eventType - The type of event
 * @returns Tailwind CSS classes for background and text color
 */
export function getEventTypeColor(eventType: string): string {
  switch (eventType.toLowerCase()) {
    case 'ice-training':
    case 'ice_training':
    case 'ice':
      return 'bg-blue-100 text-blue-800';
    case 'physical-training':
    case 'physical_training':
    case 'physical':
    case 'gym':
      return 'bg-green-100 text-green-800';
    case 'game':
    case 'match':
      return 'bg-red-100 text-red-800';
    case 'rehab':
    case 'medical':
    case 'rehab-medical':
      return 'bg-amber-100 text-amber-800';
    case 'meeting':
    case 'meetings':
      return 'bg-purple-100 text-purple-800';
    case 'travel':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Player status color mappings
 * @param status - The player's availability status
 * @returns Tailwind CSS classes for background and text color
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'available':
    case 'fully-available':
    case 'fully_available':
    case 'ready':
      return 'bg-green-100 text-green-800';
    case 'limited':
    case 'partial':
      return 'bg-yellow-100 text-yellow-800';
    case 'individual-training':
    case 'individual_training':
    case 'individual':
      return 'bg-orange-100 text-orange-800';
    case 'rehab':
    case 'rehabilitation':
      return 'bg-red-100 text-red-800';
    case 'unavailable':
    case 'out':
    case 'injured':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Icon color mappings for event types
 * @param eventType - The type of event
 * @returns Tailwind CSS classes for icon color
 */
export function getEventTypeIconColor(eventType: string): string {
  switch (eventType.toLowerCase()) {
    case 'ice-training':
    case 'ice_training':
    case 'ice':
      return 'text-blue-600';
    case 'physical-training':
    case 'physical_training':
    case 'physical':
    case 'gym':
      return 'text-green-600';
    case 'game':
    case 'match':
      return 'text-red-600';
    case 'rehab':
    case 'medical':
    case 'rehab-medical':
      return 'text-amber-600';
    case 'meeting':
    case 'meetings':
      return 'text-purple-600';
    case 'travel':
      return 'text-indigo-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Priority level color mappings
 * @param priority - Priority level (high, medium, low)
 * @returns Tailwind CSS classes for background and text color
 */
export function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'high':
    case 'urgent':
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'medium':
    case 'normal':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Team/role color mappings
 * @param team - Team name or role
 * @returns Tailwind CSS classes for background and text color
 */
export function getTeamColor(team: string): string {
  const teamHash = team.toLowerCase().split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-purple-100 text-purple-800',
    'bg-indigo-100 text-indigo-800',
    'bg-pink-100 text-pink-800',
    'bg-teal-100 text-teal-800',
  ];
  
  return colors[Math.abs(teamHash) % colors.length];
}

/**
 * Consistent spacing utilities
 */
export const spacing = {
  section: 'space-y-6',
  card: 'space-y-4',
  item: 'space-y-3',
  inline: 'space-x-4',
  tight: 'space-y-2',
} as const;

/**
 * Consistent border radius utilities
 */
export const radius = {
  small: 'rounded-md',
  medium: 'rounded-lg',
  large: 'rounded-xl',
  full: 'rounded-full',
} as const;

/**
 * Consistent shadow utilities
 */
export const shadows = {
  card: 'shadow-sm hover:shadow-md transition-shadow',
  elevated: 'shadow-md hover:shadow-lg transition-shadow',
  overlay: 'shadow-lg',
} as const;

/**
 * Responsive grid utilities
 */
export const grids = {
  responsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  cards: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  dashboard: 'grid grid-cols-1 md:grid-cols-3 gap-4',
  stats: 'grid grid-cols-2 md:grid-cols-4 gap-4',
} as const;

/**
 * Accessibility helpers
 */
export const a11y = {
  srOnly: 'sr-only',
  focusVisible: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  skipLink: 'absolute -top-10 left-4 z-50 bg-background px-4 py-2 text-foreground transition-all focus:top-4',
} as const;

/**
 * Animation utilities
 */
export const animations = {
  fadeIn: 'animate-in fade-in-0 duration-200',
  slideIn: 'animate-in slide-in-from-bottom-4 duration-300',
  bounce: 'animate-bounce',
  pulse: 'animate-pulse',
} as const; 