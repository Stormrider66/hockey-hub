# Implementation Plan: Tailwind CSS and shadcn/ui for Hockey Hub

## 1. Overview

This document presents a detailed plan for implementing Tailwind CSS and shadcn/ui in the Hockey Hub project based on analysis of the project documentation. The plan covers technical setup, architectural considerations, implementation order, and integration strategies for each main module.

## 2. Technical Setup

### 2.1 Dependencies and Installation

```bash
# Step 1: Install Tailwind CSS and its dependencies
npm install -D tailwindcss postcss autoprefixer

# Step 2: Initialize Tailwind CSS
npx tailwindcss init -p

# Step 3: Install shadcn/ui CLI
npm install -D @shadcn/ui

# Step 4: Initialize shadcn/ui
npx shadcn-ui init
```

Configuration options for shadcn/ui init:
- Style: `default` (or `new-york` for more rounded components)
- Base color: `slate` (neutral) or `blue` (suits hockey theme)
- Global CSS path: `src/styles/globals.css`
- CSS variables: `Yes`
- React Server Components: `No` (since it's standard React)
- Components destination directory: `src/components/ui`
- Utility folder: `src/lib/utils`

### 2.2 Tailwind Configuration

Create/update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Primary colors for Hockey Hub
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // Hockey-specific accent colors
        ice: {
          100: "#f0f8ff", // Light ice
          500: "#cae6ff", // Medium ice
          900: "#2c5282", // Deep ice
        },
        // Additional color categories from shadcn/ui
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 2.3 Global CSS Variables

Update `src/styles/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
 
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    /* Hockey theme - ice blue as primary color */
    --primary: 210 100% 50%;
    --primary-foreground: 210 40% 98%;
 
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
 
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
 
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
 
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
 
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
 
    /* Hockey theme - darker blue in dark mode */
    --primary: 210 100% 40%;
    --primary-foreground: 0 0% 100%;
 
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
 
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
 
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
 
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
 
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
 
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Hockey Hub specific utility classes */
@layer components {
  .hockey-card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700;
  }
  
  .hockey-section {
    @apply py-6 px-4 md:px-6;
  }
  
  .hockey-container {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  }
}
```

## 3. Component Implementation Order

Based on analysis of Hockey Hub documentation, the following implementation order is recommended:

### 3.1 Core Components (Phase 1)

1. **Layout Components**
   - Container
   - Grid
   - Header/Navbar
   - Sidebar
   - Main Content Area
   - Footer

2. **Form Components**
   ```bash
   npx shadcn-ui add button
   npx shadcn-ui add input
   npx shadcn-ui add select
   npx shadcn-ui add checkbox
   npx shadcn-ui add radio-group
   npx shadcn-ui add switch
   npx shadcn-ui add textarea
   npx shadcn-ui add form
   ```

3. **Navigation Components**
   ```bash
   npx shadcn-ui add tabs
   npx shadcn-ui add navigation-menu
   npx shadcn-ui add dropdown-menu
   npx shadcn-ui add sheet
   ```

4. **Feedback Components**
   ```bash
   npx shadcn-ui add alert
   npx shadcn-ui add toast
   npx shadcn-ui add dialog
   ```

### 3.2 Module-Specific Components (Phase 2)

5. **Calendar Components**
   ```bash
   npx shadcn-ui add calendar
   npx shadcn-ui add popover
   npx shadcn-ui add hover-card
   ```

6. **Data Display Components**
   ```bash
   npx shadcn-ui add table
   npx shadcn-ui add data-table
   npx shadcn-ui add card
   npx shadcn-ui add avatar
   npx shadcn-ui add badge
   ```

7. **Administrative Components**
   ```bash
   npx shadcn-ui add command
   npx shadcn-ui add accordion
   npx shadcn-ui add collapsible
   ```

## 4. Integration Strategies for Hockey Hub Modules

### 4.1 Calendar Module (calendar-service)

The calendar is a central component in Hockey Hub and requires special attention.

#### Recommended Components:
- shadcn/ui Calendar component as a base
- Custom Calendar View with Tailwind CSS for layout
- Custom Event Cards with color-coding

#### Example implementation for calendar event:

```tsx
// src/components/calendar/EventCard.tsx
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, MapPin } from "lucide-react"

interface EventCardProps {
  title: string;
  eventType: 'ice-training' | 'physical-training' | 'game' | 'meeting' | 'medical' | 'travel' | 'other';
  startTime: Date;
  endTime: Date;
  location?: string;
  onClick?: () => void;
}

const eventTypeConfig = {
  'ice-training': { color: 'bg-blue-100 text-blue-800', icon: CalendarIcon },
  'physical-training': { color: 'bg-green-100 text-green-800', icon: CalendarIcon },
  'game': { color: 'bg-red-100 text-red-800', icon: CalendarIcon },
  'meeting': { color: 'bg-purple-100 text-purple-800', icon: CalendarIcon },
  'medical': { color: 'bg-amber-100 text-amber-800', icon: CalendarIcon },
  'travel': { color: 'bg-indigo-100 text-indigo-800', icon: CalendarIcon },
  'other': { color: 'bg-gray-100 text-gray-800', icon: CalendarIcon },
};

export function EventCard({ title, eventType, startTime, endTime, location, onClick }: EventCardProps) {
  const { color, icon: Icon } = eventTypeConfig[eventType];
  
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <Badge variant="outline" className={`${color} p-1 h-fit`}>
            <Icon className="h-3 w-3" />
          </Badge>
          <div className="space-y-1">
            <h4 className="font-medium text-sm line-clamp-2">{title}</h4>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="mr-1 h-3 w-3" />
              <span>
                {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {location && (
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="mr-1 h-3 w-3" />
                <span>{location}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 4.2 Training Module (training-service)

For the training module, components for training sessions, exercises, and test results are needed.

#### Recommended Components:
- Card for training sessions
- Accordion for exercise details
- Tabs for organizing different training types
- ProgressBar for displaying test results over time

#### Example of workout template card:

```tsx
// src/components/training/WorkoutTemplateCard.tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Users, Dumbbell } from "lucide-react"

interface WorkoutTemplateCardProps {
  title: string;
  category: string;
  description: string;
  duration: number; // in minutes
  exerciseCount: number;
  onAssign: () => void;
  onEdit: () => void;
  onView: () => void;
}

export function WorkoutTemplateCard({ 
  title, 
  category, 
  description, 
  duration, 
  exerciseCount,
  onAssign,
  onEdit,
  onView
}: WorkoutTemplateCardProps) {
  return (
    <Card className="hockey-card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Badge>{category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            <span>{duration} min</span>
          </div>
          <div className="flex items-center">
            <Dumbbell className="mr-1 h-4 w-4" />
            <span>{exerciseCount} exercises</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button variant="outline" size="sm" onClick={onView}>View</Button>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>
          <Button size="sm" onClick={onAssign}>Assign</Button>
        </div>
      </CardFooter>
    </Card>
  )
}
```

### 4.3 Medical/Rehab Module (medical-service)

The medical module requires secure data presentation and clear status indicators.

#### Recommended Components:
- Stepper for rehab progress
- Alert and Dialog for important medical information
- Status badges with clear colors
- Forms with validation for treatment plans

#### Example of availability status indicator:

```tsx
// src/components/medical/AvailabilityStatus.tsx
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoIcon } from "lucide-react"

type AvailabilityStatus = 'full' | 'limited' | 'individual' | 'rehab-only' | 'unavailable';

interface AvailabilityStatusProps {
  status: AvailabilityStatus;
  notes?: string;
  estimatedReturn?: Date;
}

const statusConfig = {
  'full': { 
    label: 'Full Training',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    description: 'Player is available for all activities'
  },
  'limited': {
    label: 'Limited',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    description: 'Player can participate with restrictions'
  },
  'individual': {
    label: 'Individual Only',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    description: 'Player can only train individually'
  },
  'rehab-only': {
    label: 'Rehabilitation',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    description: 'Player is only doing rehabilitation exercises'
  },
  'unavailable': {
    label: 'Unavailable',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    description: 'Player is completely unavailable'
  }
};

export function AvailabilityStatus({ status, notes, estimatedReturn }: AvailabilityStatusProps) {
  const { label, color, description } = statusConfig[status];
  
  return (
    <div className="flex items-center space-x-2">
      <Badge className={`${color}`}>{label}</Badge>
      
      {(notes || estimatedReturn) && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <InfoIcon className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-2">
                {notes && <p>{notes}</p>}
                {estimatedReturn && (
                  <p className="font-medium">
                    Estimated return: {estimatedReturn.toLocaleDateString()}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
```

### 4.4 Communication Module (communication-service)

The chat function needs responsive and interactive components.

#### Recommended Components:
- Sheet for mobile-friendly chat
- Avatar for user display
- Card for message bubbles
- Command for shortcuts and quick commands

#### Example of chat message:

```tsx
// src/components/communication/ChatMessage.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  isCurrentUser: boolean;
  isRead: boolean;
  hasImage?: boolean;
  imageUrl?: string;
}

export function ChatMessage({ 
  content, 
  sender, 
  timestamp, 
  isCurrentUser,
  isRead,
  hasImage,
  imageUrl
}: ChatMessageProps) {
  return (
    <div className={cn(
      "flex items-end gap-2 mb-4",
      isCurrentUser ? "flex-row-reverse" : "flex-row"
    )}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender.avatar} />
          <AvatarFallback>{sender.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "flex flex-col",
        isCurrentUser ? "items-end" : "items-start"
      )}>
        <Card className={cn(
          "max-w-md",
          isCurrentUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-secondary"
        )}>
          <CardContent className="p-3">
            <div>{content}</div>
            {hasImage && imageUrl && (
              <img 
                src={imageUrl} 
                alt="Shared image"
                className="mt-2 rounded-md max-h-60 w-auto object-contain"
              />
            )}
          </CardContent>
        </Card>
        
        <div className="flex items-center mt-1 text-xs text-muted-foreground">
          <span>{timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isCurrentUser && isRead && (
            <CheckCheck className="ml-1 h-3 w-3 text-primary" />
          )}
        </div>
      </div>
    </div>
  )
}
```

### 4.5 Statistics and Analysis Module (statistics-service)

Data visualization is critical for the statistics module.

#### Recommended Components:
- Recharts for graphs (included in shadcn/ui's ecosystem)
- DataTable for table data
- Card for panel-based dashboards
- Tabs for different data viewing categories

#### Example of statistics overview (dashboard card):

```tsx
// src/components/statistics/StatisticCard.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, BarChart } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type ChartType = 'line' | 'bar' | 'none';

interface StatisticCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  chartType?: ChartType;
  chartData?: Array<{
    name: string;
    value: number;
  }>;
}

export function StatisticCard({ 
  title, 
  value, 
  description, 
  change,
  chartType = 'none',
  chartData = []
}: StatisticCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex items-baseline">
          <h3 className="text-2xl font-bold">{value}</h3>
          {change && (
            <span className={`ml-2 text-sm ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}%
            </span>
          )}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      
      {chartType !== 'none' && chartData.length > 0 && (
        <CardContent>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
```

### 4.6 User Management and Authentication (user-service)

User management requires good security and clear forms.

#### Recommended Components:
- Form with strict validation
- Dialog for account management
- Tabs for profile settings
- Alert for security messages

#### Example of login form:

```tsx
// src/components/auth/LoginForm.tsx
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })
  
  async function handleSubmit(values: LoginFormValues) {
    setIsLoading(true)
    setError(null)
    
    try {
      await onSubmit(values)
    } catch (err) {
      setError("Invalid email or password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Sign In</h1>
        <p className="text-muted-foreground">Enter your credentials to access your account</p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
```

## 5. Internationalization with Tailwind and shadcn/ui

Hockey Hub requires support for both Swedish and English from the start. Here is the implementation strategy:

### 5.1 Setup of i18n with React

```bash
npm install i18next react-i18next i18next-http-backend i18next-browser-languagedetector
```

### 5.2 Create an i18n wrapper component:

```tsx
// src/components/ui/i18n-provider.tsx
import { ReactNode } from "react"
import { I18nextProvider } from "react-i18next"
import i18n from "@/lib/i18n"

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  )
}
```

### 5.3 Adapt shadcn/ui components for i18n:

An example with the form component:

```tsx
// src/components/ui/form.tsx (modified)
import { useTranslation } from "react-i18next"
// Rest of original import from shadcn/ui

// Modify FormMessage to support translated error messages
export function FormMessage({ ...props }) {
  const { t } = useTranslation()
  
  // If the message is a key in our translations, translate it
  const translatedMessage = props.children ? 
    (typeof props.children === 'string' && props.children.startsWith('error.')) ? 
      t(props.children) : props.children 
    : null
  
  return (
    <FormMessageOriginal {...props}>
      {translatedMessage}
    </FormMessageOriginal>
  )
}

// Export other components unchanged...
```

### 5.4 Language switcher component:

```tsx
// src/components/ui/language-switcher.tsx
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"

const languages = [
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [currentLang, setCurrentLang] = useState(i18n.language || 'en')
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    setCurrentLang(lng)
  }
  
  const currentLanguage = languages.find(lng => lng.code === currentLang) || languages[1]
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={currentLang === lang.code ? "bg-accent" : ""}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

## 6. Dark Mode Implementation

Dark Mode support is easy to implement with Tailwind CSS and shadcn/ui by using the CSS variables defined earlier.

### 6.1 Create a ThemeProvider:

```tsx
// src/components/ui/theme-provider.tsx
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "hockey-hub-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement
    
    root.classList.remove("light", "dark")
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"
      
      root.classList.add(systemTheme)
      return
    }
    
    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")
    
  return context
}
```

### 6.2 Create a ThemeSwitcher component:

```tsx
// src/components/ui/theme-switcher.tsx
import { useTheme } from "@/components/ui/theme-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Moon, Sun } from "lucide-react"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <span className="mr-2">💻</span>
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### 6.3 Implementation in App component:

```tsx
// src/App.tsx
import { ThemeProvider } from "@/components/ui/theme-provider"
import { I18nProvider } from "@/components/ui/i18n-provider"
import { Router } from "@/router"

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="hockey-hub-theme">
      <I18nProvider>
        <Router />
      </I18nProvider>
    </ThemeProvider>
  )
}
```

## 7. Responsive Design with Tailwind and shadcn/ui

Hockey Hub needs to be fully responsive to work well on all devices. Here is the strategy:

### 7.1 Layout System for Responsiveness

```tsx
// src/components/layout/responsive-container.tsx
import { cn } from "@/lib/utils"

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

const maxWidthClasses = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
}

export function ResponsiveContainer({ 
  children, 
  className,
  maxWidth = "2xl" 
}: ResponsiveContainerProps) {
  return (
    <div className={cn(
      "w-full mx-auto px-4 sm:px-6 lg:px-8",
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  )
}
```

### 7.2 Responsive Navigation:

```tsx
// src/components/layout/responsive-navbar.tsx
import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { MenuIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon?: React.ReactNode
}

interface ResponsiveNavbarProps {
  logo: React.ReactNode
  navItems: NavItem[]
  userMenu?: React.ReactNode
}

export function ResponsiveNavbar({ logo, navItems, userMenu }: ResponsiveNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            {logo}
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          <ThemeSwitcher />
          <LanguageSwitcher />
          
          {userMenu}
          
          {/* Mobile Menu Trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col space-y-4 py-4">
                <Link to="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
                  {logo}
                </Link>
                <nav className="flex flex-col space-y-3">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
```

## 8. Integration with Hockey Hub Architecture

To ensure the design system fits the project's microservice architecture:

### 8.1 Frontend Structure

```
/frontend
  /src
    /assets            # Images, icons, etc.
    /components
      /ui              # shadcn/ui components
      /layout          # Layout components
      /calendar        # Calendar-related components
      /training        # Training-related components
      /medical         # Medical components
      /communication   # Communication components
      /statistics      # Analysis components
      /auth            # Authentication components
    /hooks             # Custom React hooks
    /lib               # Utilities and helpers
    /services          # API integration with microservices
    /contexts          # React contexts
    /pages             # Page components
    /routes            # Routing configuration
    /styles            # Global CSS and Tailwind config
    /types             # TypeScript type definitions
    /features          # Feature-oriented modules
```

### 8.2 Maintaining Consistency Across Microservices

To ensure consistent design between microservices:

1. **Shared Component Library**: Create a shared component library that all microservices can use.
2. **Storybook**: Implement Storybook to document and showcase UI components.
3. **Design Tokens**: Share design tokens between different frontends through:

```tsx
// src/lib/design-tokens.ts
export const designTokens = {
  // Colors
  colors: {
    primary: "hsl(var(--primary))",
    primaryForeground: "hsl(var(--primary-foreground))",
    // ...other colors
  },
  // Typography
  typography: {
    fontFamily: 'var(--font-family)',
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      // etc.
    },
  },
  // Spacing
  spacing: {
    // Matches Tailwind values
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    // etc.
  },
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  }
}
```

## 9. Performance Optimizations

To ensure optimal performance with Tailwind CSS and shadcn/ui:

### 9.1 Configure Optimization for Production Builds

```js
// tailwind.config.js (updated)
module.exports = {
  // Previous configuration...
  
  // Add this to reduce file size in production
  purge: {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./index.html",
    ],
    options: {
      safelist: [
        // Any dynamically generated classes that need to be preserved
      ],
    },
  },
}
```

### 9.2 Lazy Loading of Components

For large components or pages, use React.lazy and Suspense:

```tsx
// src/pages/index.tsx
import React, { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Lazy loading of heavy pages
const Statistics = React.lazy(() => import('@/pages/statistics'))
const Calendar = React.lazy(() => import('@/pages/calendar'))
const TrainingModule = React.lazy(() => import('@/pages/training'))

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      
      <Route 
        path="/statistics" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <Statistics />
          </Suspense>
        } 
      />
      
      <Route 
        path="/calendar" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <Calendar />
          </Suspense>
        } 
      />
      
      <Route 
        path="/training" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <TrainingModule />
          </Suspense>
        } 
      />
      
      {/* Other routes... */}
    </Routes>
  )
}
```

## 10. Implementation Plan

Based on the project documentation, the following implementation order is recommended:

### Phase 1: Basic Installation (Sprint 1)
1. Install and configure Tailwind CSS
2. Install and configure shadcn/ui
3. Create/Configure theme and color palette
4. Implement ThemeProvider (dark mode)
5. Implement I18nProvider (internationalization)

### Phase 2: Core Components (Sprint 1-2)
1. Layout (Container, Grid, etc.)
2. Navigation system (Header, Sidebar)
3. Basic form elements
4. Feedback components (Alert, Toast)
5. Create Storybook documentation for the component library

### Phase 3: Module-Specific Components (Sprint 2-3)
1. Calendar module components
2. Training module components
3. Medical/Rehab components
4. Communication module components

### Phase 4: Advanced Components (Sprint 3-4)
1. Statistics and analysis components
2. Administrative components
3. Responsive design optimization
4. Performance optimization

### Phase 5: System Integration (Sprint 4+)
1. Integration with APIs
2. Testing on different devices
3. Accessibility testing
4. Performance optimization
5. Complete documentation

## 11. Conclusion

The implementation of Tailwind CSS and shadcn/ui into the Hockey Hub project will provide a modern, consistent, and user-friendly interface that works well on all devices. This plan gives a structured path for implementing the design system incrementally, focusing on establishing a solid foundation first and then building more specific components on top of this foundation.

The benefits of this approach include:
- **Consistency**: A unified visual identity throughout the application
- **Efficiency**: Reusable components that accelerate development
- **Accessibility**: Built-in focus on accessibility from shadcn/ui
- **Maintainability**: Well-structured code that is easy to maintain
- **Adaptability**: Flexibility to customize design to Hockey Hub's specific needs
- **Future-proofing**: Modern tech stack that will remain relevant for a long time

 