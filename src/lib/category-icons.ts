'use client';

import {
  Car,
  Building2,
  Smartphone,
  Briefcase,
  Wrench,
  Shirt,
  Home,
  Dumbbell,
  type LucideIcon,
} from 'lucide-react';

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  'vehicles': Car,
  'real-estate': Building2,
  'electronics': Smartphone,
  'jobs': Briefcase,
  'services': Wrench,
  'fashion': Shirt,
  'home-garden': Home,
  'sports': Dumbbell,
};

const DEFAULT_ICON = Wrench;

export function getCategoryIcon(slug: string): LucideIcon {
  return CATEGORY_ICON_MAP[slug] ?? DEFAULT_ICON;
}

export { CATEGORY_ICON_MAP };
