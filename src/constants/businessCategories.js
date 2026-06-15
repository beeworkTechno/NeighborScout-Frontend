// src/constants/businessCategories.js

export const BUSINESS_CATEGORIES_WITH_ALL = [
  { id: 'all', name: 'All Categories', label: 'All Categories' },
  { id: 'restaurants', name: 'Restaurants', label: 'Restaurants' },
  { id: 'cafes', name: 'Cafes & Coffee', label: 'Cafes & Coffee' },
  { id: 'bars', name: 'Bars & Pubs', label: 'Bars & Pubs' },
  { id: 'shopping', name: 'Shopping', label: 'Shopping' },
  { id: 'groceries', name: 'Groceries', label: 'Groceries' },
  { id: 'pharmacies', name: 'Pharmacies', label: 'Pharmacies' },
  { id: 'health', name: 'Health & Fitness', label: 'Health & Fitness' },
  { id: 'beauty', name: 'Beauty & Salons', label: 'Beauty & Salons' },
  { id: 'services', name: 'Services', label: 'Services' },
  { id: 'entertainment', name: 'Entertainment', label: 'Entertainment' },
  { id: 'hotels', name: 'Hotels & Lodging', label: 'Hotels & Lodging' },
  { id: 'attractions', name: 'Attractions', label: 'Attractions' },
  { id: 'education', name: 'Education', label: 'Education' },
  { id: 'automotive', name: 'Automotive', label: 'Automotive' },
  { id: 'financial', name: 'Financial', label: 'Financial' },
  { id: 'realestate', name: 'Real Estate', label: 'Real Estate' },
  { id: 'professional', name: 'Professional Services', label: 'Professional Services' }
];

// Export regular categories without 'all'
export const BUSINESS_CATEGORIES = BUSINESS_CATEGORIES_WITH_ALL.filter(
  (cat) => cat.id !== 'all'
);

export const DEFAULT_BUSINESS_CATEGORY = BUSINESS_CATEGORIES[0]?.name || 'Restaurants';

// Export just the names if needed
export const CATEGORY_NAMES = BUSINESS_CATEGORIES_WITH_ALL.map((cat) => cat.name);

// Export category labels mapping
export const CATEGORY_LABELS = BUSINESS_CATEGORIES_WITH_ALL.reduce((acc, cat) => {
  acc[cat.id] = cat.label || cat.name;
  return acc;
}, {});