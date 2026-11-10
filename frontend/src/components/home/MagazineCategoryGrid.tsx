import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Article, Category } from '../../types';
import { HeartButton } from '../ui/HeartButton';
import { useLanguage } from '../../context/LanguageContext';
import { findCategoryInTree } from '../../utils/categoryTree';
import { api } from '../../services/api';

export interface CategoryBlockData {
  title: string;
  slug: string;
  featuredArticle?: Article | null;
  subArticles?: Article[];
}

export interface MagazineCategoryGridProps {
  blocks?: CategoryBlockData[];
  categories?: Category[];
}

/**
 * Checks whether an article belongs to a target category slug, either directly
 * or through any descendant subcategories.
 */
export function isArticleInCategory(
  article: Article,
  targetSlug: string,
  categoriesList?: Category[]
): boolean {
  if (!article || !targetSlug) return false;

  // 1. Direct match on category_slug
  if (article.category_slug === targetSlug) return true;

  // 2. Direct match in article.categories array
  if (article.categories?.some((c) => c.slug === targetSlug)) return true;

  // 3. Match against subcategories if targetSlug is a parent category
  if (categoriesList && categoriesList.length > 0) {
    const targetCat = findCategoryInTree(categoriesList, (c) => c.slug === targetSlug);
    if (targetCat?.subcategories && targetCat.subcategories.length > 0) {
      const descendantSlugs = new Set<string>();
      const collect = (cats: Category[]) => {
        cats.forEach((c) => {
          descendantSlugs.add(c.slug);
          if (c.subcategories) collect(c.subcategories);
        });
      };
      collect(targetCat.subcategories);

      if (article.categories?.some((c) => descendantSlugs.has(c.slug))) {
        return true;
      }
      if (article.category_slug && descendantSlugs.has(article.category_slug)) {
        return true;
      }
    }
  }

  return false;
}

export const MagazineCategoryGrid: React.FC<MagazineCategoryGridProps> = ({ blocks, categories }) => {
  const { lang, t } = useLanguage();
  const [fetchedArticles, setFetchedArticles] = useState<Record<string, Article[]>>({});

  useEffect(() => {
    if (!blocks || blocks.length === 0) return;

    blocks.forEach((block) => {
      // Check if we need to fetch for this block
      const hasMatchingFeatured = block.featuredArticle && isArticleInCategory(block.featuredArticle, block.slug, categories);
      const hasMatchingSubs = block.subArticles && block.subArticles.length > 0 && block.subArticles.every((s) => isArticleInCategory(s, block.slug, categories));

      if ((!hasMatchingFeatured || !hasMatchingSubs) && !fetchedArticles[block.slug]) {
        api.getArticles({ category__slug: block.slug })
          .then((res) => {
            if (res?.results) {
              setFetchedArticles((prev) => ({
                ...prev,
                [block.slug]: res.results,
              }));
            }
          })
          .catch((err) => {
            console.error(`Error fetching articles for category ${block.slug}:`, err);
          });
      }
    });
  }, [blocks, categories]);

  if (!blocks || blocks.length === 0) return null;

  return (
    <section className="my-10">
      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {blocks.map((block) => {
          const apiArticles = fetchedArticles[block.slug];
          let featured = block.featuredArticle;
          let subList = block.subArticles || [];

          // Discard any provided articles that do not belong to this category
          if (featured && !isArticleInCategory(featured, block.slug, categories)) {
            featured = undefined;
          }
          subList = subList.filter((s) => isArticleInCategory(s, block.slug, categories));

          // If featured is missing or subList is empty, use API-fetched articles
          if ((!featured || subList.length === 0) && apiArticles && apiArticles.length > 0) {
            if (!featured) {
              featured = apiArticles[0];
              subList = apiArticles.slice(1, 4);
            } else if (subList.length === 0) {
              subList = apiArticles.filter((a) => a.id !== featured?.id).slice(0, 3);
            }
          }

          const hasAnyContent = Boolean(featured || subList.length > 0);

          return (
            <div
              key={block.slug}
              className="magazine-card flex flex-col"
            >
              {/* Header Bar: Beige/tan with maroon 'সব' action button */}
              <div className="magazine-card-header">
                <h3 className="font-bengali font-bold text-base text-[#1e2022] tracking-wide">
                  {block.title}
                </h3>
                <Link
                  to={`/category/${block.slug}`}
                  className="badge-sob"
                >
                  {t('nav.all')} →
                </Link>
              </div>

              {!hasAnyContent ? (
                <div className="p-8 text-center text-xs sm:text-sm text-gray-400 font-bengali flex-1 flex items-center justify-center">
                  {lang === 'en' ? 'No articles published in this category yet.' : 'এই বিভাগে এখনও কোনো লেখা যুক্ত হয়নি।'}
                </div>
              ) : (
                <>
                  {/* Featured Post Flush Image */}
                  {featured && (
                    <div className="flex flex-col">
                      <div className="relative aspect-[4/3] w-full overflow-hidden img-zoom-wrapper border-b border-[#e2ddd3]">
                        <Link to={`/post/${featured.slug}`}>
                          <img
                            src={featured.image || '/assets/images/placeholder.jpg'}
                            alt={featured.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        </Link>
                        <div className="absolute top-2.5 right-2.5">
                          <HeartButton
                            slug={featured.slug}
                            initialHearted={featured.is_hearted}
                            initialCount={featured.hearts_count}
                            size="sm"
                          />
                        </div>
                      </div>

                      {/* Primary Featured Article Info */}
                      <div className="p-4 pb-2">
                        <h4 className="font-bengali font-bold text-base sm:text-lg text-[#1e2022] hover:text-[#800020] transition leading-snug mb-1.5">
                          <Link to={`/post/${featured.slug}`}>
                            {(lang === 'en' && featured.title_en) ? featured.title_en : featured.title}
                          </Link>
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-sans">
                          {featured.author?.username ? (
                            <Link to={`/author/${featured.author.username}`} className="hover:text-[#800020] transition">
                              {featured.author.name || featured.author_name}
                            </Link>
                          ) : (
                            <span>{featured.author_name}</span>
                          )}
                          <span>•</span>
                          <span className="font-bengali">{featured.reading_time || '৫ মিনিট'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dotted Divider & Compact Sub-posts List */}
                  {subList.length > 0 && (
                    <>
                      <div className="px-4">
                        <div className="dotted-divider my-2" />
                      </div>

                      <div className="p-4 pt-1 space-y-3 flex-1 flex flex-col justify-start">
                        {subList.slice(0, 3).map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center gap-3 group/sub py-1 border-b border-[#f5efe6] last:border-b-0"
                          >
                            <Link
                              to={`/post/${sub.slug}`}
                              className="w-16 aspect-[4/3] rounded-xs overflow-hidden flex-shrink-0 border border-[#e8e4dc]"
                            >
                              <img
                                src={sub.image || '/assets/images/placeholder.jpg'}
                                alt={sub.title}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover group-hover/sub:scale-105 transition-transform duration-300"
                              />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bengali font-semibold text-xs sm:text-sm text-gray-800 group-hover/sub:text-[#800020] transition line-clamp-2 leading-snug">
                                <Link to={`/post/${sub.slug}`}>
                                  {(lang === 'en' && sub.title_en) ? sub.title_en : sub.title}
                                </Link>
                              </h5>
                              <div className="flex items-center justify-between text-[10px] text-gray-400 font-sans mt-1">
                                <span>
                                  {sub.author?.username ? (
                                    <Link to={`/author/${sub.author.username}`} className="hover:text-[#800020] transition">
                                      {sub.author.name || sub.author_name}
                                    </Link>
                                  ) : (
                                    sub.author_name
                                  )} • <span className="font-bengali">{sub.reading_time || '৩ মিনিট'}</span>
                                </span>
                                <HeartButton slug={sub.slug} initialHearted={sub.is_hearted} initialCount={sub.hearts_count} size="sm" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
