import * as React from "react";
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLanguage, setTheme, toggleNotification, updateNotifications } from '@/store/features/preferencesSlice';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Globe, Sun, Moon, Bell } from 'lucide-react'; 