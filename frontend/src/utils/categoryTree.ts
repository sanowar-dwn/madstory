import { Category } from '../types';

/**
 * Builds a clean, fully recursive category tree of arbitrary depth from a flat or partial list.
 */
export function buildCategoryTree(categories: Category[]): Category[] {
  if (!categories || categories.length === 0) return [];

  // Create a normalized map of all categories with an empty subcategories array
  const map = new Map<number, Category & { subcategories: Category[] }>();
  
  // First pass: register all categories
  categories.forEach((cat) => {
    map.set(cat.id, {
      ...cat,
      subcategories: [],
    });
  });

  const roots: (Category & { subcategories: Category[] })[] = [];

  // Second pass: attach each category to its parent if parent exists in map, else root
  categories.forEach((cat) => {
    const node = map.get(cat.id)!;
    if (cat.parent && map.has(cat.parent) && cat.parent !== cat.id) {
      map.get(cat.parent)!.subcategories.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort recursively by display_order, then name
  const sortRecursive = (nodes: (Category & { subcategories: Category[] })[]) => {
    nodes.sort((a, b) => {
      const orderA = a.display_order ?? 0;
      const orderB = b.display_order ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => {
      if (n.subcategories.length > 0) {
        sortRecursive(n.subcategories as (Category & { subcategories: Category[] })[]);
      }
    });
  };

  sortRecursive(roots);
  return roots;
}

export interface FlattenedCategoryItem extends Category {
  depth: number;
  pathNames: string[];
  parentChain: Category[];
}

/**
 * Recursively flattens an arbitrary depth category tree with depth and breadcrumb path metadata.
 */
export function flattenCategoryTree(
  tree: Category[],
  depth = 0,
  parentChain: Category[] = []
): FlattenedCategoryItem[] {
  const result: FlattenedCategoryItem[] = [];

  for (const node of tree) {
    const currentChain = [...parentChain, node];
    const pathNames = currentChain.map((c) => c.name);

    result.push({
      ...node,
      depth,
      pathNames,
      parentChain: currentChain,
    });

    if (node.subcategories && node.subcategories.length > 0) {
      result.push(...flattenCategoryTree(node.subcategories, depth + 1, currentChain));
    }
  }

  return result;
}

/**
 * Returns a Set containing all descendant category IDs of a given category ID.
 * Used to prevent circular hierarchies (a category cannot be its own ancestor).
 */
export function getDescendantIds(catId: number, allCategories: Category[]): Set<number> {
  const descendants = new Set<number>();

  const collect = (parentId: number) => {
    for (const cat of allCategories) {
      if (cat.parent === parentId && !descendants.has(cat.id)) {
        descendants.add(cat.id);
        collect(cat.id);
      }
    }
  };

  collect(catId);
  return descendants;
}

/**
 * Recursively searches any depth category tree for a category matching the predicate.
 */
export function findCategoryInTree(
  tree: Category[],
  predicate: (cat: Category) => boolean
): Category | undefined {
  for (const cat of tree) {
    if (predicate(cat)) return cat;
    if (cat.subcategories && cat.subcategories.length > 0) {
      const found = findCategoryInTree(cat.subcategories, predicate);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Retrieves the breadcrumb ancestry chain (from top-level root down to the target category)
 * from a flat or tree list of categories.
 */
export function getCategoryAncestry(
  target: number | string,
  categories: Category[]
): Category[] {
  const map = new Map<number, Category>();
  const slugMap = new Map<string, Category>();

  const register = (cats: Category[]) => {
    cats.forEach((c) => {
      map.set(c.id, c);
      slugMap.set(c.slug, c);
      if (c.subcategories && c.subcategories.length > 0) {
        register(c.subcategories);
      }
    });
  };
  register(categories);

  const startNode = typeof target === 'number' ? map.get(target) : slugMap.get(target);
  if (!startNode) return [];

  const chain: Category[] = [startNode];
  let current = startNode;
  const visited = new Set<number>([current.id]);

  while (current.parent && map.has(current.parent) && !visited.has(current.parent)) {
    visited.add(current.parent);
    current = map.get(current.parent)!;
    chain.unshift(current);
  }

  return chain;
}

/**
 * Checks if a category or any of its recursive descendants matches a search string.
 */
export function categoryMatchesSearch(cat: Category, searchLower: string): boolean {
  if (!searchLower) return true;
  if (
    cat.name.toLowerCase().includes(searchLower) ||
    (cat.name_en && cat.name_en.toLowerCase().includes(searchLower)) ||
    cat.slug.toLowerCase().includes(searchLower) ||
    (cat.description && cat.description.toLowerCase().includes(searchLower))
  ) {
    return true;
  }
  if (cat.subcategories && cat.subcategories.length > 0) {
    return cat.subcategories.some((child) => categoryMatchesSearch(child, searchLower));
  }
  return false;
}
