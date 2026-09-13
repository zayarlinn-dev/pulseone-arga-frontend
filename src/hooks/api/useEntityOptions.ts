import { useMemo } from 'react';
import { useDropdown } from './useDropdown';
import type { DropdownItem } from '@/types/api';

/** "Vendor Type", "vendor-type" and "vendortype" all name the same category. */
function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

interface EntityOptionsResult {
  options: DropdownItem[];
  isLoading: boolean;
  /** The category itself is missing, so no options can exist yet. */
  categoryMissing: boolean;
}

/**
 * Options for one lookup category, resolved by name.
 *
 * Entities (UOMs, vendor types, admission types, …) hang off a category row
 * whose id differs per deployment, so the category is looked up by its name
 * first and its id then drives /dropdown/entities. Both queries are cached by
 * useDropdown, so the extra hop costs one request per session.
 */
export function useEntityOptions(categoryName: string): EntityOptionsResult {
  const { data: categories = [], isLoading: loadingCategories } = useDropdown('/dropdown/categories');

  const categoryId = useMemo(
    () => categories.find(category => normalize(category.name) === normalize(categoryName))?.id,
    [categories, categoryName]
  );

  const { data: options = [], isLoading: loadingOptions } = useDropdown(
    '/dropdown/entities',
    { categoryId },
    categoryId != null
  );

  return {
    options,
    isLoading: loadingCategories || (categoryId != null && loadingOptions),
    categoryMissing: !loadingCategories && categoryId == null
  };
}
