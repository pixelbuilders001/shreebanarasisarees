import { Product } from '../data/products';
import { DbInventory } from '../data/supabase';

export type CollectionType = 'automatic' | 'manual';
export type DisplayStyle = 'horizontal' | 'grid' | 'category_cards' | 'banner' | 'banners_showcase' | 'banner_showcase' | 'pinterest_grid' | 'featured' | string;
export type SectionType = 'products' | 'categories' | 'banner' | string;

export interface CollectionRule {
  id?: string;
  field: 'selling_price' | 'stock' | 'category' | 'fabric' | 'color' | 'occasion' | 'bestseller' | 'new_arrival' | string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: string | number | boolean | (string | number)[];
}

export interface Collection {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  collection_type: CollectionType;
  rules?: CollectionRule[] | null;
  sort_by?: 'newest' | 'price_low' | 'price_high' | 'best_selling' | string | null;
  product_limit?: number | null;
  is_active: boolean;
  banner_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CollectionProduct {
  id?: string;
  collection_id: string;
  product_id?: string;
  inventory_id?: string;
  sort_order: number;
  created_at?: string;
}

export interface HomepageSection {
  id: string;
  title: string;
  subtitle?: string | null;
  image_url?: string | null;
  collection_id?: string | null;
  section_type?: SectionType;
  display_style: DisplayStyle;
  sort_order: number;
  view_all_text?: string | null;
  view_all_url?: string | null;
  is_active: boolean;
  start_at?: string | null;
  end_at?: string | null;
  created_at?: string;
  updated_at?: string;
  
  // Resolved relation data (populated at fetch time)
  collection?: Collection | null;
  products?: Product[];
}

/**
 * Safe storefront representation of inventory products.
 * Guarantees no sensitive inventory fields (e.g. purchase_price, supplier info) are included.
 */
export interface StorefrontProduct extends DbInventory {
  // Alias / extension for strict typing
}
