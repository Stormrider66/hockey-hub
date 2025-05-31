// src/lib/design-utils.ts

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names using clsx and optimizes them with tailwind-merge
 * to prevent style conflicts and ensure proper specificity.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Hockey-specific color utilities for consistent use of team colors
 */
export const teamColors = {
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  ice: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  physical: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  // Specific physical training sub-types
  strength: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300", // Example, adjust as needed
  power: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300", // Example, adjust as needed
  testing: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300", // Testing can use amber like medical/alerts
  activation: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300", // Example, adjust as needed
  recovery: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300", // Example, adjust as needed
  game: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  medical: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  meeting: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  travel: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
};

/**
 * Maps event types to their color classes
 */
export function getEventTypeColor(eventType: string): string {
  const colorMap: Record<string, string> = {
    "ice-training": teamColors.ice,
    "physical-training": teamColors.physical,
    "strength-training": teamColors.strength,
    "power-training": teamColors.power,
    "testing-session": teamColors.testing,
    "activation-session": teamColors.activation,
    "recovery-session": teamColors.recovery,
    "game": teamColors.game,
    "medical": teamColors.medical,
    "meeting": teamColors.meeting,
    "travel": teamColors.travel,
    "other": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  };
  
  return colorMap[eventType] || colorMap.other;
}

/**
 * Status badge colors for consistent application across components
 */
export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    // Player availability statuses (as per RULE 4.6)
    "full": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", // Fully available
    "limited": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", // Limited training
    "individual": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300", // Individual training only
    "rehab": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", // In rehab, typically unavailable for team activities
    "unavailable": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", // Completely unavailable

    // Injury / Medical Statuses
    "injury-acute": "bg-red-700 text-white dark:bg-red-800 dark:text-red-100", // Severe/Acute injury phase
    "injury-recovering": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", // Actively in rehabilitation program
    "injury-monitoring": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", // Monitoring, light activity
    "injury-return-to-play": "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300", // Cleared for return to play prog
    "healthy": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", // No current medical issues

    // Service Health Statuses
    "service-healthy": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    "service-degraded": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    "service-error": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",

    // Inventory & Equipment Statuses
    "stock-good": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    "stock-low": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    "stock-out": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "condition-good": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    "condition-fair": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    "condition-poor": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",

    // General statuses
    "active": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    "inactive": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    "pending": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    "archived": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    
    // Default
    "default": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  };
  
  return statusMap[status] || statusMap.default;
}

/**
 * Responsive size utility to generate appropriate classes based on screen size
 */
export function responsiveSize(
  size: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full"
): string {
  const sizeMap: Record<string, string> = {
    "xs": "w-full sm:w-80 md:w-96",
    "sm": "w-full sm:w-96 md:w-[30rem]",
    "md": "w-full sm:w-[30rem] md:w-[36rem] lg:w-[42rem]",
    "lg": "w-full md:w-[42rem] lg:w-[56rem]",
    "xl": "w-full lg:w-[56rem] xl:w-[72rem]",
    "2xl": "w-full xl:w-[72rem] 2xl:w-[96rem]",
    "full": "w-full",
  };
  
  return sizeMap[size] || sizeMap.md;
}

/**
 * Creates truncated text with specified number of lines
 */
export function truncateLines(lines: number): string {
  return cn(
    "overflow-hidden",
    `line-clamp-${lines}`
  );
}

/**
 * Get icon for role-based UI components
 */
export function getRoleIcon(role: string): string {
  const iconMap: Record<string, string> = {
    "admin": "Shield",
    "club_admin": "Building",
    "coach": "Whistle",
    "fys_coach": "Dumbbell",
    "rehab": "HeartPulse",
    "equipment_manager": "Shirt",
    "player": "User",
    "parent": "Users"
  };
  
  return iconMap[role] || "User";
}

/**
 * Utility to generate gradient text for headings
 */
export function gradientText(direction: "tr" | "br" | "r" = "r"): string {
  const directionMap: Record<string, string> = {
    "tr": "from-primary via-blue-500 to-indigo-500",
    "br": "from-primary via-indigo-500 to-purple-500",
    "r": "from-primary to-indigo-500",
  };
  
  return cn(
    "text-transparent bg-clip-text bg-gradient-to-r",
    directionMap[direction]
  );
}

/**
 * Formats date consistently across the application
 */
export function formatDate(date: Date | string, format: "short" | "medium" | "long" = "medium"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  try {
    const options: Intl.DateTimeFormatOptions = format === "short" 
      ? { month: 'numeric', day: 'numeric' }
      : format === "medium"
        ? { year: 'numeric', month: 'short', day: 'numeric' }
        : { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    
    return dateObj.toLocaleDateString('sv-SE', options);
  } catch (error) {
    console.error("Date formatting error:", error);
    return String(date);
  }
}

/**
 * Format time consistently across the application
 */
export function formatTime(
  time: Date | string,
  includeSeconds = false
): string {
  const timeObj = typeof time === "string" ? new Date(time) : time;
  
  try {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      ...(includeSeconds ? { second: "2-digit" } : {}),
    };
    
    return timeObj.toLocaleTimeString('sv-SE', options);
  } catch (error) {
    console.error("Time formatting error:", error);
    return String(time);
  }
}