import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, PenSquare, FileText, CheckCircle, Clock,
  Eye, Heart, Settings, Sliders, AlertTriangle, Check, X,
  Trash2, Edit3, ArrowUpRight, Loader2, Sparkles, PlusCircle,
  Users, MessageSquare, Mail, Bell, Shield, ShieldCheck,
  FolderTree, Globe, ToggleLeft, ToggleRight, Search, Filter,
  ExternalLink, Save, RefreshCw, Send, CheckCircle2, AlertCircle,
  ChevronDown, ChevronRight, ArrowUp, ArrowDown, ArrowRight, Layers, EyeOff,
  List, CornerDownRight, ArrowUpDown, Image as ImageIcon, GripVertical,
  User as UserIcon, MapPin, Twitter, Facebook, Instagram, Linkedin, Github,
  UserCheck, UserPlus, PenTool, Film, Youtube, Play, Video as VideoIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import {
  Article, Category, DashboardStats, HomepageCustomization,
  User, Comment, ContactInquiry, NewsletterSubscriber, SiteSetting,
  HeroSlide, AuthorProfile, CreateAuthorPayload, Video as VideoType
} from '../types';
import { RichTextEditor } from '../components/ui/RichTextEditor';
import { ImageUpload } from '../components/ui/ImageUpload';
import { toast } from '../context/ToastContext';
import { parseApiError } from '../utils/errorHandler';
import {
  buildCategoryTree,
  flattenCategoryTree,
  getDescendantIds,
  categoryMatchesSearch,
  FlattenedCategoryItem
} from '../utils/categoryTree';

// Recursive category selector node for Article Write & Edit forms
const ArticleCategoryTreeNode: React.FC<{
  category: Category;
  depth: number;
  selectedIds: number[];
  onToggle: (id: number) => void;
  searchQuery: string;
  lang: string;
}> = ({ category, depth, selectedIds, onToggle, searchQuery, lang }) => {
  const isSelected = selectedIds.includes(category.id);
  const q = searchQuery.trim().toLowerCase();

  const visibleSubs = (category.subcategories || []).filter((sub) => {
    if (!q) return true;
    return categoryMatchesSearch(sub, q);
  });

  const catName = category.name;
  const catNameEn = category.name_en;

  return (
    <div className={`pt-1.5 first:pt-0 ${depth > 0 ? 'ml-3 sm:ml-4 pl-2.5 border-l-2 border-[#800020]/20' : ''}`}>
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => onToggle(category.id)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition border cursor-pointer ${
            isSelected
              ? 'bg-[#800020] text-white border-[#800020] shadow-2xs'
              : 'bg-white text-gray-800 border-gray-300 hover:border-[#800020] hover:bg-gray-50'
          }`}
        >
          {depth > 0 && (
            <CornerDownRight className={`w-2.5 h-2.5 ${isSelected ? 'text-rose-200' : 'text-gray-400'}`} />
          )}
          {isSelected && <Check className="w-2.5 h-2.5 shrink-0" />}
          <span>{catName}</span>
          {catNameEn && (
            <span
              className={`text-[9px] font-normal font-sans ${
                isSelected ? 'text-rose-100' : 'text-gray-400'
              }`}
            >
              ({catNameEn})
            </span>
          )}
          {depth > 0 && (
            <span
              className={`text-[8px] px-1 py-0.2 rounded font-sans uppercase font-bold ${
                isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              L{depth + 1}
            </span>
          )}
        </button>
        {category.subcategories && category.subcategories.length > 0 && (
          <span className="text-[10px] text-gray-400 font-sans">
            ({category.subcategories.length} {lang === 'en' ? 'sub' : 'উপবিভাগ'})
          </span>
        )}
      </div>

      {visibleSubs.length > 0 && (
        <div className="mt-1 space-y-1">
          {visibleSubs.map((child) => (
            <ArticleCategoryTreeNode
              key={child.id}
              category={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              onToggle={onToggle}
              searchQuery={searchQuery}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Recursive category tree node for the Category Manager Tab
interface CategoryTreeNodeProps {
  category: Category;
  depth: number;
  index: number;
  siblingCount: number;
  collapsedIds: number[];
  onToggleCollapse: (id: number) => void;
  onAddSub: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (slug: string, name: string) => void;
  onToggleNav: (category: Category) => void;
  onToggleFeatured: (category: Category) => void;
  onMoveStep: (category: Category, direction: 'up' | 'down') => void;
  onCommitOrder: (category: Category, orderStr: string) => void;
  onFilterArticles: (slug: string) => void;
  editingOrderId: number | null;
  inputOrderVal: string;
  onStartEditingOrder: (catId: number, orderVal: number) => void;
  onChangeInputOrder: (val: string) => void;
  onCancelEditingOrder: () => void;
  draggingCat: { id: number; parentId?: number | null } | null;
  dragOverCat: { id: number; parentId?: number | null } | null;
  onDragStart: (e: React.DragEvent, cat: Category) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, cat: Category) => void;
  onDragLeave: (cat: Category) => void;
  onDrop: (e: React.DragEvent, cat: Category) => void;
  lang: string;
}

const CategoryTreeNode: React.FC<CategoryTreeNodeProps> = (props) => {
  const {
    category,
    depth,
    index,
    siblingCount,
    collapsedIds,
    onToggleCollapse,
    onAddSub,
    onEdit,
    onDelete,
    onToggleNav,
    onToggleFeatured,
    onMoveStep,
    onCommitOrder,
    onFilterArticles,
    editingOrderId,
    inputOrderVal,
    onStartEditingOrder,
    onChangeInputOrder,
    onCancelEditingOrder,
    draggingCat,
    dragOverCat,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
    lang,
  } = props;

  const isCollapsed = collapsedIds.includes(category.id);
  const hasSubs = Boolean(category.subcategories && category.subcategories.length > 0);
  const isDragging = draggingCat?.id === category.id;
  const isDropTarget = dragOverCat?.id === category.id;

  // Render Top-Level Card for depth === 0
  if (depth === 0) {
    return (
      <div
        key={category.id}
        draggable
        onDragStart={(e) => onDragStart(e, category)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onDragOver(e, category)}
        onDragLeave={() => onDragLeave(category)}
        onDrop={(e) => onDrop(e, category)}
        className={`border rounded-sm bg-white overflow-hidden shadow-2xs transition-all duration-150 ${
          isDragging
            ? 'opacity-40 border-dashed border-2 border-[#800020] scale-[0.99] bg-rose-50/20'
            : isDropTarget
            ? 'border-t-4 border-t-[#800020] border-[#800020]/60 ring-2 ring-[#800020]/20 bg-amber-50/20'
            : 'border-[#ded7cc] hover:border-[#800020]/40'
        }`}
      >
        {/* Header */}
        <div className="p-4 bg-[#fcfbf9] border-b border-[#ded7cc] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start md:items-center gap-2.5">
            <div
              className="cursor-grab active:cursor-grabbing p-1.5 text-gray-400 hover:text-[#800020] hover:bg-gray-100 rounded transition shrink-0 select-none"
              title={lang === 'en' ? 'Drag to reorder among top-level categories' : 'ক্যাটাগরির অবস্থান পরিবর্তন করতে ড্র্যাগ করুন'}
            >
              <GripVertical className="w-4 h-4" />
            </div>

            {hasSubs ? (
              <button
                type="button"
                onClick={() => onToggleCollapse(category.id)}
                className="p-1 hover:bg-gray-200 rounded text-gray-600 transition mt-0.5 md:mt-0 shrink-0 cursor-pointer"
                title={isCollapsed ? 'Expand subcategories' : 'Collapse subcategories'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-[#800020]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#800020]" />
                )}
              </button>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center text-gray-300 shrink-0">•</div>
            )}

            {category.banner || category.thumbnail ? (
              <img
                src={category.banner || category.thumbnail}
                alt={category.name}
                className="w-14 h-8 object-cover rounded border border-gray-200 shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-14 h-8 rounded border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300 shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
            )}

            <div>
              <div className="flex items-center flex-wrap gap-2">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 font-sans">
                  Level 1 (Root)
                </span>
                <h3 className="font-bold text-sm text-[#1e2022]">{category.name}</h3>
                {category.name_en && (
                  <span className="text-xs text-gray-400 font-sans">({category.name_en})</span>
                )}
                <code className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                  /{category.slug}
                </code>
                {hasSubs && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {category.subcategories?.length} sub-sections
                  </span>
                )}
              </div>
              {category.description && (
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-1 max-w-xl">
                  {category.description}
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center flex-wrap gap-2 self-end md:self-center">
            <button
              type="button"
              onClick={() => onFilterArticles(category.slug)}
              className="px-2 py-0.5 bg-gray-100 hover:bg-[#800020] hover:text-white rounded text-[11px] font-sans text-gray-700 font-semibold transition cursor-pointer"
            >
              {category.articles_count || 0} articles
            </button>

            {/* Position Controls */}
            <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-[#ded7cc] text-[11px] font-sans font-bold text-gray-700 shadow-2xs">
              {editingOrderId === category.id ? (
                <input
                  type="number"
                  min={1}
                  max={siblingCount}
                  value={inputOrderVal}
                  onChange={(e) => onChangeInputOrder(e.target.value)}
                  onBlur={() => onCommitOrder(category, inputOrderVal)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onCommitOrder(category, inputOrderVal);
                    if (e.key === 'Escape') onCancelEditingOrder();
                  }}
                  autoFocus
                  className="w-10 text-center text-xs py-0 px-1 border border-[#800020] rounded bg-white text-gray-900 font-bold focus:outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onStartEditingOrder(category.id, category.display_order || 1)}
                  className="hover:text-[#800020] hover:underline cursor-pointer flex items-center gap-0.5 font-bold"
                  title="Click to type exact position"
                >
                  <span>#{category.display_order}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onMoveStep(category, 'up')}
                disabled={index === 0}
                className={`p-0.5 rounded transition ${
                  index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 hover:text-black cursor-pointer'
                }`}
                title="Move Up"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onMoveStep(category, 'down')}
                disabled={index === siblingCount - 1}
                className={`p-0.5 rounded transition ${
                  index === siblingCount - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 hover:text-black cursor-pointer'
                }`}
                title="Move Down"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            </div>

            {/* Navbar Toggle */}
            <button
              type="button"
              onClick={() => onToggleNav(category)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans uppercase border transition flex items-center gap-1 cursor-pointer ${
                category.is_nav_visible !== false
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
              }`}
            >
              {category.is_nav_visible !== false ? '✓ In Nav' : '✕ Hidden'}
            </button>

            {/* Featured Toggle */}
            <button
              type="button"
              onClick={() => onToggleFeatured(category)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans uppercase border transition flex items-center gap-1 cursor-pointer ${
                category.is_featured
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 shadow-xs'
                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 hover:text-gray-600'
              }`}
            >
              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
              <span>{category.is_featured ? 'Featured' : '+ Feature'}</span>
            </button>

            {/* Add Subcategory */}
            <button
              type="button"
              onClick={() => onAddSub(category)}
              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
              title="Add a subcategory directly under this category"
            >
              <PlusCircle className="w-3 h-3" />
              <span>+ Sub-category</span>
            </button>

            {/* Live Link */}
            <Link
              to={`/category/${category.slug}`}
              target="_blank"
              className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition"
              title="View on Live Website"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {/* Edit */}
            <button
              type="button"
              onClick={() => onEdit(category)}
              className="p-1.5 bg-gray-100 hover:bg-[#800020] hover:text-white rounded text-gray-600 transition cursor-pointer"
              title="Edit category"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => onDelete(category.slug, category.name)}
              className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white rounded text-rose-600 transition cursor-pointer"
              title="Delete category"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Nested Subcategories (Recursive) */}
        {hasSubs && !isCollapsed && (
          <div className="p-3 bg-white divide-y divide-gray-100 space-y-2">
            {category.subcategories!.map((sub, subIdx) => (
              <CategoryTreeNode
                key={sub.id}
                {...props}
                category={sub}
                depth={depth + 1}
                index={subIdx}
                siblingCount={category.subcategories!.length}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render Nested Subcategory Row for depth > 0
  return (
    <div
      key={category.id}
      draggable
      onDragStart={(e) => onDragStart(e, category)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, category)}
      onDragLeave={() => onDragLeave(category)}
      onDrop={(e) => onDrop(e, category)}
      className={`py-2 px-3 rounded transition-all group ${
        isDragging
          ? 'opacity-40 border-dashed border border-[#800020] bg-rose-50/20'
          : isDropTarget
          ? 'border-t-2 border-t-[#800020] bg-amber-50/40'
          : 'hover:bg-[#faf7f2] bg-white border border-gray-100'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 pl-1">
          {/* Drag Handle */}
          <div
            className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-[#800020] hover:bg-gray-200 rounded transition shrink-0 select-none"
            title="Drag to reorder within this level"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          {/* Expand/Collapse if it has children */}
          {hasSubs ? (
            <button
              type="button"
              onClick={() => onToggleCollapse(category.id)}
              className="p-1 hover:bg-gray-200 rounded text-gray-600 transition shrink-0 cursor-pointer"
              title={isCollapsed ? 'Expand subcategories' : 'Collapse subcategories'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5 text-[#800020]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[#800020]" />
              )}
            </button>
          ) : (
            <CornerDownRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#800020] transition-colors shrink-0" />
          )}

          {category.banner || category.thumbnail ? (
            <img
              src={category.banner || category.thumbnail}
              alt={category.name}
              className="w-10 h-6 object-cover rounded border border-gray-200 shadow-2xs shrink-0"
            />
          ) : null}

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-1 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 font-sans">
                Level {depth + 1}
              </span>
              <span className="font-semibold text-xs text-gray-800">{category.name}</span>
              {category.name_en && (
                <span className="text-[11px] text-gray-400 font-sans">({category.name_en})</span>
              )}
              <code className="text-[9px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded font-mono">
                /{category.slug}
              </code>
              {hasSubs && (
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50/80 px-1.5 py-0.5 rounded">
                  {category.subcategories?.length} sub
                </span>
              )}
            </div>
            {category.description && (
              <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{category.description}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
          <button
            type="button"
            onClick={() => onFilterArticles(category.slug)}
            className="px-2 py-0.5 bg-gray-100 hover:bg-[#800020] hover:text-white rounded text-[10px] font-sans text-gray-600 transition cursor-pointer"
          >
            {category.articles_count || 0} articles
          </button>

          {/* Position Controls */}
          <div className="flex items-center gap-0.5 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 text-[10px] font-sans font-bold text-gray-700">
            {editingOrderId === category.id ? (
              <input
                type="number"
                min={1}
                max={siblingCount}
                value={inputOrderVal}
                onChange={(e) => onChangeInputOrder(e.target.value)}
                onBlur={() => onCommitOrder(category, inputOrderVal)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onCommitOrder(category, inputOrderVal);
                  if (e.key === 'Escape') onCancelEditingOrder();
                }}
                autoFocus
                className="w-9 text-center text-[10px] py-0 px-0.5 border border-[#800020] rounded bg-white text-gray-900 font-bold focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => onStartEditingOrder(category.id, category.display_order || 1)}
                className="hover:text-[#800020] hover:underline cursor-pointer"
                title="Click to type exact position"
              >
                <span>#{category.display_order}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onMoveStep(category, 'up')}
              disabled={index === 0}
              className={`p-0.5 rounded transition ${
                index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200 hover:text-black cursor-pointer'
              }`}
              title="Move Up"
            >
              <ArrowUp className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              onClick={() => onMoveStep(category, 'down')}
              disabled={index === siblingCount - 1}
              className={`p-0.5 rounded transition ${
                index === siblingCount - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200 hover:text-black cursor-pointer'
              }`}
              title="Move Down"
            >
              <ArrowDown className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* In Nav Toggle */}
          <button
            type="button"
            onClick={() => onToggleNav(category)}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-sans uppercase border transition cursor-pointer ${
              category.is_nav_visible !== false
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}
          >
            {category.is_nav_visible !== false ? '✓' : '✕'}
          </button>

          {/* Add Subcategory under this node! */}
          <button
            type="button"
            onClick={() => onAddSub(category)}
            className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-semibold flex items-center gap-0.5 transition cursor-pointer"
            title="Add a child sub-category under this category"
          >
            <PlusCircle className="w-3 h-3" />
            <span>+ Sub</span>
          </button>

          {/* Live Link */}
          <Link
            to={`/category/${category.slug}`}
            target="_blank"
            className="p-1 text-gray-400 hover:text-gray-700"
            title="View Live"
          >
            <ExternalLink className="w-3 h-3" />
          </Link>

          {/* Edit */}
          <button
            type="button"
            onClick={() => onEdit(category)}
            className="p-1 text-gray-500 hover:text-[#800020] cursor-pointer"
            title="Edit subcategory"
          >
            <Edit3 className="w-3 h-3" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(category.slug, category.name)}
            className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer"
            title="Delete subcategory"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Recursive nested children */}
      {hasSubs && !isCollapsed && (
        <div className="mt-2 ml-3 sm:ml-5 pl-2.5 sm:pl-3 border-l-2 border-[#800020]/25 space-y-1.5 pt-1">
          {category.subcategories!.map((child, childIdx) => (
            <CategoryTreeNode
              key={child.id}
              {...props}
              category={child}
              depth={depth + 1}
              index={childIdx}
              siblingCount={category.subcategories!.length}
            />
          ))}
        </div>
      )}
    </div>
  );
};


export const DashboardPage: React.FC = () => {
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive current section from URL path
  const rawPath = location.pathname.replace(/^\/dashboard\/?/, '').split('/')[0] || 'overview';
  const sectionMap: Record<string, string> = {
    '': 'overview',
    'overview': 'overview',
    'write': 'write',
    'my-articles': 'my-articles',
    'my_blogs': 'my-articles',
    'profile': 'profile',
    'my-profile': 'profile',
    'all-articles': 'all-articles',
    'all_articles': 'all-articles',
    'approval-queue': 'approval-queue',
    'approval_queue': 'approval-queue',
    'hero-slider': 'hero-slider',
    'hero_slider': 'hero-slider',
    'videos': 'videos',
    'video': 'videos',
    'categories': 'categories',
    'users': 'users',
    'comments': 'comments',
    'inquiries': 'inquiries',
    'subscribers': 'subscribers',
    'customization': 'customization',
    'settings': 'settings',
  };
  const currentPath = sectionMap[rawPath] || 'overview';

  const goToSection = (section: string) => {
    const clean = sectionMap[section] || section;
    navigate(clean === 'overview' ? '/dashboard' : `/dashboard/${clean}`);
  };
  const setActiveTab = goToSection;

  useEffect(() => {
    document.title = lang === 'en' ? 'Dashboard — The Mad Story' : 'ড্যাশবোর্ড — দ্য ম্যাড স্টোরি';
    return () => {
      document.title = 'The Mad Story — শিল্প, সাহিত্য, সংস্কৃতি ও সমকালীন জীবনধারার পত্রিকা';
    };
  }, [lang]);

  // Base data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [myBlogs, setMyBlogs] = useState<Article[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [pendingBlogs, setPendingBlogs] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [inquiriesList, setInquiriesList] = useState<ContactInquiry[]>([]);
  const [subscribersList, setSubscribersList] = useState<NewsletterSubscriber[]>([]);
  const [customization, setCustomization] = useState<HomepageCustomization | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSetting | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [articleSearch, setArticleSearch] = useState('');
  const [articleStatusFilter, setArticleStatusFilter] = useState('all');
  const [articleBadgeFilter, setArticleBadgeFilter] = useState<'all' | 'trending' | 'choice' | 'featured'>('all');
  const [userSearch, setUserSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [commentSearch, setCommentSearch] = useState('');
  const [inquirySearch, setInquirySearch] = useState('');

  // Write Blog form state
  const [newTitle, setNewTitle] = useState('');
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newExcerptEn, setNewExcerptEn] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newContentEn, setNewContentEn] = useState('');
  const [newCoverUrl, setNewCoverUrl] = useState('/assets/images/18-1024x678.jpg');
  const [selectedCatIds, setSelectedCatIds] = useState<number[]>([]);
  const [readingTime, setReadingTime] = useState('৫ মিনিট পাঠ');
  const [readingTimeEn, setReadingTimeEn] = useState('5 min read');
  const [newIsFeaturedHero, setNewIsFeaturedHero] = useState(false);
  const [newIsColtiTrending, setNewIsColtiTrending] = useState(false);
  const [newIsNirbachitoChoice, setNewIsNirbachitoChoice] = useState(false);
  const [savingBlog, setSavingBlog] = useState(false);
  const [blogSuccessMsg, setBlogSuccessMsg] = useState('');
  const [writeFormAttempted, setWriteFormAttempted] = useState(false);

  // Author Selection for Write & Edit forms (Superadmins & Staff)
  const [selectedAuthorId, setSelectedAuthorId] = useState<number | null>(null);
  const [selectedAuthorDesk, setSelectedAuthorDesk] = useState(false);
  const [editAuthorId, setEditAuthorId] = useState<number | null>(null);
  const [editAuthorDesk, setEditAuthorDesk] = useState(false);

  // Article Edit Modal state
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTitleEn, setEditTitleEn] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editExcerptEn, setEditExcerptEn] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editContentEn, setEditContentEn] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editCatIds, setEditCatIds] = useState<number[]>([]);
  const [editStatus, setEditStatus] = useState<Article['status']>('published');
  const [editIsFeaturedHero, setEditIsFeaturedHero] = useState(false);
  const [editIsColtiTrending, setEditIsColtiTrending] = useState(false);
  const [editIsNirbachitoChoice, setEditIsNirbachitoChoice] = useState(false);
  const [savingEditArticle, setSavingEditArticle] = useState(false);
  const [editFormAttempted, setEditFormAttempted] = useState(false);
  const [loadingEditContent, setLoadingEditContent] = useState(false);
  const [editContentLoadError, setEditContentLoadError] = useState<string | null>(null);

  // Category state & enhancements
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [categoryViewMode, setCategoryViewMode] = useState<'tree' | 'table'>('tree');
  const [categoryFilterType, setCategoryFilterType] = useState<'all' | 'top_level' | 'subcategories' | 'nav_visible' | 'nav_hidden'>('all');
  const [categorySortBy, setCategorySortBy] = useState<'order_asc' | 'order_desc' | 'name_asc' | 'articles_desc'>('order_asc');
  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<number[]>([]);

  const toggleCollapseCategory = (id: number) => {
    setCollapsedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Category search states for article creation & editing
  const [catSearchWrite, setCatSearchWrite] = useState('');
  const [catSearchEdit, setCatSearchEdit] = useState('');

  // Memoized hierarchical category tree with arbitrary depth (infinite levels)
  const categoryTree = React.useMemo(() => {
    return buildCategoryTree(flatCategories.length > 0 ? flatCategories : categories);
  }, [categories, flatCategories]);

  // Fast id-to-category lookup for chips/badges
  const categoryMap = React.useMemo(() => {
    const map = new Map<number, Category>();
    flatCategories.forEach(c => map.set(c.id, c));
    categories.forEach(c => {
      map.set(c.id, c);
      c.subcategories?.forEach(s => map.set(s.id, s));
    });
    return map;
  }, [categories, flatCategories]);

  // Collapsed categories & orphan categories
  const [collapsedParentIds, setCollapsedParentIds] = useState<number[]>([]);
  const orphanCategories = React.useMemo(() => {
    const allTreeIds = new Set<number>();
    const collectIds = (cats: Category[]) => {
      cats.forEach(c => {
        allTreeIds.add(c.id);
        if (c.subcategories) collectIds(c.subcategories);
      });
    };
    collectIds(categoryTree);
    return flatCategories.filter(c => !allTreeIds.has(c.id));
  }, [categoryTree, flatCategories]);

  // Category Drag & Position Reorder state
  const [draggingCategory, setDraggingCategory] = useState<{
    type?: 'parent' | 'sub' | 'table';
    id: number;
    parentId?: number | null;
  } | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<{
    type?: 'parent' | 'sub' | 'table';
    id: number;
    parentId?: number | null;
  } | null>(null);
  const [isSavingCategoryOrder, setIsSavingCategoryOrder] = useState(false);
  const [editingOrderCatId, setEditingOrderCatId] = useState<number | null>(null);
  const [inputOrderVal, setInputOrderVal] = useState<string>('');

  // Category Modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catParent, setCatParent] = useState<number | null>(null);
  const [catDesc, setCatDesc] = useState('');
  const [catDescEn, setCatDescEn] = useState('');
  const [catOrder, setCatOrder] = useState(0);
  const [catNavVisible, setCatNavVisible] = useState(true);
  const [catIsFeatured, setCatIsFeatured] = useState(false);
  const [catThumbnail, setCatThumbnail] = useState('');
  const [catBanner, setCatBanner] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  // Parent Category options with infinite depth indentation for Category Modal
  const parentCategoryOptions = React.useMemo(() => {
    const editingId = editingCategory ? editingCategory.id : null;
    const descendantIds = editingId ? getDescendantIds(editingId, flatCategories) : new Set<number>();
    const flattened = flattenCategoryTree(categoryTree);
    return flattened.filter(c => c.id !== editingId && !descendantIds.has(c.id));
  }, [categoryTree, editingCategory, flatCategories]);

  // All flattened categories with depth indentation for dropdown selectors
  const allFlattenedCategories = React.useMemo(() => {
    return flattenCategoryTree(categoryTree);
  }, [categoryTree]);

  // Customization: Category Grid Blocks filter search
  const [catBlockSearch, setCatBlockSearch] = useState('');

  // User Modal state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFirst, setNewUserFirst] = useState('');
  const [newUserLast, setNewUserLast] = useState('');
  const [newUserStaff, setNewUserStaff] = useState(false);
  const [newUserActive, setNewUserActive] = useState(true);
  const [savingUser, setSavingUser] = useState(false);

  // Author Creation & Management Modal state (Superadmins Full Control)
  const [authorModalOpen, setAuthorModalOpen] = useState(false);
  const [editingAuthorUser, setEditingAuthorUser] = useState<User | null>(null);
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'authors' | 'staff' | 'superadmins'>('all');
  const [authorForm, setAuthorForm] = useState<CreateAuthorPayload>({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    display_name: '',
    display_name_en: '',
    designation: 'লেখক ও সাংবাদিক',
    designation_en: 'Author & Contributor',
    bio: '',
    bio_en: '',
    avatar: '',
    cover_image: '',
    location: 'ঢাকা, বাংলাদেশ',
    location_en: 'Dhaka, Bangladesh',
    website: '',
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    linkedin_url: '',
    github_url: '',
    is_staff: false,
    is_active: true,
  });
  const [savingAuthor, setSavingAuthor] = useState(false);

  // Inquiry View Modal state
  const [viewingInquiry, setViewingInquiry] = useState<ContactInquiry | null>(null);

  // Hero Slides state & Modal state
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [heroSlideSearch, setHeroSlideSearch] = useState('');
  const [heroSlideModalOpen, setHeroSlideModalOpen] = useState(false);
  const [editingHeroSlide, setEditingHeroSlide] = useState<HeroSlide | null>(null);
  const [slideTitle, setSlideTitle] = useState('');
  const [slideTitleEn, setSlideTitleEn] = useState('');
  const [slideSubtitle, setSlideSubtitle] = useState('');
  const [slideSubtitleEn, setSlideSubtitleEn] = useState('');
  const [slideImage, setSlideImage] = useState('/assets/images/18-1024x678.jpg');
  const [slideButtonText, setSlideButtonText] = useState('গল্পগুলো দেখুন');
  const [slideButtonTextEn, setSlideButtonTextEn] = useState('Explore Stories');
  const [slideButtonLink, setSlideButtonLink] = useState('/category/architecture-interiors');
  const [slideOrder, setSlideOrder] = useState(0);
  const [slideActive, setSlideActive] = useState(true);
  const [savingHeroSlide, setSavingHeroSlide] = useState(false);
  const [heroSlideSuccessMsg, setHeroSlideSuccessMsg] = useState('');

  // Videos state & Modal state
  const [videosList, setVideosList] = useState<VideoType[]>([]);
  const [videoSearch, setVideoSearch] = useState('');
  const [videoTypeFilter, setVideoTypeFilter] = useState<'all' | 'youtube' | 'direct'>('all');
  const [videoCategoryFilter, setVideoCategoryFilter] = useState<string>('all');
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoType | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoTitleEn, setVideoTitleEn] = useState('');
  const [videoCategoryId, setVideoCategoryId] = useState<number | ''>('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoDescEn, setVideoDescEn] = useState('');
  const [videoType, setVideoType] = useState<'youtube' | 'direct'>('youtube');
  const [videoYoutubeUrl, setVideoYoutubeUrl] = useState('');
  const [videoDirectUrl, setVideoDirectUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState('');
  const [videoThumbnailFile, setVideoThumbnailFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState('');
  const [videoFeatured, setVideoFeatured] = useState(false);
  const [videoOrder, setVideoOrder] = useState(0);
  const [videoActive, setVideoActive] = useState(true);
  const [savingVideo, setSavingVideo] = useState(false);
  const [videoSuccessMsg, setVideoSuccessMsg] = useState('');

  // Rejection dialog
  const [rejectingArticle, setRejectingArticle] = useState<Article | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Save feedback states
  const [customSuccessMsg, setCustomSuccessMsg] = useState('');
  const [savingCustomization, setSavingCustomization] = useState(false);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Author Profile state
  const [profileForm, setProfileForm] = useState<Partial<AuthorProfile> & { first_name?: string; last_name?: string }>({
    first_name: '',
    last_name: '',
    display_name: '',
    display_name_en: '',
    designation: '',
    designation_en: '',
    bio: '',
    bio_en: '',
    avatar: '',
    cover_image: '',
    location: '',
    location_en: '',
    website: '',
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    linkedin_url: '',
    github_url: '',
  });
  const [savingAuthorProfile, setSavingAuthorProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      openAuthModal('login');
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const fetchAllArticles = async () => {
      let results: Article[] = [];
      let page = 1;
      while (true) {
        const data = await api.getArticles({ page_size: 100, page });
        results = [...results, ...data.results];
        if (!data.next) break;
        page++;
      }
      return results;
    };

    try {
      const [statsData, myData, catsData, flatCatsData] = await Promise.all([
        api.getDashboardStats(),
        api.getMyArticles(),
        api.getCategories(),
        api.getAllCategoriesFlat(),
      ]);
      setStats(statsData);
      setMyBlogs(myData);
      setCategories(catsData);
      setFlatCategories(flatCatsData.length ? flatCatsData : catsData);

      if (user.is_staff) {
        const [
          allArts,
          pendingData,
          usersData,
          commentsData,
          inquiriesData,
          subsData,
          customData,
          settingsData,
          heroSlidesData,
          videosData,
        ] = await Promise.all([
          fetchAllArticles(),
          api.getPendingArticles(),
          api.getAdminUsers(),
          api.getAdminComments(),
          api.getAdminInquiries(),
          api.getAdminSubscribers(),
          api.getHomepageCustomization().catch(() => null),
          api.getSettings().catch(() => null),
          api.getHeroSlides().catch(() => []),
          api.getVideos().catch(() => []),
        ]);
        setAllArticles(allArts || []);
        setPendingBlogs(pendingData);
        setUsersList(usersData);
        setCommentsList(commentsData);
        setInquiriesList(inquiriesData);
        setSubscribersList(subsData);
        setCustomization(customData);
        setSiteSettings(settingsData);
        setHeroSlides(heroSlidesData);
        setVideosList(videosData);
      }

      // Fetch author profile
      try {
        const myProfileData = await api.getMyProfile();
        if (myProfileData) {
          const prof = myProfileData.profile || {};
          setProfileForm({
            first_name: myProfileData.first_name || '',
            last_name: myProfileData.last_name || '',
            display_name: prof.display_name || '',
            display_name_en: prof.display_name_en || '',
            designation: prof.designation || '',
            designation_en: prof.designation_en || '',
            bio: prof.bio || '',
            bio_en: prof.bio_en || '',
            avatar: prof.effective_avatar || prof.avatar || '',
            cover_image: prof.effective_cover || prof.cover_image || '',
            location: prof.location || '',
            location_en: prof.location_en || '',
            website: prof.website || '',
            facebook_url: prof.facebook_url || '',
            twitter_url: prof.twitter_url || '',
            instagram_url: prof.instagram_url || '',
            linkedin_url: prof.linkedin_url || '',
            github_url: prof.github_url || '',
          });
        }
      } catch (profErr) {
        console.error('Error loading author profile:', profErr);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAuthorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAuthorProfile(true);
    setProfileSuccessMsg('');
    try {
      const updated = await api.updateMyProfile({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        profile: {
          display_name: profileForm.display_name,
          display_name_en: profileForm.display_name_en,
          designation: profileForm.designation,
          designation_en: profileForm.designation_en,
          bio: profileForm.bio,
          bio_en: profileForm.bio_en,
          avatar: profileForm.avatar,
          cover_image: profileForm.cover_image,
          location: profileForm.location,
          location_en: profileForm.location_en,
          website: profileForm.website,
          facebook_url: profileForm.facebook_url,
          twitter_url: profileForm.twitter_url,
          instagram_url: profileForm.instagram_url,
          linkedin_url: profileForm.linkedin_url,
          github_url: profileForm.github_url,
        },
      });
      if (updated && updated.profile) {
        setProfileForm((prev) => ({
          ...prev,
          display_name: updated.profile.display_name,
          display_name_en: updated.profile.display_name_en,
          designation: updated.profile.designation,
          designation_en: updated.profile.designation_en,
          bio: updated.profile.bio,
          bio_en: updated.profile.bio_en,
          avatar: updated.profile.effective_avatar || updated.profile.avatar,
          cover_image: updated.profile.effective_cover || updated.profile.cover_image,
          location: updated.profile.location,
          location_en: updated.profile.location_en,
          website: updated.profile.website,
          facebook_url: updated.profile.facebook_url,
          twitter_url: updated.profile.twitter_url,
          instagram_url: updated.profile.instagram_url,
          linkedin_url: updated.profile.linkedin_url,
          github_url: updated.profile.github_url,
        }));
      }
      setProfileSuccessMsg(lang === 'en' ? 'Author profile successfully updated!' : 'লেখক প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!');
      toast.success(lang === 'en' ? 'Profile saved successfully!' : 'লেখক প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!', { title: 'সফল' });
      setTimeout(() => setProfileSuccessMsg(''), 4500);
    } catch (err) {
      const msg = parseApiError(err).message;
      toast.error(msg, { title: 'সংরক্ষণ ব্যর্থ' });
    } finally {
      setSavingAuthorProfile(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Helper to check if rich text content actually has non-empty text, images, or media
  const isHtmlContentPresent = (html?: string): boolean => {
    if (!html) return false;
    if (/<(img|iframe|figure|svg|video|audio)[^>]*>/i.test(html)) return true;
    const text = html
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#160;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > 0;
  };

  // --------------------------------------------------------------------------
  // Handlers: Article Creation
  // --------------------------------------------------------------------------
  const handleCreateBlog = async (status: 'draft' | 'pending_approval' | 'published') => {
    setWriteFormAttempted(true);

    const finalTitle = newTitle.trim() || newTitleEn.trim();
    const finalTitleEn = newTitleEn.trim() || newTitle.trim();
    const hasContentBn = isHtmlContentPresent(newContent);
    const hasContentEn = isHtmlContentPresent(newContentEn);
    const hasAnyContent = hasContentBn || hasContentEn;

    if (!finalTitle && !hasAnyContent) {
      toast.warning(
        lang === 'en'
          ? 'Please enter an article title and content body.'
          : 'অনুগ্রহ করে প্রবন্ধের শিরোনাম এবং মূল বিষয়বস্তু লিখুন।',
        { title: lang === 'en' ? 'Missing Fields' : 'অসম্পূর্ণ ফর্ম' }
      );
      return;
    }

    if (!finalTitle) {
      toast.warning(
        lang === 'en'
          ? 'Please enter an article title (in Bengali or English).'
          : 'অনুগ্রহ করে প্রবন্ধের শিরোনাম লিখুন (বাংলা বা ইংরেজি)।',
        { title: lang === 'en' ? 'Title Required' : 'শিরোনাম প্রয়োজন' }
      );
      return;
    }

    if (!hasAnyContent) {
      toast.warning(
        lang === 'en'
          ? 'Please write the article content body in the editor.'
          : 'অনুগ্রহ করে এডিটরে মূল প্রবন্ধের বক্তব্য বা কন্টেন্ট লিখুন।',
        { title: lang === 'en' ? 'Content Required' : 'কন্টেন্ট প্রয়োজন' }
      );
      return;
    }

    const finalContent = hasContentBn ? newContent : newContentEn;
    const finalContentEn = hasContentEn ? newContentEn : newContent;

    setSavingBlog(true);
    setBlogSuccessMsg('');
    try {
      await api.createArticle({
        title: finalTitle,
        title_en: finalTitleEn,
        category_ids: selectedCatIds,
        excerpt: newExcerpt.trim() || newExcerptEn.trim() || finalTitle,
        excerpt_en: newExcerptEn.trim() || newExcerpt.trim() || finalTitleEn,
        content: finalContent,
        content_en: finalContentEn,
        cover_image_url: newCoverUrl,
        reading_time: readingTime,
        status: user?.is_staff ? status : 'pending_approval',
        is_featured_hero: user?.is_staff ? newIsFeaturedHero : false,
        is_colti_trending: user?.is_staff ? newIsColtiTrending : false,
        is_nirbachito_choice: user?.is_staff ? newIsNirbachitoChoice : false,
        author_id: user?.is_staff ? (selectedAuthorDesk ? null : (selectedAuthorId || user.id)) : undefined,
      });
      const successText =
        user?.is_staff
          ? (status === 'published' ? 'প্রবন্ধ সফলভাবে প্রকাশিত হয়েছে!' : 'খসড়া সফলভাবে সংরক্ষিত হয়েছে!')
          : 'আপনার লেখা সফলভাবে জমা দেওয়া হয়েছে! সম্পাদকের অনুমোদনের পর এটি প্রকাশিত হবে।';
      setBlogSuccessMsg(successText);
      toast.success(successText);
      setNewTitle('');
      setNewTitleEn('');
      setNewExcerpt('');
      setNewExcerptEn('');
      setNewContent('');
      setNewContentEn('');
      setSelectedCatIds([]);
      setNewIsFeaturedHero(false);
      setNewIsColtiTrending(false);
      setNewIsNirbachitoChoice(false);
      setSelectedAuthorDesk(false);
      setSelectedAuthorId(user?.id || null);
      setWriteFormAttempted(false);
      loadData();
    } catch (err: any) {
      console.error('Error creating blog:', err);
    } finally {
      setSavingBlog(false);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Article Direct Controls
  // --------------------------------------------------------------------------
  const handleSetArticleStatus = async (slug: string, newStatus: string) => {
    try {
      await api.setArticleStatus(slug, newStatus);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleArticleFlag = async (slug: string, flag: 'is_featured_hero' | 'is_colti_trending' | 'is_nirbachito_choice') => {
    try {
      await api.toggleArticleFlag(slug, flag);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteArticle = async (slug: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      await api.deleteArticle(slug);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditArticleModal = async (art: Article) => {
    setEditingArticle(art);
    setEditTitle(art.title || '');
    setEditTitleEn(art.title_en || '');
    setEditExcerpt(art.excerpt || '');
    setEditExcerptEn(art.excerpt_en || '');
    setEditContent(art.content || '');
    setEditContentEn(art.content_en || '');
    setEditCoverUrl(art.image || '');
    setEditCatIds(art.categories?.map(c => c.id) || []);
    setEditStatus(art.status || 'published');
    setEditIsFeaturedHero(art.is_featured_hero || false);
    setEditIsColtiTrending(art.is_colti_trending || false);
    setEditIsNirbachitoChoice(art.is_nirbachito_choice || false);
    setCatSearchEdit('');
    setEditFormAttempted(false);
    setEditContentLoadError(null);
    if (!art.author || art.author_name === 'The Mad Story Desk') {
      setEditAuthorDesk(!art.author);
      setEditAuthorId(art.author?.id || null);
    } else {
      setEditAuthorDesk(false);
      setEditAuthorId(art.author?.id || null);
    }

    // If art already has non-empty content, show it immediately without full-page spinner
    const hasInitialContent = Boolean(art.content || art.content_en);
    if (!hasInitialContent) {
      setLoadingEditContent(true);
    }

    try {
      let full: Article | null = null;
      if (art.id) {
        try {
          full = await api.getArticleById(art.id);
        } catch {
          full = null;
        }
      }
      if (!full && art.slug) {
        full = await api.getArticleBySlug(art.slug);
      }

      if (full) {
        setEditingArticle(full);
        if (full.title) setEditTitle(full.title);
        if (full.title_en !== undefined) setEditTitleEn(full.title_en || '');
        if (full.excerpt !== undefined) setEditExcerpt(full.excerpt || '');
        if (full.excerpt_en !== undefined) setEditExcerptEn(full.excerpt_en || '');
        if (full.content !== undefined) setEditContent(full.content || '');
        if (full.content_en !== undefined) setEditContentEn(full.content_en || '');
        if (full.image) setEditCoverUrl(full.image);
        if (full.categories) setEditCatIds(full.categories.map(c => c.id));
        if (full.status) setEditStatus(full.status);
        if (full.is_featured_hero !== undefined) setEditIsFeaturedHero(full.is_featured_hero);
        if (full.is_colti_trending !== undefined) setEditIsColtiTrending(full.is_colti_trending);
        if (full.is_nirbachito_choice !== undefined) setEditIsNirbachitoChoice(full.is_nirbachito_choice);
        if (!full.author || full.author_name === 'The Mad Story Desk') {
          setEditAuthorDesk(!full.author);
          setEditAuthorId(full.author?.id || null);
        } else {
          setEditAuthorDesk(false);
          setEditAuthorId(full.author?.id || null);
        }
      }
    } catch (err) {
      console.error('Failed to load article detail for editing:', err);
      if (!hasInitialContent) {
        setEditContentLoadError(
          lang === 'en'
            ? 'Failed to load article content. Please try again.'
            : 'প্রবন্ধের কন্টেন্ট লোড করা সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'
        );
      }
    } finally {
      setLoadingEditContent(false);
    }
  };

  const handleSaveEditArticle = async () => {
    if (!editingArticle) return;
    setEditFormAttempted(true);

    const finalTitle = editTitle.trim() || editTitleEn.trim();
    const finalTitleEn = editTitleEn.trim() || editTitle.trim();
    const hasContentBn = isHtmlContentPresent(editContent);
    const hasContentEn = isHtmlContentPresent(editContentEn);
    const hasAnyContent = hasContentBn || hasContentEn;

    if (!finalTitle) {
      toast.warning(
        lang === 'en' ? 'Please enter an article title.' : 'অনুগ্রহ করে প্রবন্ধের শিরোনাম লিখুন।',
        { title: lang === 'en' ? 'Title Required' : 'শিরোনাম প্রয়োজন' }
      );
      return;
    }

    if (!hasAnyContent) {
      toast.warning(
        lang === 'en'
          ? 'Please enter the article content body.'
          : 'অনুগ্রহ করে প্রবন্ধের মূল বক্তব্য বা কন্টেন্ট লিখুন।',
        { title: lang === 'en' ? 'Content Required' : 'কন্টেন্ট প্রয়োজন' }
      );
      return;
    }

    const finalContent = hasContentBn ? editContent : editContentEn;
    const finalContentEn = hasContentEn ? editContentEn : editContent;
    const finalExcerpt = editExcerpt.trim() || editExcerptEn.trim() || finalTitle;
    const finalExcerptEn = editExcerptEn.trim() || editExcerpt.trim() || finalTitleEn;

    setSavingEditArticle(true);
    try {
      await api.updateArticle(editingArticle.id || editingArticle.slug, {
        title: finalTitle,
        title_en: finalTitleEn,
        excerpt: finalExcerpt,
        excerpt_en: finalExcerptEn,
        content: finalContent,
        content_en: finalContentEn,
        cover_image_url: editCoverUrl,
        category_ids: editCatIds,
        status: editStatus,
        is_featured_hero: editIsFeaturedHero,
        is_colti_trending: editIsColtiTrending,
        is_nirbachito_choice: editIsNirbachitoChoice,
        author_id: user?.is_staff ? (editAuthorDesk ? null : editAuthorId) : undefined,
      });
      toast.success(lang === 'en' ? 'Article updated successfully!' : 'লেখা সফলভাবে আপডেট করা হয়েছে!');
      setEditingArticle(null);
      setEditFormAttempted(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(parseApiError(err, lang).message);
    } finally {
      setSavingEditArticle(false);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Approval Queue
  // --------------------------------------------------------------------------
  const handleApprove = async (slug: string) => {
    try {
      await api.approveArticle(slug);
      toast.success(lang === 'en' ? 'Article approved and published!' : 'লেখা অনুমোদিত ও প্রকাশিত হয়েছে!');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingArticle) return;
    try {
      await api.rejectArticle(rejectingArticle.slug, rejectReason);
      toast.info(lang === 'en' ? 'Article rejected.' : 'লেখা বাতিল করা হয়েছে।');
      setRejectingArticle(null);
      setRejectReason('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Category Management (CRUD & Enhancements)
  // --------------------------------------------------------------------------
  const autoSlugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const toggleCollapseParent = (id: number) => {
    setCollapsedParentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleCategoryNav = async (cat: Category) => {
    try {
      await api.toggleCategoryNav(cat.slug);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCategoryFeatured = async (cat: Category) => {
    try {
      const res = await api.toggleCategoryFeatured(cat.slug);
      toast.success(
        res.is_featured
          ? (lang === 'en' ? `Marked "${cat.name_en || cat.name}" as Featured` : `"${cat.name}" ফিচার্ড করা হয়েছে`)
          : (lang === 'en' ? `Removed "${cat.name_en || cat.name}" from Featured` : `"${cat.name}" ফিচার্ড থেকে সরানো হয়েছে`)
      );
      loadData();
    } catch (err) {
      console.error('Error toggling featured category:', err);
    }
  };

  const reorderSiblings = async (parentId: number | null, fromId: number, toId: number) => {
    if (fromId === toId) return;
    const siblings = flatCategories
      .filter((c) => (c.parent || null) === (parentId || null))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    const fromIndex = siblings.findIndex((s) => s.id === fromId);
    const toIndex = siblings.findIndex((s) => s.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = siblings.splice(fromIndex, 1);
    siblings.splice(toIndex, 0, moved);

    const updated = siblings.map((item, idx) => ({
      ...item,
      display_order: idx + 1,
    }));

    const prevFlat = flatCategories;
    setFlatCategories((prev) =>
      prev.map((fc) => {
        const matched = updated.find((u) => u.id === fc.id);
        return matched ? { ...fc, display_order: matched.display_order } : fc;
      })
    );

    setIsSavingCategoryOrder(true);
    try {
      const orders = updated.map((s) => ({ id: s.id, display_order: s.display_order }));
      await api.reorderCategories({ orders });
      const [freshTree, freshFlat] = await Promise.all([
        api.getCategories(),
        api.getAllCategoriesFlat(),
      ]);
      setCategories(freshTree);
      setFlatCategories(freshFlat.length ? freshFlat : freshTree);
      toast.success(lang === 'en' ? 'Category position updated' : 'ক্যাটাগরির অবস্থান সফলভাবে সাজানো হয়েছে');
    } catch (err) {
      console.error('Failed to reorder categories', err);
      setFlatCategories(prevFlat);
      toast.error(lang === 'en' ? 'Failed to update order' : 'ক্রম আপডেট ব্যর্থ হয়েছে');
    } finally {
      setIsSavingCategoryOrder(false);
    }
  };

  const reorderTopLevelCategories = async (fromId: number, toId: number) => {
    return reorderSiblings(null, fromId, toId);
  };

  const reorderSubcategories = async (parentId: number, fromId: number, toId: number) => {
    return reorderSiblings(parentId, fromId, toId);
  };

  const reorderTableCategories = async (fromId: number, toId: number) => {
    if (fromId === toId) return;
    if (categorySortBy !== 'order_asc') {
      setCategorySortBy('order_asc');
    }
    const currentList = [...flatCategories].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const fromIndex = currentList.findIndex(c => c.id === fromId);
    const toIndex = currentList.findIndex(c => c.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = currentList.splice(fromIndex, 1);
    currentList.splice(toIndex, 0, moved);

    const updatedList = currentList.map((cat, idx) => ({
      ...cat,
      display_order: idx + 1,
    }));

    const prevFlat = flatCategories;
    setFlatCategories(updatedList);

    setIsSavingCategoryOrder(true);
    try {
      const orders = updatedList.map(c => ({ id: c.id, display_order: c.display_order }));
      await api.reorderCategories({ orders });
      const [freshTree, freshFlat] = await Promise.all([
        api.getCategories(),
        api.getAllCategoriesFlat(),
      ]);
      setCategories(freshTree);
      setFlatCategories(freshFlat.length ? freshFlat : freshTree);
      toast.success(lang === 'en' ? 'Category position updated' : 'ক্যাটাগরির অবস্থান সফলভাবে সাজানো হয়েছে');
    } catch (err) {
      console.error('Failed to reorder table categories', err);
      setFlatCategories(prevFlat);
      toast.error(lang === 'en' ? 'Failed to save order' : 'ক্রম সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setIsSavingCategoryOrder(false);
    }
  };

  const handleMoveCategoryStep = async (cat: Category, direction: 'up' | 'down') => {
    const parentId = cat.parent || null;
    const siblings = flatCategories
      .filter((c) => (c.parent || null) === parentId)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const idx = siblings.findIndex((s) => s.id === cat.id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= siblings.length) return;
    await reorderSiblings(parentId, cat.id, siblings[targetIdx].id);
  };

  const handleCommitDirectOrder = async (cat: Category, newOrderStr: string) => {
    setEditingOrderCatId(null);
    const parsed = parseInt(newOrderStr, 10);
    if (isNaN(parsed) || parsed < 1) return;

    const parentId = cat.parent || null;
    const siblings = flatCategories
      .filter((c) => (c.parent || null) === parentId)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const currentIdx = siblings.findIndex((s) => s.id === cat.id);
    if (currentIdx === -1) return;
    const targetIdx = Math.min(Math.max(0, parsed - 1), siblings.length - 1);
    if (targetIdx === currentIdx) return;
    const targetCat = siblings[targetIdx];
    await reorderSiblings(parentId, cat.id, targetCat.id);
  };

  const handleNormalizeCategoryOrder = async () => {
    if (!window.confirm(
      lang === 'en'
        ? 'Normalize sequence orders for all primary categories to sequential numbers (1, 2, 3...)?'
        : 'সকল প্রধান ক্যাটাগরির ক্রমকে স্বাভাবিক ১, ২, ৩... ক্রমানুসারে সাজাতে চান?'
    )) return;

    setIsSavingCategoryOrder(true);
    try {
      const sorted = [...categories].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      const orders = sorted.map((c, i) => ({ id: c.id, display_order: i + 1 }));
      await api.reorderCategories({ orders });
      const [freshTree, freshFlat] = await Promise.all([
        api.getCategories(),
        api.getAllCategoriesFlat(),
      ]);
      setCategories(freshTree);
      setFlatCategories(freshFlat.length ? freshFlat : freshTree);
      toast.success(lang === 'en' ? 'Sequence normalized successfully' : 'ক্রম স্বাভাবিক করা হয়েছে');
    } catch (err) {
      console.error(err);
      toast.error(lang === 'en' ? 'Failed to normalize' : 'ব্যর্থ হয়েছে');
    } finally {
      setIsSavingCategoryOrder(false);
    }
  };

  const handleMoveCategoryOrder = async (cat: Category, delta: number) => {
    await handleMoveCategoryStep(cat, delta > 0 ? 'down' : 'up');
  };

  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatNameEn('');
    setCatSlug('');
    setCatParent(null);
    setCatDesc('');
    setCatDescEn('');
    setCatThumbnail('');
    setCatBanner('');
    const topLevels = flatCategories.filter(c => !c.parent);
    setCatOrder(topLevels.length + 1);
    setCatNavVisible(true);
    setCatIsFeatured(false);
    setCategoryModalOpen(true);
  };

  const openAddSubcategoryModal = (parentCat: Category) => {
    setEditingCategory(null);
    setCatName('');
    setCatNameEn('');
    setCatSlug('');
    setCatParent(parentCat.id);
    setCatDesc('');
    setCatDescEn('');
    setCatThumbnail('');
    setCatBanner('');
    const children = flatCategories.filter(c => c.parent === parentCat.id);
    setCatOrder(children.length + 1);
    setCatNavVisible(true);
    setCatIsFeatured(false);
    setCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatNameEn(cat.name_en || '');
    setCatSlug(cat.slug);
    setCatParent(cat.parent || null);
    setCatDesc(cat.description || '');
    setCatDescEn(cat.description_en || '');
    setCatThumbnail(cat.thumbnail || '');
    setCatBanner(cat.banner || '');
    setCatOrder(cat.display_order || 0);
    setCatNavVisible(cat.is_nav_visible !== false);
    setCatIsFeatured(cat.is_featured || false);
    setCategoryModalOpen(true);
  };

  const handleFilterArticlesByCategory = (slug: string) => {
    setArticleSearch(slug);
    navigate('/dashboard/all-articles');
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setSavingCat(true);
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.slug, {
          name: catName,
          name_en: catNameEn,
          slug: catSlug || undefined,
          parent: catParent,
          description: catDesc,
          description_en: catDescEn,
          thumbnail: catThumbnail,
          banner: catBanner,
          display_order: catOrder,
          is_nav_visible: catNavVisible,
          is_featured: catIsFeatured,
        });
      } else {
        await api.createCategory({
          name: catName,
          name_en: catNameEn,
          slug: catSlug || undefined,
          parent: catParent,
          description: catDesc,
          description_en: catDescEn,
          thumbnail: catThumbnail,
          banner: catBanner,
          display_order: catOrder,
          is_nav_visible: catNavVisible,
          is_featured: catIsFeatured,
        });
      }
      toast.success(editingCategory ? 'ক্যাটাগরি সফলভাবে আপডেট করা হয়েছে!' : 'নতুন ক্যাটাগরি সফলভাবে তৈরি হয়েছে!');
      setCategoryModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (slug: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"? Articles linked to it will not be deleted.`)) return;
    try {
      await api.deleteCategory(slug);
      toast.success(`ক্যাটাগরি "${name}" মুছে ফেলা হয়েছে।`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Author & User Management (CRUD)
  // --------------------------------------------------------------------------
  const openNewAuthorModal = () => {
    setEditingAuthorUser(null);
    setAuthorForm({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      display_name: '',
      display_name_en: '',
      designation: 'লেখক ও সাংবাদিক',
      designation_en: 'Author & Contributor',
      bio: '',
      bio_en: '',
      avatar: '',
      cover_image: '',
      location: 'ঢাকা, বাংলাদেশ',
      location_en: 'Dhaka, Bangladesh',
      website: '',
      facebook_url: '',
      twitter_url: '',
      instagram_url: '',
      linkedin_url: '',
      github_url: '',
      is_staff: false,
      is_active: true,
    });
    setAuthorModalOpen(true);
  };

  const openEditAuthorModal = (u: User) => {
    setEditingAuthorUser(u);
    setAuthorForm({
      username: u.username,
      email: u.email || '',
      password: '',
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      display_name: u.profile?.display_name || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username),
      display_name_en: u.profile?.display_name_en || '',
      designation: u.profile?.designation || 'লেখক ও সাংবাদিক',
      designation_en: u.profile?.designation_en || 'Author & Contributor',
      bio: u.profile?.bio || '',
      bio_en: u.profile?.bio_en || '',
      avatar: u.profile?.effective_avatar || u.profile?.avatar || '',
      cover_image: u.profile?.effective_cover || u.profile?.cover_image || '',
      location: u.profile?.location || 'ঢাকা, বাংলাদেশ',
      location_en: u.profile?.location_en || 'Dhaka, Bangladesh',
      website: u.profile?.website || '',
      facebook_url: u.profile?.facebook_url || '',
      twitter_url: u.profile?.twitter_url || '',
      instagram_url: u.profile?.instagram_url || '',
      linkedin_url: u.profile?.linkedin_url || '',
      github_url: u.profile?.github_url || '',
      is_staff: Boolean(u.is_staff),
      is_active: u.is_active !== false,
    });
    setAuthorModalOpen(true);
  };

  const handleSaveAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorForm.username.trim()) {
      toast.warning(lang === 'en' ? 'Please enter a username.' : 'অনুগ্রহ করে ইউজারনেম (Username) লিখুন।');
      return;
    }
    setSavingAuthor(true);
    try {
      const payload: CreateAuthorPayload = {
        ...authorForm,
        username: authorForm.username.trim(),
        display_name:
          authorForm.display_name?.trim() ||
          `${authorForm.first_name || ''} ${authorForm.last_name || ''}`.trim() ||
          authorForm.username.trim(),
      };
      if (!payload.password) {
        delete payload.password;
      }

      if (editingAuthorUser) {
        await api.updateAdminUser(editingAuthorUser.id, payload as any);
        toast.success(
          lang === 'en'
            ? `Author "${payload.display_name}" updated successfully!`
            : `লেখক "${payload.display_name}" এর প্রোফাইল আপডেট করা হয়েছে!`
        );
      } else {
        const created = await api.createAuthor(payload);
        toast.success(
          lang === 'en'
            ? `New author "${created.profile?.display_name || created.username}" created successfully!`
            : `নতুন লেখক "${created.profile?.display_name || created.username}" সফলভাবে তৈরি হয়েছে!`
        );
        setSelectedAuthorDesk(false);
        setSelectedAuthorId(created.id);
      }
      setAuthorModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingAuthor(false);
    }
  };

  const openNewUserModal = () => {
    setNewUsername('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserFirst('');
    setNewUserLast('');
    setNewUserStaff(false);
    setNewUserActive(true);
    setUserModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newUserPassword.trim()) return;
    setSavingUser(true);
    try {
      await api.createAdminUser({
        username: newUsername,
        email: newUserEmail,
        password: newUserPassword,
        first_name: newUserFirst,
        last_name: newUserLast,
        is_staff: newUserStaff,
        is_active: newUserActive,
      });
      toast.success(`ব্যবহারকারী "${newUsername}" সফলভাবে তৈরি হয়েছে!`);
      setUserModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingUser(false);
    }
  };

  const handleToggleUserRole = async (userId: number) => {
    try {
      await api.toggleUserRole(userId);
      toast.success('ব্যবহারকারীর পদমর্যাদা পরিবর্তিত হয়েছে!');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserActive = async (userId: number) => {
    try {
      await api.toggleUserActive(userId);
      toast.success('ব্যবহারকারীর অ্যাকাউন্ট স্ট্যাটাস পরিবর্তিত হয়েছে!');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return;
    try {
      await api.deleteAdminUser(userId);
      toast.success(`ব্যবহারকারী "${username}" সফলভাবে মুছে ফেলা হয়েছে।`);
      loadData();
    } catch (err: any) {
      console.error(err);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Comments Moderation
  // --------------------------------------------------------------------------
  const handleToggleCommentApproval = async (id: number) => {
    try {
      await api.toggleCommentApproval(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (id: number) => {
    if (!window.confirm('Delete this comment permanently?')) return;
    try {
      await api.deleteAdminComment(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Contact Inquiries
  // --------------------------------------------------------------------------
  const handleSetInquiryStatus = async (id: number, newStatus: 'new' | 'in_review' | 'replied' | 'archived') => {
    try {
      await api.setInquiryStatus(id, newStatus);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInquiry = async (id: number) => {
    if (!window.confirm('Delete this inquiry message?')) return;
    try {
      await api.deleteAdminInquiry(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Newsletter Subscribers
  // --------------------------------------------------------------------------
  const handleToggleSubscriber = async (id: number) => {
    try {
      await api.toggleSubscriberActive(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubscriber = async (id: number) => {
    if (!window.confirm('Remove subscriber email?')) return;
    try {
      await api.deleteAdminSubscriber(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Homepage Customization Save
  // --------------------------------------------------------------------------
  const handleSaveCustomization = async () => {
    if (!customization) return;
    setSavingCustomization(true);
    setCustomSuccessMsg('');
    try {
      const updated = await api.updateHomepageCustomization(customization);
      setCustomization(updated);
      const msg = lang === 'en' ? 'Homepage customization saved successfully!' : 'হোমপেজ কাস্টমাইজেশন সফলভাবে সংরক্ষিত হয়েছে!';
      setCustomSuccessMsg(msg);
      toast.success(msg);
      setTimeout(() => setCustomSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCustomization(false);
    }
  };

  const handleToggleCategoryBlock = (catId: number) => {
    if (!customization) return;
    const currentBlocks = customization.category_blocks || [];
    const isSelected = currentBlocks.includes(catId);
    let updatedIds: number[];
    if (isSelected) {
      updatedIds = currentBlocks.filter((id) => id !== catId);
    } else {
      updatedIds = [...currentBlocks, catId];
    }
    const updatedDetails = updatedIds
      .map((id) => flatCategories.find((c) => c.id === id) || categories.find((c) => c.id === id))
      .filter(Boolean) as Category[];

    setCustomization({
      ...customization,
      category_blocks: updatedIds,
      category_block_details: updatedDetails,
    });
  };

  // --------------------------------------------------------------------------
  // Handlers: Site Settings Save
  // --------------------------------------------------------------------------
  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteSettings) return;
    setSavingSettings(true);
    setSettingsSuccessMsg('');
    try {
      const updated = await api.updateSettings(siteSettings);
      setSiteSettings(updated);
      const msg = lang === 'en' ? 'Site settings saved successfully!' : 'ওয়েবসাইট সেটিংস সফলভাবে সংরক্ষিত হয়েছে!';
      setSettingsSuccessMsg(msg);
      toast.success(msg);
      setTimeout(() => setSettingsSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Hero Slider Management
  // --------------------------------------------------------------------------
  const openNewHeroSlideModal = () => {
    setEditingHeroSlide(null);
    setSlideTitle('');
    setSlideTitleEn('');
    setSlideSubtitle('');
    setSlideSubtitleEn('');
    setSlideImage('/assets/images/18-1024x678.jpg');
    setSlideButtonText(lang === 'en' ? 'Explore Stories' : 'গল্পগুলো দেখুন');
    setSlideButtonTextEn('Explore Stories');
    setSlideButtonLink('');
    setSlideOrder(heroSlides.length);
    setSlideActive(true);
    setHeroSlideModalOpen(true);
  };

  const openEditHeroSlideModal = (slide: HeroSlide) => {
    setEditingHeroSlide(slide);
    setSlideTitle(slide.title || '');
    setSlideTitleEn(slide.title_en || '');
    setSlideSubtitle(slide.subtitle || '');
    setSlideSubtitleEn(slide.subtitle_en || '');
    setSlideImage(slide.image || '/assets/images/18-1024x678.jpg');
    setSlideButtonText(slide.button_text || '');
    setSlideButtonTextEn(slide.button_text_en || '');
    setSlideButtonLink(slide.button_link || '');
    setSlideOrder(slide.display_order ?? 0);
    setSlideActive(slide.is_active);
    setHeroSlideModalOpen(true);
  };

  const handleSaveHeroSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideImage.trim()) {
      toast.warning(
        lang === 'en' ? 'Please provide or upload a banner image.' : 'অনুগ্রহ করে একটি ব্যানার ছবি আপলোড করুন বা লিংক দিন।',
        { title: lang === 'en' ? 'Image Required' : 'ছবি আবশ্যক' }
      );
      return;
    }
    setSavingHeroSlide(true);
    try {
      const finalTitle = slideTitle.trim() || `Banner ${heroSlides.length + 1}`;
      const payload: Partial<HeroSlide> = {
        title: finalTitle,
        title_en: slideTitleEn.trim(),
        subtitle: slideSubtitle.trim(),
        subtitle_en: slideSubtitleEn.trim(),
        image: slideImage.trim(),
        button_text: slideButtonText.trim(),
        button_text_en: slideButtonTextEn.trim(),
        button_link: slideButtonLink.trim(),
        display_order: Number(slideOrder) || 0,
        is_active: slideActive,
      };

      if (editingHeroSlide) {
        const updated = await api.updateHeroSlide(editingHeroSlide.id, payload);
        setHeroSlides((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        const msg = lang === 'en' ? 'Slide updated successfully!' : 'স্লাইড সফলভাবে আপডেট করা হয়েছে!';
        setHeroSlideSuccessMsg(msg);
        toast.success(msg);
      } else {
        const created = await api.createHeroSlide(payload);
        setHeroSlides((prev) => [...prev, created]);
        const msg = lang === 'en' ? 'New slide created successfully!' : 'নতুন স্লাইড সফলভাবে তৈরি করা হয়েছে!';
        setHeroSlideSuccessMsg(msg);
        toast.success(msg);
      }
      setHeroSlideModalOpen(false);
      setTimeout(() => setHeroSlideSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingHeroSlide(false);
    }
  };

  const handleToggleHeroSlideActive = async (id: number) => {
    try {
      const res = await api.toggleHeroSlideActive(id);
      setHeroSlides((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: res.is_active } : s))
      );
      toast.success(res.is_active ? 'স্লাইড সক্রিয় করা হয়েছে' : 'স্লাইড নিষ্ক্রিয় করা হয়েছে');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleMoveHeroSlideOrder = async (id: number, direction: 'up' | 'down') => {
    const sorted = [...heroSlides].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const currentSlide = sorted[idx];
    const targetSlide = sorted[targetIdx];

    try {
      const currentNewOrder = targetSlide.display_order;
      const targetNewOrder = currentSlide.display_order === targetSlide.display_order
        ? (direction === 'up' ? targetSlide.display_order + 1 : targetSlide.display_order - 1)
        : currentSlide.display_order;

      await Promise.all([
        api.updateHeroSlideOrder(currentSlide.id, currentNewOrder),
        api.updateHeroSlideOrder(targetSlide.id, targetNewOrder),
      ]);

      const fresh = await api.getHeroSlides();
      setHeroSlides(fresh);
      toast.success('স্লাইডের ক্রম সফলভাবে সংরক্ষিত হয়েছে');
    } catch (err: any) {
      console.error('Failed to change order', err);
    }
  };

  const handleDeleteHeroSlide = async (id: number, title: string) => {
    if (!window.confirm(lang === 'en' ? `Delete slide "${title}"?` : `"${title}" স্লাইডটি মুছে ফেলতে চান?`)) {
      return;
    }
    try {
      await api.deleteHeroSlide(id);
      setHeroSlides((prev) => prev.filter((s) => s.id !== id));
      const msg = lang === 'en' ? 'Slide removed successfully!' : 'স্লাইডটি মুছে ফেলা হয়েছে!';
      setHeroSlideSuccessMsg(msg);
      toast.success(msg);
      setTimeout(() => setHeroSlideSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
    }
  };

  // ----------------------------------------------------------------------
  // Video Stories Handlers
  // ----------------------------------------------------------------------
  const openNewVideoModal = () => {
    setEditingVideo(null);
    setVideoTitle('');
    setVideoTitleEn('');
    setVideoCategoryId('');
    setVideoDesc('');
    setVideoDescEn('');
    setVideoType('youtube');
    setVideoYoutubeUrl('');
    setVideoDirectUrl('');
    setVideoFile(null);
    setVideoThumbnailUrl('');
    setVideoThumbnailFile(null);
    setVideoDuration('');
    setVideoFeatured(false);
    setVideoOrder(videosList.length + 1);
    setVideoActive(true);
    setVideoModalOpen(true);
  };

  const openEditVideoModal = (v: VideoType) => {
    setEditingVideo(v);
    setVideoTitle(v.title || '');
    setVideoTitleEn(v.title_en || '');
    setVideoCategoryId(v.category || v.category_id || '');
    setVideoDesc(v.description || '');
    setVideoDescEn(v.description_en || '');
    setVideoType(v.video_type || 'youtube');
    setVideoYoutubeUrl(v.youtube_url || '');
    setVideoDirectUrl(v.video_url || '');
    setVideoFile(null);
    setVideoThumbnailUrl(v.thumbnail || '');
    setVideoThumbnailFile(null);
    setVideoDuration(v.duration || '');
    setVideoFeatured(v.is_featured || false);
    setVideoOrder(v.display_order ?? 0);
    setVideoActive(v.is_active);
    setVideoModalOpen(true);
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) {
      toast.warning(
        lang === 'en' ? 'Please provide a video headline.' : 'অনুগ্রহ করে ভিডিওটির একটি শিরোনাম দিন।',
        { title: lang === 'en' ? 'Title Required' : 'শিরোনাম আবশ্যক' }
      );
      return;
    }

    if (videoType === 'youtube' && !videoYoutubeUrl.trim()) {
      toast.warning(
        lang === 'en' ? 'Please provide a YouTube video URL.' : 'অনুগ্রহ করে ইউটিউব ভিডিও লিঙ্ক দিন।',
        { title: lang === 'en' ? 'URL Required' : 'ইউটিউব লিঙ্ক আবশ্যক' }
      );
      return;
    }

    if (videoType === 'direct' && !videoFile && !videoDirectUrl.trim() && !editingVideo?.effective_video_url) {
      toast.warning(
        lang === 'en' ? 'Please upload a video file or provide a direct video URL.' : 'অনুগ্রহ করে সরাসরি ভিডিও ফাইল আপলোড করুন অথবা ভিডিও লিংক দিন।',
        { title: lang === 'en' ? 'Video Required' : 'ভিডিও ফাইল বা লিঙ্ক আবশ্যক' }
      );
      return;
    }

    setSavingVideo(true);
    try {
      let payload: FormData | Partial<VideoType>;

      if (videoFile || videoThumbnailFile) {
        const fd = new FormData();
        fd.append('title', videoTitle.trim());
        fd.append('title_en', videoTitleEn.trim());
        if (videoCategoryId) {
          fd.append('category', String(videoCategoryId));
        } else {
          fd.append('category', '');
        }
        fd.append('description', videoDesc.trim());
        fd.append('description_en', videoDescEn.trim());
        fd.append('video_type', videoType);
        fd.append('youtube_url', videoYoutubeUrl.trim());
        if (videoDirectUrl.trim()) fd.append('video_url', videoDirectUrl.trim());
        if (videoFile) fd.append('video_file', videoFile);
        if (videoThumbnailUrl.trim()) fd.append('thumbnail', videoThumbnailUrl.trim());
        if (videoThumbnailFile) fd.append('thumbnail_image', videoThumbnailFile);
        fd.append('duration', videoDuration.trim());
        fd.append('is_featured', String(videoFeatured));
        fd.append('display_order', String(Number(videoOrder) || 0));
        fd.append('is_active', String(videoActive));
        payload = fd;
      } else {
        payload = {
          title: videoTitle.trim(),
          title_en: videoTitleEn.trim(),
          category: videoCategoryId ? Number(videoCategoryId) : null,
          description: videoDesc.trim(),
          description_en: videoDescEn.trim(),
          video_type: videoType,
          youtube_url: videoYoutubeUrl.trim(),
          video_url: videoDirectUrl.trim(),
          thumbnail: videoThumbnailUrl.trim(),
          duration: videoDuration.trim(),
          is_featured: videoFeatured,
          display_order: Number(videoOrder) || 0,
          is_active: videoActive,
        };
      }

      if (editingVideo) {
        const updated = await api.updateVideo(editingVideo.id, payload);
        setVideosList((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
        const msg = lang === 'en' ? 'Video updated successfully!' : 'ভিডিও সফলভাবে আপডেট করা হয়েছে!';
        setVideoSuccessMsg(msg);
        toast.success(msg);
      } else {
        const created = await api.createVideo(payload);
        setVideosList((prev) => [...prev, created]);
        const msg = lang === 'en' ? 'Video added successfully!' : 'নতুন ভিডিও সফলভাবে যোগ করা হয়েছে!';
        setVideoSuccessMsg(msg);
        toast.success(msg);
      }
      setVideoModalOpen(false);
      setTimeout(() => setVideoSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      toast.error(parseApiError(err, lang).message);
    } finally {
      setSavingVideo(false);
    }
  };

  const handleToggleVideoActive = async (id: number) => {
    try {
      const res = await api.toggleVideoActive(id);
      setVideosList((prev) =>
        prev.map((v) => (v.id === id ? { ...v, is_active: res.is_active } : v))
      );
      toast.success(res.is_active ? 'ভিডিও সক্রিয় করা হয়েছে' : 'ভিডিও নিষ্ক্রিয় করা হয়েছে');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleToggleVideoFeatured = async (id: number) => {
    try {
      const res = await api.toggleVideoFeatured(id);
      setVideosList((prev) =>
        prev.map((v) => (v.id === id ? { ...v, is_featured: res.is_featured } : v))
      );
      toast.success(res.is_featured ? 'ভিডিওটি স্পটলাইটে রাখা হয়েছে' : 'স্পটলাইট প্রত্যাহার করা হয়েছে');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleMoveVideoOrder = async (id: number, direction: 'up' | 'down') => {
    const sorted = [...videosList].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((v) => v.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const currentVid = sorted[idx];
    const targetVid = sorted[targetIdx];

    try {
      const currentNewOrder = targetVid.display_order;
      const targetNewOrder = currentVid.display_order === targetVid.display_order
        ? (direction === 'up' ? targetVid.display_order + 1 : targetVid.display_order - 1)
        : currentVid.display_order;

      await Promise.all([
        api.updateVideoOrder(currentVid.id, currentNewOrder),
        api.updateVideoOrder(targetVid.id, targetNewOrder),
      ]);

      const fresh = await api.getVideos();
      setVideosList(fresh);
      toast.success('ভিডিওর ক্রম সফলভাবে সংরক্ষিত হয়েছে');
    } catch (err: any) {
      console.error('Failed to change video order', err);
    }
  };

  const handleDeleteVideo = async (id: number, title: string) => {
    if (!window.confirm(lang === 'en' ? `Delete video "${title}"?` : `"${title}" ভিডিওটি মুছে ফেলতে চান?`)) {
      return;
    }
    try {
      await api.deleteVideo(id);
      setVideosList((prev) => prev.filter((v) => v.id !== id));
      const msg = lang === 'en' ? 'Video removed successfully!' : 'ভিডিও মুছে ফেলা হয়েছে!';
      setVideoSuccessMsg(msg);
      toast.success(msg);
      setTimeout(() => setVideoSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const filteredVideos = videosList.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(videoSearch.toLowerCase()) ||
      (v.title_en && v.title_en.toLowerCase().includes(videoSearch.toLowerCase())) ||
      (v.description && v.description.toLowerCase().includes(videoSearch.toLowerCase())) ||
      (v.category_name && v.category_name.toLowerCase().includes(videoSearch.toLowerCase())) ||
      (v.category_name_en && v.category_name_en.toLowerCase().includes(videoSearch.toLowerCase()));
    const matchesType = videoTypeFilter === 'all' || v.video_type === videoTypeFilter;
    const matchesCategory =
      videoCategoryFilter === 'all' ||
      String(v.category || v.category_id || '') === videoCategoryFilter ||
      v.category_slug === videoCategoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  // Filtered Articles
  const filteredAllArticles = allArticles.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(articleSearch.toLowerCase()) ||
      (art.title_en && art.title_en.toLowerCase().includes(articleSearch.toLowerCase())) ||
      art.author_name.toLowerCase().includes(articleSearch.toLowerCase());
    const matchesStatus = articleStatusFilter === 'all' || art.status === articleStatusFilter;
    const matchesBadge =
      articleBadgeFilter === 'all' ||
      (articleBadgeFilter === 'trending' && art.is_colti_trending) ||
      (articleBadgeFilter === 'choice' && art.is_nirbachito_choice) ||
      (articleBadgeFilter === 'featured' && art.is_featured_hero);
    return matchesSearch && matchesStatus && matchesBadge;
  });

  // Category KPI Metrics
  const totalCategoriesCount = flatCategories.length || categories.reduce((acc, c) => acc + 1 + (c.subcategories?.length || 0), 0);
  const topLevelCategoriesCount = categories.length;
  const subcategoriesCount = flatCategories.filter(c => c.parent).length || categories.reduce((acc, c) => acc + (c.subcategories?.length || 0), 0);
  const navVisibleCount = flatCategories.filter(c => c.is_nav_visible !== false).length;

  // Filtered & Sorted Tree Categories (Top level)
  const filteredTreeCategories = React.useMemo(() => {
    return categoryTree
      .filter((cat) => {
        const searchLower = categorySearch.toLowerCase().trim();
        const matchesSearch = !searchLower || categoryMatchesSearch(cat, searchLower);
        if (!matchesSearch) return false;

        if (categoryFilterType === 'top_level') return true;
        if (categoryFilterType === 'subcategories') return (cat.subcategories?.length || 0) > 0;
        if (categoryFilterType === 'nav_visible') return cat.is_nav_visible !== false;
        if (categoryFilterType === 'nav_hidden') return cat.is_nav_visible === false;
        return true;
      })
      .sort((a, b) => {
        if (categorySortBy === 'order_asc') return (a.display_order || 0) - (b.display_order || 0);
        if (categorySortBy === 'order_desc') return (b.display_order || 0) - (a.display_order || 0);
        if (categorySortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (categorySortBy === 'articles_desc') return (b.articles_count || 0) - (a.articles_count || 0);
        return 0;
      });
  }, [categoryTree, categorySearch, categoryFilterType, categorySortBy]);

  // Filtered & Sorted Flat Categories (For Table view)
  const filteredFlatCategories = flatCategories
    .filter((c) => {
      const searchLower = categorySearch.toLowerCase();
      const matchesSearch =
        !categorySearch ||
        c.name.toLowerCase().includes(searchLower) ||
        (c.name_en && c.name_en.toLowerCase().includes(searchLower)) ||
        c.slug.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      if (categoryFilterType === 'top_level') return !c.parent;
      if (categoryFilterType === 'subcategories') return !!c.parent;
      if (categoryFilterType === 'nav_visible') return c.is_nav_visible !== false;
      if (categoryFilterType === 'nav_hidden') return c.is_nav_visible === false;
      return true;
    })
    .sort((a, b) => {
      if (categorySortBy === 'order_asc') return (a.display_order || 0) - (b.display_order || 0);
      if (categorySortBy === 'order_desc') return (b.display_order || 0) - (a.display_order || 0);
      if (categorySortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (categorySortBy === 'articles_desc') return (b.articles_count || 0) - (a.articles_count || 0);
      return 0;
    });

  // Filtered Users & Authors
  const filteredUsers = usersList.filter((u) => {
    const q = userSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.profile?.display_name && u.profile.display_name.toLowerCase().includes(q)) ||
      (u.profile?.display_name_en && u.profile.display_name_en.toLowerCase().includes(q)) ||
      (u.first_name && u.first_name.toLowerCase().includes(q)) ||
      (u.last_name && u.last_name.toLowerCase().includes(q)) ||
      (u.profile?.designation && u.profile.designation.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (userRoleFilter === 'authors') return !u.is_staff && !u.is_superuser;
    if (userRoleFilter === 'staff') return u.is_staff && !u.is_superuser;
    if (userRoleFilter === 'superadmins') return u.is_superuser;
    return true;
  });

  // Filtered Comments
  const filteredComments = commentsList.filter((c) =>
    c.content.toLowerCase().includes(commentSearch.toLowerCase()) ||
    c.user_name.toLowerCase().includes(commentSearch.toLowerCase()) ||
    (c.article_title && c.article_title.toLowerCase().includes(commentSearch.toLowerCase()))
  );

  // Filtered Inquiries
  const filteredInquiries = inquiriesList.filter((inq) =>
    inq.name.toLowerCase().includes(inquirySearch.toLowerCase()) ||
    inq.email.toLowerCase().includes(inquirySearch.toLowerCase()) ||
    inq.subject.toLowerCase().includes(inquirySearch.toLowerCase())
  );

  // Filtered Hero Slides
  const filteredHeroSlides = heroSlides
    .filter((s) => {
      const q = heroSlideSearch.toLowerCase();
      return (
        !heroSlideSearch ||
        s.title.toLowerCase().includes(q) ||
        (s.title_en && s.title_en.toLowerCase().includes(q)) ||
        (s.subtitle && s.subtitle.toLowerCase().includes(q)) ||
        (s.subtitle_en && s.subtitle_en.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => a.display_order - b.display_order);

  // Loading state (Placed after all hooks to conform to React Rules of Hooks)
  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#800020] animate-spin mb-3" />
        <span className="font-bengali text-sm text-gray-500">ড্যাশবোর্ড লোড হচ্ছে...</span>
      </div>
    );
  }

  return (
    <div className="py-8 bg-[#faf7f2] min-h-screen">
      <div className="madstory-container max-w-7xl mx-auto px-4">
        
        {/* Top Header Banner */}
        <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#800020] text-white flex items-center justify-center text-2xl font-bold font-sans shadow">
              {(user?.username || user?.first_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1e2022] font-sans">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
                </h1>
                {user?.is_superuser ? (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-sans font-bold uppercase rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Super Admin
                  </span>
                ) : user?.is_staff ? (
                  <span className="px-2 py-0.5 bg-rose-100 text-[#800020] text-[10px] font-sans font-bold uppercase rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Staff Editor
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-sans font-bold uppercase rounded-full">
                    Contributing Author
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-sans mt-0.5">
                {user?.email} • {lang === 'en' ? 'Manage publication, content & system configuration' : 'ম্যাগাজিন কনটেন্ট, পাঠক ও সিস্টেম ব্যবস্থাপনা'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Link
              to="/dashboard/write"
              className="px-4 py-2 bg-[#800020] hover:bg-[#9b1b30] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <PenSquare className="w-4 h-4" />
              <span>{t('dash.write')}</span>
            </Link>
            <Link
              to="/"
              className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-[#ded7cc] rounded text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-4 h-4 text-gray-500" />
              <span>{lang === 'en' ? 'Live Website' : 'লাইভ সাইট'}</span>
            </Link>
          </div>
        </div>

        {/* Dashboard Layout: Sidebar + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Navigation Sidebar (3 cols) */}
          <aside className="lg:col-span-3 bg-white border border-[#ded7cc] rounded-sm p-3 shadow-xs space-y-1">
            <div className="px-3 py-2 text-[11px] font-sans font-bold uppercase tracking-wider text-gray-400">
              {lang === 'en' ? 'Main Menu' : 'মূল মেনু'}
            </div>

            <Link
              to="/dashboard"
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                currentPath === 'overview' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>{t('dash.overview')}</span>
              </div>
            </Link>

            <Link
              to="/dashboard/write"
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                currentPath === 'write' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PenSquare className="w-4 h-4" />
                <span>{t('dash.write')}</span>
              </div>
              <PlusCircle className="w-3.5 h-3.5 opacity-70" />
            </Link>

            <Link
              to="/dashboard/my-articles"
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                currentPath === 'my-articles' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>{t('dash.myBlogs')}</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${currentPath === 'my-articles' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                {myBlogs.length}
              </span>
            </Link>

            <Link
              to="/dashboard/profile"
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                currentPath === 'profile' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserIcon className="w-4 h-4" />
                <span>{lang === 'en' ? 'My Author Profile' : 'আমার লেখক প্রোফাইল'}</span>
              </div>
            </Link>

            {/* Super Admin / Staff Exclusive Sections */}
            {user?.is_staff && (
              <>
                <div className="pt-4 px-3 py-1.5 text-[11px] font-sans font-bold uppercase tracking-wider text-gray-400 border-t border-gray-100 mt-2">
                  {lang === 'en' ? 'Superadmin Controls' : 'সুপারএডমিন কন্ট্রোল'}
                </div>

                <Link
                  to="/dashboard/all-articles"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    currentPath === 'all-articles' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4" />
                    <span>{t('dash.allArticles')}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${currentPath === 'all-articles' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                    {allArticles.length}
                  </span>
                </Link>

                <Link
                  to="/dashboard/approval-queue"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    currentPath === 'approval-queue' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>{t('dash.approval')}</span>
                  </div>
                  {pendingBlogs.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold">
                      {pendingBlogs.length}
                    </span>
                  )}
                </Link>

                <Link
                  to="/dashboard/hero-slider"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    currentPath === 'hero-slider' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ImageIcon className="w-4 h-4" />
                    <span>{t('dash.heroSlider')}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${currentPath === 'hero-slider' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                    {heroSlides.length}
                  </span>
                </Link>

                <Link
                  to="/dashboard/videos"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    currentPath === 'videos' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Film className="w-4 h-4" />
                    <span>{t('dash.videos')}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${currentPath === 'videos' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                    {videosList.length}
                  </span>
                </Link>

                <Link
                  to="/dashboard/categories"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    currentPath === 'categories' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FolderTree className="w-4 h-4" />
                    <span>{t('dash.categories')}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${currentPath === 'categories' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                    {categories.length}
                  </span>
                </Link>

                <Link
                  to="/dashboard/users"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    currentPath === 'users' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4" />
                    <span>{t('dash.users')}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${currentPath === 'users' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                    {usersList.length}
                  </span>
                </Link>

                <Link
                  to="/dashboard/comments"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    currentPath === 'comments' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4" />
                    <span>{t('dash.comments')}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${currentPath === 'comments' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                    {commentsList.length}
                  </span>
                </Link>

                <Link
                  to="/dashboard/inquiries"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    currentPath === 'inquiries' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4" />
                    <span>{t('dash.inquiries')}</span>
                  </div>
                  {stats?.new_inquiries ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold">
                      {stats.new_inquiries} new
                    </span>
                  ) : (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${currentPath === 'inquiries' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                      {inquiriesList.length}
                    </span>
                  )}
                </Link>

                <Link
                  to="/dashboard/subscribers"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    currentPath === 'subscribers' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4" />
                    <span>{t('dash.subscribers')}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${currentPath === 'subscribers' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                    {subscribersList.length}
                  </span>
                </Link>

                <Link
                  to="/dashboard/customization"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    currentPath === 'customization' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4" />
                    <span>{t('dash.customization')}</span>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 opacity-70" />
                </Link>

                <Link
                  to="/dashboard/settings"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    currentPath === 'settings' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4" />
                    <span>{t('dash.siteSettings')}</span>
                  </div>
                </Link>
              </>
            )}
          </aside>

          {/* Main Workspace (9 cols) */}
          <main className="lg:col-span-9 space-y-6">
            
            {/* ------------------------------------------------------------- */}
            {/* TAB: OVERVIEW & ANALYTICS                                      */}
            {/* ------------------------------------------------------------- */}
            {currentPath === 'overview' && (
              <div className="space-y-6">
                {/* Metric Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#ded7cc] p-4 rounded-sm shadow-xs">
                    <span className="text-[11px] font-sans font-bold uppercase text-gray-400 block mb-1">
                      {lang === 'en' ? 'Published Articles' : 'প্রকাশিত প্রবন্ধ'}
                    </span>
                    <div className="text-2xl font-bold font-sans text-gray-900">
                      {stats?.published_articles || 0}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-sans mt-1 block">
                      Total: {stats?.total_articles || 0} in database
                    </span>
                  </div>

                  <div className="bg-white border border-[#ded7cc] p-4 rounded-sm shadow-xs">
                    <span className="text-[11px] font-sans font-bold uppercase text-gray-400 block mb-1">
                      {lang === 'en' ? 'Pending Queue' : 'অনুমোদনের অপেক্ষায়'}
                    </span>
                    <div className="text-2xl font-bold font-sans text-amber-600">
                      {stats?.pending_articles || 0}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans mt-1 block">
                      Needs editor review
                    </span>
                  </div>

                  <div className="bg-white border border-[#ded7cc] p-4 rounded-sm shadow-xs">
                    <span className="text-[11px] font-sans font-bold uppercase text-gray-400 block mb-1">
                      {lang === 'en' ? 'Total Views' : 'মোট পাঠ সংখ্যা'}
                    </span>
                    <div className="text-2xl font-bold font-sans text-[#800020]">
                      {stats?.total_views || 0}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans mt-1 block">
                      Cumulative impressions
                    </span>
                  </div>

                  <div className="bg-white border border-[#ded7cc] p-4 rounded-sm shadow-xs">
                    <span className="text-[11px] font-sans font-bold uppercase text-gray-400 block mb-1">
                      {lang === 'en' ? 'Hearts & Reactions' : 'পছন্দ ও ভালোবাসা'}
                    </span>
                    <div className="text-2xl font-bold font-sans text-rose-600">
                      {stats?.total_hearts || 0}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans mt-1 block">
                      Reader engagements
                    </span>
                  </div>
                </div>

                {/* Second row of metrics for superadmins */}
                {user?.is_staff && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div
                      onClick={() => navigate('/dashboard/users')}
                      className="bg-white border border-[#ded7cc] p-4 rounded-sm shadow-xs cursor-pointer hover:border-[#800020] transition group"
                    >
                      <span className="text-[11px] font-sans font-bold uppercase text-gray-400 block mb-1 group-hover:text-[#800020]">
                        {lang === 'en' ? 'Users & Authors' : 'মোট ব্যবহারকারী'}
                      </span>
                      <div className="text-xl font-bold font-sans text-gray-900">
                        {stats?.total_users || 0}
                      </div>
                      <span className="text-[10px] text-gray-400 font-sans mt-1 block">Click to manage users →</span>
                    </div>

                    <div
                      onClick={() => navigate('/dashboard/comments')}
                      className="bg-white border border-[#ded7cc] p-4 rounded-sm shadow-xs cursor-pointer hover:border-[#800020] transition group"
                    >
                      <span className="text-[11px] font-sans font-bold uppercase text-gray-400 block mb-1 group-hover:text-[#800020]">
                        {lang === 'en' ? 'Comments' : 'পাঠকের মন্তব্য'}
                      </span>
                      <div className="text-xl font-bold font-sans text-gray-900">
                        {stats?.total_comments || 0}
                      </div>
                      <span className="text-[10px] text-gray-400 font-sans mt-1 block">Click to moderate →</span>
                    </div>

                    <div
                      onClick={() => navigate('/dashboard/inquiries')}
                      className="bg-white border border-[#ded7cc] p-4 rounded-sm shadow-xs cursor-pointer hover:border-[#800020] transition group"
                    >
                      <span className="text-[11px] font-sans font-bold uppercase text-gray-400 block mb-1 group-hover:text-[#800020]">
                        {lang === 'en' ? 'Inquiries Inbox' : 'যোগাযোগ বার্তা'}
                      </span>
                      <div className="text-xl font-bold font-sans text-gray-900">
                        {stats?.total_inquiries || 0}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-sans mt-1 block">{stats?.new_inquiries || 0} unread</span>
                    </div>

                    <div
                      onClick={() => navigate('/dashboard/subscribers')}
                      className="bg-white border border-[#ded7cc] p-4 rounded-sm shadow-xs cursor-pointer hover:border-[#800020] transition group"
                    >
                      <span className="text-[11px] font-sans font-bold uppercase text-gray-400 block mb-1 group-hover:text-[#800020]">
                        {lang === 'en' ? 'Subscribers' : 'নিউজলেটার গ্রাহক'}
                      </span>
                      <div className="text-xl font-bold font-sans text-gray-900">
                        {stats?.total_subscribers || 0}
                      </div>
                      <span className="text-[10px] text-gray-400 font-sans mt-1 block">Active subscribers</span>
                    </div>
                  </div>
                )}

                {/* Quick Action Cards */}
                <div className="bg-white border border-[#ded7cc] p-6 rounded-sm shadow-xs">
                  <h3 className="font-bold text-base text-[#1e2022] mb-4 border-b border-gray-100 pb-2 font-sans">
                    {lang === 'en' ? 'Quick Actions & Management Shortcuts' : 'দ্রুত ব্যবস্থাপনা অ্যাকশন'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <button
                      onClick={() => navigate('/dashboard/write')}
                      className="p-4 rounded border border-[#e2ddd3] hover:border-[#800020] hover:bg-[#fbf9f6] text-left transition flex items-start gap-3"
                    >
                      <PenSquare className="w-5 h-5 text-[#800020] mt-0.5" />
                      <div>
                        <strong className="block text-xs text-gray-900 font-semibold">{t('dash.write')}</strong>
                        <span className="text-[11px] text-gray-500">Draft or publish a rich literary story</span>
                      </div>
                    </button>

                    {user?.is_staff && (
                      <>
                        <button
                          onClick={() => navigate('/dashboard/all-articles')}
                          className="p-4 rounded border border-[#e2ddd3] hover:border-[#800020] hover:bg-[#fbf9f6] text-left transition flex items-start gap-3"
                        >
                          <FileText className="w-5 h-5 text-indigo-600 mt-0.5" />
                          <div>
                            <strong className="block text-xs text-gray-900 font-semibold">{t('dash.allArticles')}</strong>
                            <span className="text-[11px] text-gray-500">Directly edit, publish or delete articles</span>
                          </div>
                        </button>

                        <button
                          onClick={() => navigate('/dashboard/hero-slider')}
                          className="p-4 rounded border border-[#e2ddd3] hover:border-[#800020] hover:bg-[#fbf9f6] text-left transition flex items-start gap-3"
                        >
                          <ImageIcon className="w-5 h-5 text-emerald-600 mt-0.5" />
                          <div>
                            <strong className="block text-xs text-gray-900 font-semibold">{t('dash.heroSlider')}</strong>
                            <span className="text-[11px] text-gray-500">Manage homepage banner slides & CTA links</span>
                          </div>
                        </button>

                        <button
                          onClick={() => navigate('/dashboard/videos')}
                          className="p-4 rounded border border-[#e2ddd3] hover:border-[#800020] hover:bg-[#fbf9f6] text-left transition flex items-start gap-3"
                        >
                          <Film className="w-5 h-5 text-red-600 mt-0.5" />
                          <div>
                            <strong className="block text-xs text-gray-900 font-semibold">{t('dash.videos')}</strong>
                            <span className="text-[11px] text-gray-500">Manage video stories & YouTube embeds</span>
                          </div>
                        </button>

                        <button
                          onClick={() => navigate('/dashboard/customization')}
                          className="p-4 rounded border border-[#e2ddd3] hover:border-[#800020] hover:bg-[#fbf9f6] text-left transition flex items-start gap-3"
                        >
                          <Sliders className="w-5 h-5 text-amber-600 mt-0.5" />
                          <div>
                            <strong className="block text-xs text-gray-900 font-semibold">{t('dash.customization')}</strong>
                            <span className="text-[11px] text-gray-500">Curate homepage sections & tickers</span>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: ALL ARTICLES (SUPERADMIN FULL CRUD TABLE)                 */}
            {/* ------------------------------------------------------------- */}
            {currentPath === 'all-articles' && user?.is_staff && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#1e2022] font-sans">
                      {lang === 'en' ? 'All Articles CMS Management' : 'সকল প্রবন্ধ ব্যবস্থাপনা'}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {lang === 'en' ? 'Full control just like Django Admin: change status, toggle editorial badges, edit & delete.' : 'সকল লেখার স্ট্যাটাস পরিবর্তন, এডিট ও ডিলিট করুন।'}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard/write')}
                    className="px-3 py-1.5 bg-[#800020] text-white rounded text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Add Article' : 'নতুন প্রবন্ধ'}</span>
                  </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search title, author..."
                      value={articleSearch}
                      onChange={(e) => setArticleSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                    />
                  </div>
                  <select
                    value={articleStatusFilter}
                    onChange={(e) => setArticleStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans bg-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="draft">Draft</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <select
                    value={articleBadgeFilter}
                    onChange={(e) => setArticleBadgeFilter(e.target.value as any)}
                    className="px-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans bg-white"
                  >
                    <option value="all">All Badges</option>
                    <option value="featured">বিশেষ ফিচার (Special Featured)</option>
                    <option value="trending">চলতি (Trending)</option>
                    <option value="choice">নির্বাচিত (Choice)</option>
                  </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-gray-100 rounded">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f7f2eb] border-b border-[#ded7cc] text-gray-700 font-sans font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Cover</th>
                        <th className="py-2.5 px-3">Title & Details</th>
                        <th className="py-2.5 px-3">Categories</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Editorial Badges</th>
                        <th className="py-2.5 px-3">Stats</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredAllArticles.map((art) => (
                        <tr key={art.id} className="hover:bg-gray-50 transition">
                          <td className="py-2 px-3">
                            <img
                              src={art.image}
                              alt={art.title}
                              className="w-12 aspect-[4/3] object-cover rounded shadow-xs"
                            />
                          </td>
                          <td className="py-2 px-3 max-w-xs">
                            <Link
                              to={`/post/${art.slug}`}
                              className="font-bold text-gray-900 hover:text-[#800020] line-clamp-1 text-xs"
                              target="_blank"
                            >
                              {art.title}
                            </Link>
                            {art.title_en && (
                              <span className="text-[10px] text-gray-400 block line-clamp-1 font-sans">
                                {art.title_en}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-500 font-sans">
                              By {art.author_name}
                            </span>
                          </td>
                          <td className="py-2 px-3 max-w-[140px]">
                            <div className="flex flex-wrap gap-1">
                              {art.categories && art.categories.length > 0 ? (
                                art.categories.slice(0, 2).map((c) => (
                                  <span key={c.id} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[9px]">
                                    {c.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400 text-[10px]">-</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={art.status}
                              onChange={(e) => handleSetArticleStatus(art.slug, e.target.value)}
                              className={`px-2 py-1 rounded text-[10px] font-bold font-sans border focus:outline-none ${
                                art.status === 'published'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : art.status === 'pending_approval'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : art.status === 'draft'
                                  ? 'bg-gray-50 text-gray-700 border-gray-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              <option value="published">Published</option>
                              <option value="draft">Draft</option>
                              <option value="pending_approval">Pending</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleToggleArticleFlag(art.slug, 'is_featured_hero')}
                                title="Special Featured (বিশেষ ফিচার)"
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                  art.is_featured_hero
                                    ? 'bg-purple-100 text-purple-800 border-purple-300 shadow-xs'
                                    : 'bg-white text-gray-400 border-gray-200 hover:text-gray-600'
                                }`}
                              >
                                বিশেষ ফিচার
                              </button>
                              <button
                                onClick={() => handleToggleArticleFlag(art.slug, 'is_colti_trending')}
                                title="Trending Section (চলতি)"
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                  art.is_colti_trending
                                    ? 'bg-rose-100 text-rose-800 border-rose-300 shadow-xs'
                                    : 'bg-white text-gray-400 border-gray-200 hover:text-gray-600'
                                }`}
                              >
                                Trending
                              </button>
                              <button
                                onClick={() => handleToggleArticleFlag(art.slug, 'is_nirbachito_choice')}
                                title="Editor Choice (নির্বাচিত)"
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                  art.is_nirbachito_choice
                                    ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-xs'
                                    : 'bg-white text-gray-400 border-gray-200 hover:text-gray-600'
                                }`}
                              >
                                Choice
                              </button>
                            </div>
                          </td>
                          <td className="py-2 px-3 font-sans text-[11px] text-gray-500">
                            <div>👁️ {art.view_count || 0}</div>
                            <div>❤️ {art.hearts_count || 0}</div>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditArticleModal(art)}
                                className="p-1.5 bg-gray-100 hover:bg-[#800020] hover:text-white rounded transition text-gray-600"
                                title="Edit Article"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <Link
                                to={`/post/${art.slug}`}
                                target="_blank"
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded transition text-gray-600"
                                title="View Live"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                onClick={() => handleDeleteArticle(art.slug, art.title)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white rounded transition text-rose-600"
                                title="Delete Article"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: APPROVAL QUEUE                                           */}
            {/* ------------------------------------------------------------- */}
            {currentPath === 'approval-queue' && user?.is_staff && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-lg font-bold text-[#1e2022] font-sans">
                    {t('dash.approval')}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {lang === 'en' ? 'Review articles submitted by contributing writers before publication.' : 'লেখকদের জমা দেওয়া লেখা যাচাই ও অনুমোদন করুন।'}
                  </p>
                </div>

                {pendingBlogs.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="text-sm font-semibold text-gray-600">
                      {lang === 'en' ? 'No pending articles in queue' : 'অনুমোদনের জন্য কোনো লেখা বাকি নেই'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">All submissions have been reviewed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingBlogs.map((art) => (
                      <div
                        key={art.id}
                        className="p-4 border border-[#e2ddd3] rounded-sm bg-[#fbf9f6] flex flex-col md:flex-row md:items-start justify-between gap-4"
                      >
                        <div className="flex gap-4">
                          <img
                            src={art.image}
                            alt={art.title}
                            className="w-24 aspect-[4/3] object-cover rounded flex-shrink-0"
                          />
                          <div>
                            <h3 className="font-bold text-base text-[#1e2022]">
                              {art.title}
                            </h3>
                            {art.title_en && (
                              <h4 className="text-xs text-gray-400 font-sans">{art.title_en}</h4>
                            )}
                            <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                              {art.excerpt}
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-gray-400 font-sans mt-2">
                              <span>Author: <strong>{art.author_name}</strong></span>
                              <span>•</span>
                              <span>Time: {art.reading_time || '5 min'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                          <button
                            onClick={() => handleApprove(art.slug)}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{t('dash.approve')}</span>
                          </button>
                          <button
                            onClick={() => {
                              setRejectingArticle(art);
                              setRejectReason('');
                            }}
                            className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{t('dash.reject')}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: WRITE BLOG (WYSIWYG + BILINGUAL)                         */}
            {/* ------------------------------------------------------------- */}
            {currentPath === 'write' && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-6">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-lg font-bold text-[#1e2022] font-sans">
                    {t('dash.write')}
                  </h2>
                  <p className="text-xs text-gray-500 font-sans">
                    {lang === 'en' ? 'Craft articles with rich text formatting, bilingual support, and category tags.' : 'সমৃদ্ধ টেক্সট এডিটর ও দ্বৈত ভাষায় প্রবন্ধ রচনা করুন।'}
                  </p>
                </div>

                {blogSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{blogSuccessMsg}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Author Selection (Superadmins & Staff) */}
                  {user?.is_staff && (
                    <div className="bg-[#faf7f2] border border-[#ded7cc] rounded-lg p-3 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-[#800020]" />
                          <div>
                            <label className="block text-xs font-bold text-gray-800">
                              {lang === 'en' ? 'Article Author' : 'লেখক নির্বাচন (Article Author)'}
                            </label>
                            <p className="text-[10px] text-gray-500">
                              {lang === 'en'
                                ? 'Super admins can select any author or publish under the Editorial Desk'
                                : 'নির্বাচিত লেখকের নামে প্রবন্ধটি যুক্ত ও প্রকাশিত হবে'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={openNewAuthorModal}
                          className="px-2.5 py-1 bg-white hover:bg-gray-50 text-[#800020] border border-[#800020]/30 rounded text-xs font-semibold flex items-center gap-1 shadow-2xs transition self-start sm:self-auto cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{lang === 'en' ? '+ Create Author' : '+ নতুন লেখক তৈরি করুন'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <select
                            value={selectedAuthorDesk ? 'desk' : (selectedAuthorId || user?.id || '')}
                            onChange={(e) => {
                              if (e.target.value === 'desk') {
                                setSelectedAuthorDesk(true);
                                setSelectedAuthorId(null);
                              } else {
                                setSelectedAuthorDesk(false);
                                setSelectedAuthorId(Number(e.target.value));
                              }
                            }}
                            className="w-full px-3 py-2 text-xs bg-white border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                          >
                            <option value={user?.id}>
                              {user?.profile?.display_name
                                ? `👤 ${user.profile.display_name} (@${user.username}) — আমি নিজে`
                                : `👤 ${user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username} — আমি নিজে (Current Admin)`}
                            </option>
                            <option value="desk">🏢 The Mad Story Desk / সম্পাদনা পরিষদ</option>
                            <optgroup label={lang === 'en' ? 'Registered Authors & Contributors' : 'নিবন্ধিত লেখক ও কন্ট্রিবিউটরবৃন্দ'}>
                              {usersList
                                .filter((u) => u.id !== user?.id)
                                .map((u) => {
                                  const displayName = u.profile?.display_name || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username);
                                  const roleBadge = u.profile?.designation || (u.is_superuser ? 'Super Admin' : u.is_staff ? 'Staff' : 'Author');
                                  return (
                                    <option key={u.id} value={u.id}>
                                      {displayName} (@{u.username}) • {roleBadge}
                                    </option>
                                  );
                                })}
                            </optgroup>
                          </select>
                        </div>

                        {/* Selected author preview card */}
                        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white border border-[#ded7cc] rounded text-xs">
                          {selectedAuthorDesk ? (
                            <>
                              <div className="w-7 h-7 rounded-full bg-[#800020]/10 text-[#800020] flex items-center justify-center font-bold text-xs flex-shrink-0">
                                M
                              </div>
                              <div className="leading-tight min-w-0">
                                <span className="font-bold text-gray-900 block truncate">The Mad Story Desk</span>
                                <span className="text-[10px] text-gray-500 truncate block">সম্পাদনা পরিষদ / Editorial Board</span>
                              </div>
                            </>
                          ) : (
                            (() => {
                              const currentSelected = usersList.find((u) => u.id === (selectedAuthorId || user?.id)) || user;
                              const avatar = currentSelected?.profile?.effective_avatar || currentSelected?.profile?.avatar;
                              const displayName = currentSelected?.profile?.display_name || (currentSelected?.first_name ? `${currentSelected.first_name} ${currentSelected.last_name || ''}`.trim() : currentSelected?.username);
                              const designation = currentSelected?.profile?.designation || (currentSelected?.is_superuser ? 'Super Admin' : currentSelected?.is_staff ? 'Staff Editor' : 'Contributing Author');
                              return (
                                <>
                                  {avatar ? (
                                    <img src={avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-rose-50 text-[#800020] flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                                      {(displayName || 'A').charAt(0)}
                                    </div>
                                  )}
                                  <div className="leading-tight min-w-0">
                                    <span className="font-bold text-gray-900 block truncate">
                                      {displayName}
                                    </span>
                                    <span className="text-[10px] text-gray-500 truncate block">
                                      @{currentSelected?.username} • {designation}
                                    </span>
                                  </div>
                                </>
                              );
                            })()
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Titles */}
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          শিরোনাম (বাংলা) <span className="text-[#800020]">*</span>
                          <span className="text-[10px] text-gray-400 font-normal ml-1">
                            {lang === 'en' ? '(or English title)' : '(অথবা ইংরেজি শিরোনাম)'}
                          </span>
                        </label>
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="যেমন: সমকালীন শিল্পের গতিপ্রকৃতি..."
                          className={`w-full px-3 py-2 text-xs border rounded focus:outline-none transition-colors ${
                            writeFormAttempted && !newTitle.trim() && !newTitleEn.trim()
                              ? 'border-rose-500 bg-rose-50/20 ring-1 ring-rose-500'
                              : 'border-[#ded7cc] focus:border-[#800020]'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Title (English) <span className="text-[#800020]">*</span>
                          <span className="text-[10px] text-gray-400 font-normal ml-1">
                            {lang === 'en' ? '(or Bengali title)' : '(অথবা বাংলা শিরোনাম)'}
                          </span>
                        </label>
                        <input
                          type="text"
                          value={newTitleEn}
                          onChange={(e) => setNewTitleEn(e.target.value)}
                          placeholder="e.g. Trends in Contemporary Art..."
                          className={`w-full px-3 py-2 text-xs border rounded focus:outline-none font-sans transition-colors ${
                            writeFormAttempted && !newTitle.trim() && !newTitleEn.trim()
                              ? 'border-rose-500 bg-rose-50/20 ring-1 ring-rose-500'
                              : 'border-[#ded7cc] focus:border-[#800020]'
                          }`}
                        />
                      </div>
                    </div>
                    {writeFormAttempted && !newTitle.trim() && !newTitleEn.trim() && (
                      <p className="text-rose-600 text-[11px] font-bengali mt-1.5 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>
                          {lang === 'en'
                            ? 'Please provide a title in at least one language (Bengali or English).'
                            : 'অনুগ্রহ করে অন্তত একটি শিরোনাম প্রদান করুন (বাংলা অথবা ইংরেজি)।'}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Many-to-Many Categories */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-gray-700">
                        {lang === 'en' ? 'Select Categories & Subcategories' : 'ক্যাটাগরি ও সাব-ক্যাটাগরি নির্বাচন (Many-to-Many)'}
                      </label>
                      <span className="text-[11px] font-medium text-gray-500">
                        {selectedCatIds.length > 0 ? (
                          <span className="text-[#800020] font-semibold">
                            {selectedCatIds.length} {lang === 'en' ? 'selected' : 'টি নির্বাচিত'}
                          </span>
                        ) : (
                          <span>{lang === 'en' ? 'None selected' : 'কোনোটি নির্বাচন করা হয়নি'}</span>
                        )}
                      </span>
                    </div>

                    <div className="bg-[#faf7f2] border border-[#ded7cc] rounded-lg p-3 space-y-2.5">
                      {/* Search & Quick Filter */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={catSearchWrite}
                          onChange={(e) => setCatSearchWrite(e.target.value)}
                          placeholder={lang === 'en' ? 'Search categories or subcategories...' : 'ক্যাটাগরি বা সাব-ক্যাটাগরি খুঁজুন...'}
                          className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                        />
                        {catSearchWrite && (
                          <button
                            type="button"
                            onClick={() => setCatSearchWrite('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Selected Category Badges */}
                      {selectedCatIds.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded border border-[#e5dfd5]">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider self-center mr-1">
                            {lang === 'en' ? 'Selected:' : 'নির্বাচিত:'}
                          </span>
                          {selectedCatIds.map(id => {
                            const cat = categoryMap.get(id);
                            if (!cat) return null;
                            return (
                              <span
                                key={id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#800020]/10 text-[#800020] border border-[#800020]/20"
                              >
                                <span>{cat.name}</span>
                                {cat.name_en && (
                                  <span className="text-[9px] opacity-75 font-sans">({cat.name_en})</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setSelectedCatIds(prev => prev.filter(x => x !== id))}
                                  className="hover:text-red-700 p-0.5 rounded-full hover:bg-rose-100"
                                  title={lang === 'en' ? 'Remove' : 'বাদ দিন'}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Hierarchical category picker list with infinite levels */}
                      <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-[#ece5d8]">
                        {categoryTree
                          .filter((cat) => {
                            if (!catSearchWrite.trim()) return true;
                            return categoryMatchesSearch(cat, catSearchWrite.toLowerCase().trim());
                          })
                          .map((cat) => (
                            <ArticleCategoryTreeNode
                              key={cat.id}
                              category={cat}
                              depth={0}
                              selectedIds={selectedCatIds}
                              onToggle={(id) => {
                                setSelectedCatIds((prev) =>
                                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                                );
                              }}
                              searchQuery={catSearchWrite}
                              lang={lang}
                            />
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        সারসংক্ষেপ (বাংলা)
                      </label>
                      <textarea
                        rows={2}
                        value={newExcerpt}
                        onChange={(e) => setNewExcerpt(e.target.value)}
                        placeholder="প্রবন্ধের সংক্ষিপ্ত ভূমিকা..."
                        className="w-full px-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 font-sans">
                        Excerpt (English)
                      </label>
                      <textarea
                        rows={2}
                        value={newExcerptEn}
                        onChange={(e) => setNewExcerptEn(e.target.value)}
                        placeholder="Brief summary in English..."
                        className="w-full px-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                      />
                    </div>
                  </div>

                  {/* Main Rich Text Content (Bengali) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      মূল বিষয়বস্তু (Rich Text Editor - বাংলা) <span className="text-[#800020]">*</span>
                      <span className="text-[10px] text-gray-400 font-normal ml-1">
                        {lang === 'en' ? '(or English content body below)' : '(অথবা নিচের ইংরেজি বক্সে কন্টেন্ট লিখুন)'}
                      </span>
                    </label>
                    <RichTextEditor
                      value={newContent}
                      onChange={setNewContent}
                      placeholder="এখানে বিস্তারিত প্রবন্ধ লিখুন..."
                      error={writeFormAttempted && !isHtmlContentPresent(newContent) && !isHtmlContentPresent(newContentEn)}
                      errorMessage={
                        lang === 'en'
                          ? 'Please write the article content in the editor (in Bengali or English).'
                          : 'অনুগ্রহ করে এডিটরে মূল প্রবন্ধের বক্তব্য বা কন্টেন্ট লিখুন (বাংলা অথবা ইংরেজিতে)।'
                      }
                    />
                  </div>

                  {/* English Rich Text Content */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 font-sans">
                      Content Body (English Translation - Optional)
                      <span className="text-[10px] text-gray-400 font-normal ml-1">
                        {lang === 'en' ? '(Required if Bengali content is not provided)' : '(বাংলা কন্টেন্ট না দিলে এখানে আবশ্যক)'}
                      </span>
                    </label>
                    <RichTextEditor
                      value={newContentEn}
                      onChange={setNewContentEn}
                      placeholder="Write full article in English..."
                      error={writeFormAttempted && !isHtmlContentPresent(newContent) && !isHtmlContentPresent(newContentEn)}
                    />
                  </div>

                  {/* Cover Image Upload (Cloudflare R2) & Reading time */}
                  <div className="space-y-4">
                    <ImageUpload
                      value={newCoverUrl}
                      onChange={setNewCoverUrl}
                      label={lang === 'en' ? 'Article Cover Image (Cloudflare R2)' : 'প্রবন্ধের কভার ছবি (ক্লাউডফ্লেয়ার R2)'}
                      helperText={lang === 'en' ? 'Upload high-resolution image directly to Cloudflare R2 storage' : 'সরাসরি ক্লাউডফ্লেয়ার R2 তে উচ্চ-রেজোলিউশনের ছবি আপলোড করুন'}
                      aspectRatio="4/3"
                      optimalDimensions={lang === 'en' ? '1200 × 900 px (4:3)' : '১২০০ × ৯০০ px (৪:৩)'}
                      presets={[
                        { label: 'Living Room', url: '/assets/images/18-1024x678.jpg' },
                        { label: 'Tropical Island', url: '/assets/images/beach_resort_paradise_island_aerial_drone_top_view_summer_tropical_nature_landscape_holiday_travel_vacation-1024x683.jpg' },
                        { label: 'Architectural House', url: '/assets/images/shutterstock_398822470-1024x683.jpg' },
                        { label: 'Modern Interior', url: '/assets/images/Modern_living_room_interior_design_3d_render_illustration_7-1024x576.jpg' },
                      ]}
                    />

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {lang === 'en' ? 'Estimated Reading Time' : 'পাঠের আনুমানিক সময় (Reading Time)'}
                      </label>
                      <input
                        type="text"
                        value={readingTime}
                        onChange={(e) => setReadingTime(e.target.value)}
                        className="w-full sm:w-1/2 px-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                      />
                    </div>

                    {/* Editorial Badges (Staff only) */}
                    {user?.is_staff && (
                      <div className="p-3 bg-[#faf7f2] border border-[#ded7cc] rounded-sm space-y-2">
                        <label className="block text-xs font-bold text-gray-700">
                          {lang === 'en' ? 'Editorial Sections & Badges' : 'সম্পাদকীয় বিভাগ ও ব্যাজ'}
                        </label>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-sans">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newIsFeaturedHero}
                              onChange={(e) => setNewIsFeaturedHero(e.target.checked)}
                              className="w-4 h-4 text-[#800020] rounded border-gray-300 focus:ring-[#800020]"
                            />
                            <span className="font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              বিশেষ ফিচার (Special Featured)
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newIsColtiTrending}
                              onChange={(e) => setNewIsColtiTrending(e.target.checked)}
                              className="w-4 h-4 text-[#800020] rounded border-gray-300 focus:ring-[#800020]"
                            />
                            <span className="font-semibold text-rose-900 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              চলতি (Trending)
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newIsNirbachitoChoice}
                              onChange={(e) => setNewIsNirbachitoChoice(e.target.checked)}
                              className="w-4 h-4 text-[#800020] rounded border-gray-300 focus:ring-[#800020]"
                            />
                            <span className="font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              নির্বাচিত (Choice)
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Actions */}
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                    {user?.is_staff ? (
                      <>
                        <button
                          type="button"
                          disabled={savingBlog}
                          onClick={() => handleCreateBlog('published')}
                          className="px-5 py-2.5 bg-[#800020] hover:bg-[#9b1b30] text-white rounded text-xs font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                        >
                          {savingBlog ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          <span>সরাসরি প্রকাশ করুন (Publish Now)</span>
                        </button>
                        <button
                          type="button"
                          disabled={savingBlog}
                          onClick={() => handleCreateBlog('draft')}
                          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
                        >
                          <span>খসড়া হিসেবে রাখুন (Save Draft)</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={savingBlog}
                        onClick={() => handleCreateBlog('pending_approval')}
                        className="px-5 py-2.5 bg-[#800020] hover:bg-[#9b1b30] text-white rounded text-xs font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                      >
                        {savingBlog ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span>অনুমোদনের জন্য জমা দিন (Submit for Review)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: MY BLOGS                                                 */}
            {/* ------------------------------------------------------------- */}
            {currentPath === 'my-articles' && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-lg font-bold text-[#1e2022] font-sans">
                    {t('dash.myBlogs')}
                  </h2>
                  <p className="text-xs text-gray-500 font-sans">
                    Articles created by your account.
                  </p>
                </div>

                {myBlogs.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">You haven't written any articles yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {myBlogs.map((art) => (
                      <div key={art.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={art.image}
                            alt={art.title}
                            className="w-14 aspect-[4/3] object-cover rounded shadow-xs"
                          />
                          <div>
                            <Link to={`/post/${art.slug}`} className="font-bold text-gray-900 hover:text-[#800020] text-xs">
                              {art.title}
                            </Link>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-sans mt-0.5">
                              <span>Views: {art.view_count || 0}</span>
                              <span>•</span>
                              <span>Hearts: {art.hearts_count || 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans uppercase ${
                            art.status === 'published'
                              ? 'bg-emerald-50 text-emerald-800'
                              : art.status === 'pending_approval'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {art.status}
                          </span>
                          <button
                            onClick={() => openEditArticleModal(art)}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: AUTHOR PROFILE CUSTOMIZATION                             */}
            {/* ------------------------------------------------------------- */}
            {currentPath === 'profile' && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#1e2022] font-bengali">
                      {lang === 'en' ? 'Author Profile Customization' : 'লেখক প্রোফাইল কাস্টমাইজেশন'}
                    </h2>
                    <p className="text-xs text-gray-500 font-bengali mt-0.5">
                      {lang === 'en'
                        ? 'Manage your public pen name, bio, avatar, cover banner, and social channels.'
                        : 'আপনার পাবলিক লেখক পরিচয়, বায়ো, ছবি, কভার ব্যানার ও সামাজিক যোগাযোগ লিঙ্ক কাস্টমাইজ করুন।'}
                    </p>
                  </div>

                  {user?.username && (
                    <Link
                      to={`/author/${user.username}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-[#800020] text-white text-xs font-bengali font-semibold hover:bg-[#600018] shadow-xs transition"
                    >
                      <span>{lang === 'en' ? 'View Public Profile' : 'পাবলিক প্রোফাইল দেখুন'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {profileSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm text-xs font-bengali flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveAuthorProfile} className="space-y-6">
                  {/* Banner & Avatar Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 rounded-sm bg-[#fcfbfa] border border-[#eee8df]">
                    {/* Avatar Upload */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-[#800020]" />
                        <label className="text-xs font-bold font-bengali text-gray-800">
                          {lang === 'en' ? 'Author Avatar' : 'প্রোফাইল ছবি (Avatar)'}
                        </label>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full border-2 border-white shadow-md bg-[#800020] text-white flex items-center justify-center font-bold text-2xl font-bengali overflow-hidden flex-shrink-0">
                          {profileForm.avatar ? (
                            <img src={profileForm.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            (profileForm.display_name || user?.username || 'U').charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <ImageUpload
                            value={profileForm.avatar}
                            onChange={(url) => setProfileForm({ ...profileForm, avatar: url })}
                            label={lang === 'en' ? 'Upload Avatar' : 'নতুন ছবি আপলোড'}
                            aspectRatio="square"
                          />
                          <input
                            type="text"
                            value={profileForm.avatar || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                            placeholder={lang === 'en' ? 'Or enter direct avatar image URL...' : 'অথবা ছবির সরাসরি URL লিখুন...'}
                            className="w-full text-xs p-2 border border-[#ded7cc] rounded-sm bg-white focus:outline-none focus:border-[#800020]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cover Banner Upload */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#800020]" />
                        <label className="text-xs font-bold font-bengali text-gray-800">
                          {lang === 'en' ? 'Header Cover Banner' : 'কভার ব্যানার ছবি'}
                        </label>
                      </div>

                      <div className="space-y-2">
                        <div className="h-20 w-full rounded-sm overflow-hidden border border-[#ded7cc] bg-gradient-to-r from-[#2c000b] to-[#800020]">
                          {profileForm.cover_image && (
                            <img
                              src={profileForm.cover_image}
                              alt="Cover banner"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <ImageUpload
                          value={profileForm.cover_image || ''}
                          onChange={(url) => setProfileForm({ ...profileForm, cover_image: url })}
                          label={lang === 'en' ? 'Upload Cover Banner' : 'নতুন ব্যানার আপলোড'}
                          aspectRatio="banner"
                        />
                        <input
                          type="text"
                          value={profileForm.cover_image || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, cover_image: e.target.value })}
                          placeholder={lang === 'en' ? 'Or enter direct banner image URL...' : 'অথবা ব্যানারের সরাসরি URL লিখুন...'}
                          className="w-full text-xs p-2 border border-[#ded7cc] rounded-sm bg-white focus:outline-none focus:border-[#800020]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Display Names & Real Names */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                        {lang === 'en' ? 'Display / Pen Name (Bengali)' : 'লেখক প্রদর্শিত নাম / ছদ্মনাম (বাংলা)'}
                      </label>
                      <input
                        type="text"
                        value={profileForm.display_name || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
                        placeholder="যেমন: আহমদ ছফা, হুমায়ূন আহমেদ"
                        className="w-full text-xs p-2.5 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020] font-bengali"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                        {lang === 'en' ? 'Display / Pen Name (English)' : 'লেখক প্রদর্শিত নাম (English)'}
                      </label>
                      <input
                        type="text"
                        value={profileForm.display_name_en || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, display_name_en: e.target.value })}
                        placeholder="e.g. Ahmed Sofa"
                        className="w-full text-xs p-2.5 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020]"
                      />
                    </div>
                  </div>

                  {/* Real First & Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                        {lang === 'en' ? 'First Name' : 'নামের প্রথম অংশ (First Name)'}
                      </label>
                      <input
                        type="text"
                        value={profileForm.first_name || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                        placeholder="First Name"
                        className="w-full text-xs p-2.5 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                        {lang === 'en' ? 'Last Name' : 'নামের শেষ অংশ (Last Name)'}
                      </label>
                      <input
                        type="text"
                        value={profileForm.last_name || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                        placeholder="Last Name"
                        className="w-full text-xs p-2.5 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020]"
                      />
                    </div>
                  </div>

                  {/* Designation / Tagline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                        {lang === 'en' ? 'Designation / Tagline (Bengali)' : 'পদবি / লেখক পরিচয় (বাংলা)'}
                      </label>
                      <input
                        type="text"
                        value={profileForm.designation || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                        placeholder="যেমন: সাহিত্য ও শিল্প বিষয়ক লেখক, কলামিস্ট"
                        className="w-full text-xs p-2.5 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020] font-bengali"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                        {lang === 'en' ? 'Designation / Tagline (English)' : 'পদবি / লেখক পরিচয় (English)'}
                      </label>
                      <input
                        type="text"
                        value={profileForm.designation_en || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, designation_en: e.target.value })}
                        placeholder="e.g. Senior Literary & Arts Columnist"
                        className="w-full text-xs p-2.5 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020]"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                        {lang === 'en' ? 'Author Biography (Bengali)' : 'লেখক পরিচিতি / বায়ো (বাংলা)'}
                      </label>
                      <textarea
                        rows={4}
                        value={profileForm.bio || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        placeholder="আপনার লেখালেখির অভিজ্ঞতা, আগ্রহের ক্ষেত্র ও পরিচিতি লিখুন..."
                        className="w-full text-xs p-2.5 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020] font-bengali leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                        {lang === 'en' ? 'Author Biography (English)' : 'লেখক পরিচিতি / বায়ো (English)'}
                      </label>
                      <textarea
                        rows={4}
                        value={profileForm.bio_en || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, bio_en: e.target.value })}
                        placeholder="Write a concise overview of your background and writings..."
                        className="w-full text-xs p-2.5 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020] leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                        {lang === 'en' ? 'Location (Bengali)' : 'অবস্থান / জেলা (বাংলা)'}
                      </label>
                      <input
                        type="text"
                        value={profileForm.location || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        placeholder="যেমন: ধানমন্ডি, ঢাকা"
                        className="w-full text-xs p-2.5 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020] font-bengali"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                        {lang === 'en' ? 'Location (English)' : 'অবস্থান / জেলা (English)'}
                      </label>
                      <input
                        type="text"
                        value={profileForm.location_en || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, location_en: e.target.value })}
                        placeholder="e.g. Dhanmondi, Dhaka"
                        className="w-full text-xs p-2.5 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020]"
                      />
                    </div>
                  </div>

                  {/* Social and Website URLs */}
                  <div>
                    <label className="block text-xs font-bold font-bengali text-gray-800 mb-2">
                      {lang === 'en' ? 'Websites & Social Media Profiles' : 'ওয়েবসাইট ও সোশ্যাল মিডিয়া প্রোফাইল লিংক'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2 border border-[#ded7cc] rounded-sm px-3 py-2 bg-white">
                        <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input
                          type="url"
                          value={profileForm.website || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                          placeholder="ব্যক্তিগত ওয়েবসাইট লিঙ্ক"
                          className="w-full focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 border border-[#ded7cc] rounded-sm px-3 py-2 bg-white">
                        <Twitter className="w-4 h-4 text-[#1da1f2] flex-shrink-0" />
                        <input
                          type="url"
                          value={profileForm.twitter_url || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, twitter_url: e.target.value })}
                          placeholder="Twitter / X প্রোফাইল লিঙ্ক"
                          className="w-full focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 border border-[#ded7cc] rounded-sm px-3 py-2 bg-white">
                        <Facebook className="w-4 h-4 text-[#1877f2] flex-shrink-0" />
                        <input
                          type="url"
                          value={profileForm.facebook_url || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, facebook_url: e.target.value })}
                          placeholder="Facebook প্রোফাইল লিঙ্ক"
                          className="w-full focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 border border-[#ded7cc] rounded-sm px-3 py-2 bg-white">
                        <Instagram className="w-4 h-4 text-[#e4405f] flex-shrink-0" />
                        <input
                          type="url"
                          value={profileForm.instagram_url || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, instagram_url: e.target.value })}
                          placeholder="Instagram প্রোফাইল লিঙ্ক"
                          className="w-full focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 border border-[#ded7cc] rounded-sm px-3 py-2 bg-white">
                        <Linkedin className="w-4 h-4 text-[#0a66c2] flex-shrink-0" />
                        <input
                          type="url"
                          value={profileForm.linkedin_url || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, linkedin_url: e.target.value })}
                          placeholder="LinkedIn প্রোফাইল লিঙ্ক"
                          className="w-full focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 border border-[#ded7cc] rounded-sm px-3 py-2 bg-white">
                        <Github className="w-4 h-4 text-gray-700 flex-shrink-0" />
                        <input
                          type="url"
                          value={profileForm.github_url || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, github_url: e.target.value })}
                          placeholder="GitHub প্রোফাইল লিঙ্ক"
                          className="w-full focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400 font-bengali">
                      {lang === 'en'
                        ? 'Changes will appear on your public author page immediately.'
                        : 'সংরক্ষিত পরিবর্তন তাৎক্ষণিকভাবে আপনার পাবলিক পেজে প্রদর্শিত হবে।'}
                    </span>
                    <button
                      type="submit"
                      disabled={savingAuthorProfile}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-sm bg-[#800020] text-white text-xs font-bengali font-semibold hover:bg-[#600018] disabled:opacity-50 shadow-sm transition"
                    >
                      {savingAuthorProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{lang === 'en' ? 'Saving Profile...' : 'সংরক্ষণ হচ্ছে...'}</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>{lang === 'en' ? 'Save Profile' : 'প্রোফাইল সংরক্ষণ করুন'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: HERO BANNER SLIDER (DEDICATED IMAGES SLIDER MODULE)     */}
            {/* ------------------------------------------------------------- */}
            {currentPath === 'hero-slider' && user?.is_staff && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-6">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#1e2022] font-sans flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-[#800020]" />
                      <span>{lang === 'en' ? 'Hero Banner Slider Management' : 'হিরো ব্যানার স্লাইডার ব্যবস্থাপনা'}</span>
                    </h2>
                    <p className="text-xs text-gray-500 font-sans mt-0.5">
                      {lang === 'en'
                        ? 'Manage pure homepage visual banner slides and their destination links. Clicking the banner image navigates to the specified URL.'
                        : 'হোমপেজের মূল ভিজ্যুয়াল ব্যানার স্লাইডার ও ব্যানারের লিঙ্ক নিয়ন্ত্রণ করুন। ব্যানারের ছবিতে ক্লিক করলে নির্ধারিত পেজ বা লিঙ্কে যাবে।'}
                    </p>
                  </div>
                  <button
                    onClick={openNewHeroSlideModal}
                    className="px-4 py-2 bg-[#800020] hover:bg-[#600018] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{lang === 'en' ? 'Add New Slide' : 'নতুন স্লাইড যোগ করুন'}</span>
                  </button>
                </div>

                {/* Success Notification */}
                {heroSlideSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs font-sans text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{heroSlideSuccessMsg}</span>
                  </div>
                )}

                {/* KPI Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#faf7f2] border border-[#e2ddd3] p-4 rounded-sm">
                    <span className="text-[10px] font-sans font-bold uppercase text-gray-500 block mb-1">
                      {lang === 'en' ? 'Total Slides' : 'মোট স্লাইড'}
                    </span>
                    <div className="text-2xl font-bold font-sans text-gray-900">
                      {heroSlides.length}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans mt-0.5 block">
                      {lang === 'en' ? 'In database repository' : 'ডাটাবেজে সংরক্ষিত স্লাইড'}
                    </span>
                  </div>

                  <div className="bg-[#faf7f2] border border-[#e2ddd3] p-4 rounded-sm">
                    <span className="text-[10px] font-sans font-bold uppercase text-gray-500 block mb-1">
                      {lang === 'en' ? 'Active on Homepage' : 'হোমপেজে সক্রিয়'}
                    </span>
                    <div className="text-2xl font-bold font-sans text-emerald-700">
                      {heroSlides.filter((s) => s.is_active).length}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-sans mt-0.5 block">
                      {lang === 'en' ? 'Currently cycling in slider' : 'বর্তমানে স্লাইডারে দৃশ্যমান'}
                    </span>
                  </div>

                  <div className="bg-[#faf7f2] border border-[#e2ddd3] p-4 rounded-sm">
                    <span className="text-[10px] font-sans font-bold uppercase text-gray-500 block mb-1">
                      {lang === 'en' ? 'Inactive / Draft' : 'নিষ্ক্রিয় বা খসড়া'}
                    </span>
                    <div className="text-2xl font-bold font-sans text-gray-400">
                      {heroSlides.filter((s) => !s.is_active).length}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans mt-0.5 block">
                      {lang === 'en' ? 'Hidden from homepage' : 'হোমপেজে প্রদর্শিত হচ্ছে না'}
                    </span>
                  </div>
                </div>

                {/* Search & Order Information Note */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder={lang === 'en' ? 'Search slides by title or subtitle...' : 'শিরোনাম বা সাবটাইটেল দিয়ে স্লাইড খুঁজুন...'}
                      value={heroSlideSearch}
                      onChange={(e) => setHeroSlideSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] bg-white font-sans"
                    />
                  </div>
                  <div className="text-[11px] font-sans text-gray-500 bg-[#fbf9f6] border border-[#e8e2d8] px-3 py-2 rounded flex items-center gap-1.5 shrink-0">
                    <AlertCircle className="w-3.5 h-3.5 text-[#800020] shrink-0" />
                    <span>{lang === 'en' ? 'Use ▲ / ▼ arrows to reorder. Active slides cycle automatically on homepage.' : 'ক্রম সাজাতে ▲ / ▼ ব্যবহার করুন। সক্রিয় স্লাইডগুলো সাইটে স্বয়ংক্রিয়ভাবে চলবে।'}</span>
                  </div>
                </div>

                {/* Slides List */}
                {filteredHeroSlides.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-[#ded7cc] rounded-sm bg-[#faf7f2]">
                    <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-sans font-semibold text-gray-600">
                      {lang === 'en' ? 'No hero slides found.' : 'কোনো হিরো স্লাইড পাওয়া যায়নি।'}
                    </p>
                    <button
                      onClick={openNewHeroSlideModal}
                      className="mt-3 px-3.5 py-1.5 bg-[#800020] text-white rounded text-xs font-semibold hover:bg-[#600018] transition"
                    >
                      {lang === 'en' ? 'Create First Hero Slide' : 'প্রথম হিরো স্লাইড তৈরি করুন'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredHeroSlides.map((slide, index) => (
                      <div
                        key={slide.id}
                        className={`p-4 border rounded-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          slide.is_active
                            ? 'bg-white border-[#ded7cc] hover:border-[#800020]/40 shadow-xs'
                            : 'bg-gray-50/70 border-gray-200 opacity-75'
                        }`}
                      >
                        {/* Left: Reorder arrows & Sequence badge */}
                        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleMoveHeroSlideOrder(slide.id, 'up')}
                              disabled={index === 0}
                              className={`p-1 rounded transition border ${
                                index === 0
                                  ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                                  : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-black'
                              }`}
                              title={lang === 'en' ? 'Move up in sequence' : 'উপরে সরান'}
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveHeroSlideOrder(slide.id, 'down')}
                              disabled={index === filteredHeroSlides.length - 1}
                              className={`p-1 rounded transition border ${
                                index === filteredHeroSlides.length - 1
                                  ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                                  : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-black'
                              }`}
                              title={lang === 'en' ? 'Move down in sequence' : 'নিচে সরান'}
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="w-8 h-8 rounded bg-[#faf7f2] border border-[#e2ddd3] flex items-center justify-center font-mono font-bold text-xs text-gray-700">
                            #{index + 1}
                          </div>
                        </div>

                        {/* Slide Image Thumbnail */}
                        <div className="relative w-full md:w-48 h-28 shrink-0 rounded overflow-hidden border border-[#ded7cc] bg-black/5 group">
                          <img
                            src={slide.image}
                            alt={slide.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/images/18-1024x678.jpg';
                            }}
                          />
                          <a
                            href={slide.image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 text-white rounded text-[10px] opacity-0 group-hover:opacity-100 transition"
                            title={lang === 'en' ? 'View high-res image' : 'আসল ছবি দেখুন'}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {/* Content details */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-sans font-bold text-sm sm:text-base text-gray-900 truncate">
                              {slide.title || 'Banner Slide'}
                            </h3>
                            {slide.title_en && (
                              <span className="text-[11px] font-sans text-gray-500 font-medium truncate">
                                ({slide.title_en})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap pt-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#f7f2eb] border border-[#e2ddd3] text-xs font-sans text-gray-800">
                              <span className="font-semibold text-[#800020]">{lang === 'en' ? 'Link on Image:' : 'ছবির লিঙ্ক:'}</span>
                              <span className="font-mono text-[11px] text-gray-700 truncate max-w-xs">
                                {slide.button_link || slide.link || '(No link - static image)'}
                              </span>
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">
                              Order: {slide.display_order}
                            </span>
                          </div>
                        </div>

                        {/* Status Toggle & Actions */}
                        <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                          {/* Active Toggle */}
                          <button
                            onClick={() => handleToggleHeroSlideActive(slide.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans font-semibold transition border ${
                              slide.is_active
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                            }`}
                            title={lang === 'en' ? 'Toggle active visibility on homepage' : 'হোমপেজে দৃশ্যমানতা পরিবর্তন করুন'}
                          >
                            {slide.is_active ? (
                              <>
                                <ToggleRight className="w-4 h-4 text-emerald-600" />
                                <span>{lang === 'en' ? 'Active' : 'সক্রিয়'}</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-4 h-4 text-gray-400" />
                                <span>{lang === 'en' ? 'Hidden' : 'লুকায়িত'}</span>
                              </>
                            )}
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => openEditHeroSlideModal(slide)}
                            className="p-1.5 bg-[#faf7f2] hover:bg-[#f2ece1] text-gray-700 border border-[#ded7cc] rounded transition"
                            title={lang === 'en' ? 'Edit slide' : 'সম্পাদনা করুন'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteHeroSlide(slide.id, slide.title)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded transition"
                            title={lang === 'en' ? 'Delete slide' : 'মুছে ফেলুন'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: VIDEOS MANAGEMENT (YOUTUBE EMBED & DIRECT VIDEO UPLOAD)  */}
            {/* ------------------------------------------------------------- */}
            {currentPath === 'videos' && user?.is_staff && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-6">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#1e2022] font-sans flex items-center gap-2">
                      <Film className="w-5 h-5 text-[#800020]" />
                      <span>{lang === 'en' ? 'Video Stories Management' : 'ভিডিও স্টোরি ও কন্টেন্ট ব্যবস্থাপনা'}</span>
                    </h2>
                    <p className="text-xs text-gray-500 font-sans mt-0.5">
                      {lang === 'en'
                        ? 'Manage homepage video stories. Supports YouTube embeds with automatic thumbnail detection or direct video uploads (MP4, WebM).'
                        : 'হোমপেজের ভিডিও সেকশন নিয়ন্ত্রণ করুন। ইউটিউব ভিডিও লিঙ্ক (অটো থাম্বনেইল সহ) অথবা সরাসরি ভিডিও ফাইল (MP4, WebM) আপলোড সমর্থন করে।'}
                    </p>
                  </div>
                  <button
                    onClick={openNewVideoModal}
                    className="px-4 py-2 bg-[#800020] hover:bg-[#600018] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition shrink-0 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{lang === 'en' ? 'Add New Video' : 'নতুন ভিডিও যোগ করুন'}</span>
                  </button>
                </div>

                {/* Success Notification */}
                {videoSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs font-sans text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{videoSuccessMsg}</span>
                  </div>
                )}

                {/* KPI Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-[#faf7f2] border border-[#e2ddd3] p-4 rounded-sm">
                    <span className="text-[10px] font-sans font-bold uppercase text-gray-500 block mb-1">
                      {lang === 'en' ? 'Total Videos' : 'মোট ভিডিও'}
                    </span>
                    <div className="text-2xl font-bold font-sans text-gray-900">
                      {videosList.length}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans mt-0.5 block">
                      {lang === 'en' ? 'In video library' : 'ভিডিও লাইব্রেরিতে সংরক্ষিত'}
                    </span>
                  </div>

                  <div className="bg-[#faf7f2] border border-[#e2ddd3] p-4 rounded-sm">
                    <span className="text-[10px] font-sans font-bold uppercase text-gray-500 block mb-1">
                      {lang === 'en' ? 'Active on Homepage' : 'হোমপেজে সক্রিয়'}
                    </span>
                    <div className="text-2xl font-bold font-sans text-emerald-700">
                      {videosList.filter((v) => v.is_active).length}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-sans mt-0.5 block">
                      {lang === 'en' ? 'Currently visible to visitors' : 'ভিজিটরদের নিকট দৃশ্যমান'}
                    </span>
                  </div>

                  <div className="bg-[#faf7f2] border border-[#e2ddd3] p-4 rounded-sm">
                    <span className="text-[10px] font-sans font-bold uppercase text-gray-500 block mb-1">
                      {lang === 'en' ? 'YouTube Embeds' : 'ইউটিউব এমবেড'}
                    </span>
                    <div className="text-2xl font-bold font-sans text-red-600">
                      {videosList.filter((v) => v.video_type === 'youtube').length}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans mt-0.5 block">
                      {lang === 'en' ? 'Embedded players' : 'ইউটিউব থেকে চালিত'}
                    </span>
                  </div>

                  <div className="bg-[#faf7f2] border border-[#e2ddd3] p-4 rounded-sm">
                    <span className="text-[10px] font-sans font-bold uppercase text-gray-500 block mb-1">
                      {lang === 'en' ? 'Direct Uploads' : 'সরাসরি ভিডিও'}
                    </span>
                    <div className="text-2xl font-bold font-sans text-amber-700">
                      {videosList.filter((v) => v.video_type === 'direct').length}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans mt-0.5 block">
                      {lang === 'en' ? 'Self-hosted HTML5 video' : 'নিজস্ব ফাইল / লিঙ্ক'}
                    </span>
                  </div>
                </div>

                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder={lang === 'en' ? 'Search videos by title or description...' : 'শিরোনাম বা বিবরণ দিয়ে ভিডিও খুঁজুন...'}
                      value={videoSearch}
                      onChange={(e) => setVideoSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] bg-white font-sans"
                    />
                  </div>

                  <div className="flex items-center flex-wrap gap-1.5">
                    {(['all', 'youtube', 'direct'] as const).map((tVal) => (
                      <button
                        key={tVal}
                        type="button"
                        onClick={() => setVideoTypeFilter(tVal)}
                        className={`px-2.5 py-1.5 rounded text-xs font-semibold transition cursor-pointer ${
                          videoTypeFilter === tVal
                            ? 'bg-[#800020] text-white shadow-xs'
                            : 'bg-white border border-[#ded7cc] text-gray-700 hover:bg-[#faf7f2]'
                        }`}
                      >
                        {tVal === 'all'
                          ? (lang === 'en' ? 'All' : 'সকল')
                          : tVal === 'youtube'
                          ? 'YouTube'
                          : (lang === 'en' ? 'Direct Video' : 'সরাসরি ভিডিও')}
                      </button>
                    ))}

                    <select
                      value={videoCategoryFilter}
                      onChange={(e) => setVideoCategoryFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded text-xs border border-[#ded7cc] bg-white text-gray-700 font-sans focus:outline-none focus:border-[#800020] cursor-pointer"
                    >
                      <option value="all">{lang === 'en' ? 'All Categories' : 'সকল ক্যাটাগরি'}</option>
                      {allFlattenedCategories.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.depth > 0 ? '— '.repeat(c.depth) : ''}{c.name} {c.name_en ? `(${c.name_en})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Videos List */}
                {filteredVideos.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-[#ded7cc] rounded-sm bg-[#faf7f2]">
                    <Film className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-sans font-semibold text-gray-600">
                      {lang === 'en' ? 'No video stories found.' : 'কোনো ভিডিও পাওয়া যায়নি।'}
                    </p>
                    <button
                      onClick={openNewVideoModal}
                      className="mt-3 px-3.5 py-1.5 bg-[#800020] text-white rounded text-xs font-semibold hover:bg-[#600018] transition cursor-pointer"
                    >
                      {lang === 'en' ? 'Add First Video Story' : 'প্রথম ভিডিও যোগ করুন'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredVideos.map((vid, index) => {
                      const thumb = vid.effective_thumbnail || vid.thumbnail || (vid.youtube_id ? `https://img.youtube.com/vi/${vid.youtube_id}/hqdefault.jpg` : '');
                      return (
                        <div
                          key={vid.id}
                          className={`p-4 border rounded-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                            vid.is_active
                              ? 'bg-white border-[#ded7cc] hover:border-[#800020]/40 shadow-xs'
                              : 'bg-gray-50/70 border-gray-200 opacity-75'
                          }`}
                        >
                          {/* Sequence Controls */}
                          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleMoveVideoOrder(vid.id, 'up')}
                                disabled={index === 0}
                                className={`p-1 rounded transition border cursor-pointer ${
                                  index === 0
                                    ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-black'
                                }`}
                                title={lang === 'en' ? 'Move up in sequence' : 'উপরে সরান'}
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveVideoOrder(vid.id, 'down')}
                                disabled={index === filteredVideos.length - 1}
                                className={`p-1 rounded transition border cursor-pointer ${
                                  index === filteredVideos.length - 1
                                    ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-black'
                                }`}
                                title={lang === 'en' ? 'Move down in sequence' : 'নিচে সরান'}
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="w-8 h-8 rounded bg-[#faf7f2] border border-[#e2ddd3] flex items-center justify-center font-mono font-bold text-xs text-gray-700">
                              #{index + 1}
                            </div>
                          </div>

                          {/* Video Thumbnail Box */}
                          <div className="relative w-full md:w-44 aspect-video rounded overflow-hidden shrink-0 bg-black/80 border border-gray-200">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={vid.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Film className="w-6 h-6" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <span className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center">
                                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                              </span>
                            </div>
                            {vid.duration && (
                              <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white px-1 py-0.2 rounded font-mono">
                                {vid.duration}
                              </span>
                            )}
                          </div>

                          {/* Video Info Details */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center flex-wrap gap-1.5">
                              {vid.video_type === 'youtube' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">
                                  <Youtube className="w-3 h-3" />
                                  YouTube
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                                  <Film className="w-3 h-3" />
                                  Direct Video
                                </span>
                              )}

                              {(vid.category_name || vid.category_name_en) && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#800020]/10 text-[#800020]">
                                  <FolderTree className="w-2.5 h-2.5" />
                                  {lang === 'en' && vid.category_name_en ? vid.category_name_en : vid.category_name}
                                </span>
                              )}

                              {vid.is_featured && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500 text-white shadow-2xs">
                                  <Sparkles className="w-3 h-3" />
                                  {lang === 'en' ? 'Spotlight Player' : 'স্পটলাইট প্লেয়ার'}
                                </span>
                              )}

                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  vid.is_active
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {vid.is_active
                                  ? (lang === 'en' ? 'Active' : 'সক্রিয়')
                                  : (lang === 'en' ? 'Inactive' : 'নিষ্ক্রিয়')}
                              </span>
                            </div>

                            <h3 className="font-bengali font-bold text-sm text-[#1e2022] leading-snug">
                              {vid.title}
                            </h3>

                            {vid.title_en && (
                              <p className="text-xs text-gray-500 font-sans">
                                {vid.title_en}
                              </p>
                            )}

                            {vid.description && (
                              <p className="text-xs text-gray-500 font-bengali line-clamp-1">
                                {vid.description}
                              </p>
                            )}

                            <div className="text-[11px] font-mono text-gray-400 truncate max-w-md">
                              {vid.video_type === 'youtube'
                                ? (vid.youtube_url || `ID: ${vid.youtube_id}`)
                                : (vid.effective_video_url || vid.video_url || vid.video_file || 'Direct file')}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                            {/* Toggle Spotlight Featured */}
                            <button
                              onClick={() => handleToggleVideoFeatured(vid.id)}
                              className={`p-1.5 rounded transition border cursor-pointer ${
                                vid.is_featured
                                  ? 'bg-amber-50 text-amber-600 border-amber-300'
                                  : 'bg-white text-gray-400 border-gray-200 hover:text-amber-500'
                              }`}
                              title={lang === 'en' ? 'Toggle Spotlight Player' : 'স্পটলাইট প্লেয়ার হিসেবে নির্ধারণ করুন'}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>

                            {/* Toggle Active status */}
                            <button
                              onClick={() => handleToggleVideoActive(vid.id)}
                              className={`px-2.5 py-1.5 rounded text-xs font-semibold transition border cursor-pointer ${
                                vid.is_active
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                              }`}
                            >
                              {vid.is_active ? (lang === 'en' ? 'Active' : 'সক্রিয়') : (lang === 'en' ? 'Inactive' : 'নিষ্ক্রিয়')}
                            </button>

                            {/* Edit button */}
                            <button
                              onClick={() => openEditVideoModal(vid)}
                              className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded transition cursor-pointer"
                              title={lang === 'en' ? 'Edit video' : 'সম্পাদনা করুন'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteVideo(vid.id, vid.title)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded transition cursor-pointer"
                              title={lang === 'en' ? 'Delete video' : 'মুছে ফেলুন'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: CATEGORIES MANAGEMENT (IMPROVED HIERARCHY & CONTROLS)    */}
            {/* ------------------------------------------------------------- */}
            {currentPath === 'categories' && user?.is_staff && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-6">
                
                {/* Header & Stats Overview */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#1e2022] font-sans flex items-center gap-2">
                      <FolderTree className="w-5 h-5 text-[#800020]" />
                      <span>{lang === 'en' ? 'Category Taxonomy & Navigation Architecture' : 'ক্যাটাগরি ও ন্যাভিগেশন স্থাপত্য'}</span>
                    </h2>
                    <p className="text-xs text-gray-500 font-sans mt-0.5">
                      {lang === 'en'
                        ? 'Organize hierarchical sections, configure navbar order, and manage bilingual descriptions.'
                        : 'মূল বিভাগ ও উপ-বিভাগ সাজান, মেন্যু বিন্যাস করুন ও দ্বৈত ভাষার বিবরণ নিয়ন্ত্রণ করুন।'}
                    </p>
                  </div>

                  <div className="flex items-center flex-wrap gap-2">
                    {isSavingCategoryOrder && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-xs font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#800020]" />
                        <span>{lang === 'en' ? 'Saving positions...' : 'ক্রম সংরক্ষিত হচ্ছে...'}</span>
                      </div>
                    )}

                    <button
                      onClick={handleNormalizeCategoryOrder}
                      disabled={isSavingCategoryOrder}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold flex items-center gap-1.5 transition border border-[#ded7cc] cursor-pointer"
                      title={lang === 'en' ? 'Re-index display orders cleanly (1, 2, 3...)' : 'ক্রম স্বাভাবিক ১, ২, ৩... সাজান'}
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                      <span>{lang === 'en' ? 'Normalize Sequence' : 'ক্রম সাজান'}</span>
                    </button>

                    <button
                      onClick={openNewCategoryModal}
                      className="px-3.5 py-2 bg-[#800020] hover:bg-[#9b1b30] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'New Top Category' : 'নতুন মূল বিভাগ'}</span>
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#faf7f2] border border-[#ded7cc] p-3 rounded-sm">
                    <span className="text-[10px] font-sans font-bold uppercase text-gray-400 block mb-0.5">
                      {lang === 'en' ? 'Total Categories' : 'মোট ক্যাটাগরি'}
                    </span>
                    <div className="text-xl font-bold font-sans text-gray-900">
                      {totalCategoriesCount}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans">
                      All taxonomy records
                    </span>
                  </div>

                  <div className="bg-[#faf7f2] border border-[#ded7cc] p-3 rounded-sm">
                    <span className="text-[10px] font-sans font-bold uppercase text-gray-400 block mb-0.5">
                      {lang === 'en' ? 'Primary Sections' : 'মূল বিভাগসমূহ'}
                    </span>
                    <div className="text-xl font-bold font-sans text-[#800020]">
                      {topLevelCategoriesCount}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans">
                      Top-level parents
                    </span>
                  </div>

                  <div className="bg-[#faf7f2] border border-[#ded7cc] p-3 rounded-sm">
                    <span className="text-[10px] font-sans font-bold uppercase text-gray-400 block mb-0.5">
                      {lang === 'en' ? 'Sub-categories' : 'উপ-বিভাগসমূহ'}
                    </span>
                    <div className="text-xl font-bold font-sans text-indigo-700">
                      {subcategoriesCount}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans">
                      Nested sub-sections
                    </span>
                  </div>

                  <div className="bg-[#faf7f2] border border-[#ded7cc] p-3 rounded-sm">
                    <span className="text-[10px] font-sans font-bold uppercase text-gray-400 block mb-0.5">
                      {lang === 'en' ? 'Navbar Visible' : 'ন্যাভবারে দৃশ্যমান'}
                    </span>
                    <div className="text-xl font-bold font-sans text-emerald-700">
                      {navVisibleCount}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans">
                      Active on menu bar
                    </span>
                  </div>
                </div>

                {/* Filter & View Mode Controls Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#f7f2eb] border border-[#ded7cc] rounded-sm">
                  {/* Left: View Switcher */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded border border-[#ded7cc]">
                    <button
                      onClick={() => setCategoryViewMode('tree')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                        categoryViewMode === 'tree'
                          ? 'bg-[#800020] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <FolderTree className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Hierarchy Tree' : 'শাখা বিন্যাস (Tree)'}</span>
                    </button>
                    <button
                      onClick={() => setCategoryViewMode('table')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                        categoryViewMode === 'table'
                          ? 'bg-[#800020] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Table View' : 'টেবিল ভিউ'}</span>
                    </button>
                  </div>

                  {/* Center & Right: Search, Filter, Sort */}
                  <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
                    {/* Search */}
                    <div className="relative min-w-[180px] max-w-xs flex-1">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search category, English name, slug..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                      />
                      {categorySearch && (
                        <button
                          onClick={() => setCategorySearch('')}
                          className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Filter Type */}
                    <select
                      value={categoryFilterType}
                      onChange={(e) => setCategoryFilterType(e.target.value as any)}
                      className="px-2.5 py-1.5 text-xs bg-white border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                    >
                      <option value="all">All Categories</option>
                      <option value="top_level">Primary Sections Only</option>
                      <option value="subcategories">Sub-categories Only</option>
                      <option value="nav_visible">Navbar Visible Only</option>
                      <option value="nav_hidden">Hidden from Navbar</option>
                    </select>

                    {/* Sort By */}
                    <select
                      value={categorySortBy}
                      onChange={(e) => setCategorySortBy(e.target.value as any)}
                      className="px-2.5 py-1.5 text-xs bg-white border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                    >
                      <option value="order_asc">Order (Low → High)</option>
                      <option value="order_desc">Order (High → Low)</option>
                      <option value="name_asc">Name (A → Z)</option>
                      <option value="articles_desc">Articles (Most First)</option>
                    </select>
                  </div>
                </div>

                {/* Drag & Reorder Instruction Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-[#fcfaf7] border border-[#ded7cc] rounded-sm text-xs text-gray-700 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-[#800020] shrink-0" />
                    <span>
                      {lang === 'en'
                        ? 'Easily change position: Drag the grip handles (⋮⋮) to reorder, click Up/Down arrows, or click any #number to type an exact position.'
                        : 'সহজেই অবস্থান পরিবর্তন করুন: ড্র্যাগ করতে গ্রিপ হ্যান্ডেল (⋮⋮) টানুন, তীরচিহ্নে ক্লিক করুন, অথবা সরাসরি #নম্বরে ক্লিক করে নির্দিষ্ট অবস্থান লিখুন।'}
                    </span>
                  </div>
                  {categorySortBy !== 'order_asc' && (
                    <button
                      onClick={() => setCategorySortBy('order_asc')}
                      className="text-[11px] font-bold text-[#800020] hover:underline cursor-pointer"
                    >
                      {lang === 'en' ? 'Switch to Order Sorting' : 'ক্রম অনুসারে সাজান'}
                    </button>
                  )}
                </div>

                {/* --------------------------------------------------------- */}
                {/* VIEW 1: HIERARCHY TREE VIEW (INFINITE LEVELS)             */}
                {/* --------------------------------------------------------- */}
                {categoryViewMode === 'tree' ? (
                  <div className="space-y-4">
                    {filteredTreeCategories.length === 0 ? (
                      <div className="py-12 text-center text-gray-400 border border-gray-100 rounded-sm">
                        <FolderTree className="w-10 h-10 mx-auto mb-2 opacity-40 text-[#800020]" />
                        <p className="text-sm font-semibold text-gray-600">
                          {lang === 'en' ? 'No categories matching the filter' : 'কোনো ক্যাটাগরি পাওয়া যায়নি'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Try resetting search or filter options.</p>
                      </div>
                    ) : (
                      filteredTreeCategories.map((rootCat, rootIdx) => (
                        <CategoryTreeNode
                          key={rootCat.id}
                          category={rootCat}
                          depth={0}
                          index={rootIdx}
                          siblingCount={filteredTreeCategories.length}
                          collapsedIds={collapsedCategoryIds}
                          onToggleCollapse={toggleCollapseCategory}
                          onAddSub={openAddSubcategoryModal}
                          onEdit={openEditCategoryModal}
                          onDelete={handleDeleteCategory}
                          onToggleNav={handleToggleCategoryNav}
                          onToggleFeatured={handleToggleCategoryFeatured}
                          onMoveStep={handleMoveCategoryStep}
                          onCommitOrder={handleCommitDirectOrder}
                          onFilterArticles={handleFilterArticlesByCategory}
                          editingOrderId={editingOrderCatId}
                          inputOrderVal={inputOrderVal}
                          onStartEditingOrder={(id, order) => {
                            setEditingOrderCatId(id);
                            setInputOrderVal(String(order));
                          }}
                          onChangeInputOrder={setInputOrderVal}
                          onCancelEditingOrder={() => setEditingOrderCatId(null)}
                          draggingCat={draggingCategory}
                          dragOverCat={dragOverCategory}
                          onDragStart={(e, cat) => {
                            const target = e.target as HTMLElement;
                            if (target.closest('button, input, a, select')) {
                              e.preventDefault();
                              return;
                            }
                            e.dataTransfer.setData(
                              'text/plain',
                              JSON.stringify({ id: cat.id, parentId: cat.parent || null })
                            );
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggingCategory({ id: cat.id, parentId: cat.parent || null });
                          }}
                          onDragEnd={() => {
                            setDraggingCategory(null);
                            setDragOverCategory(null);
                          }}
                          onDragOver={(e, cat) => {
                            if (
                              draggingCategory &&
                              draggingCategory.id !== cat.id &&
                              (draggingCategory.parentId || null) === (cat.parent || null)
                            ) {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              if (dragOverCategory?.id !== cat.id) {
                                setDragOverCategory({ id: cat.id, parentId: cat.parent || null });
                              }
                            }
                          }}
                          onDragLeave={(cat) => {
                            if (dragOverCategory?.id === cat.id) {
                              setDragOverCategory(null);
                            }
                          }}
                          onDrop={(e, cat) => {
                            e.preventDefault();
                            if (
                              draggingCategory &&
                              draggingCategory.id !== cat.id &&
                              (draggingCategory.parentId || null) === (cat.parent || null)
                            ) {
                              reorderSiblings(cat.parent || null, draggingCategory.id, cat.id);
                            }
                            setDraggingCategory(null);
                            setDragOverCategory(null);
                          }}
                          lang={lang}
                        />
                      ))
                    )}
                  </div>
                ) : (
                  /* --------------------------------------------------------- */
                  /* VIEW 2: FLAT TABULAR DATA VIEW                            */
                  /* --------------------------------------------------------- */
                  <div className="overflow-x-auto border border-gray-100 rounded-sm">
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="bg-[#f7f2eb] border-b border-[#ded7cc] text-gray-700 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3 w-8 text-center">Move</th>
                          <th className="py-2.5 px-3">Banner</th>
                          <th className="py-2.5 px-3">Name (BN & EN)</th>
                          <th className="py-2.5 px-3">Type & Parent</th>
                          <th className="py-2.5 px-3">Slug Route</th>
                          <th className="py-2.5 px-3">Display Order</th>
                          <th className="py-2.5 px-3">Navbar Status</th>
                          <th className="py-2.5 px-3">Articles</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredFlatCategories.map((cat, catIndex) => {
                          const isTableDragging = draggingCategory?.id === cat.id;
                          const isTableTarget = dragOverCategory?.id === cat.id;

                          return (
                            <tr
                              key={cat.id}
                              draggable
                              onDragStart={(e) => {
                                const target = e.target as HTMLElement;
                                if (target.closest('button, input, a, select')) {
                                  e.preventDefault();
                                  return;
                                }
                                e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'table', id: cat.id }));
                                e.dataTransfer.effectAllowed = 'move';
                                setDraggingCategory({ type: 'table', id: cat.id });
                              }}
                              onDragEnd={() => {
                                setDraggingCategory(null);
                                setDragOverCategory(null);
                              }}
                              onDragOver={(e) => {
                                if (draggingCategory?.id !== cat.id) {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = 'move';
                                  if (dragOverCategory?.id !== cat.id) {
                                    setDragOverCategory({ type: 'table', id: cat.id });
                                  }
                                }
                              }}
                              onDragLeave={() => {
                                if (dragOverCategory?.id === cat.id) {
                                  setDragOverCategory(null);
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (draggingCategory?.id !== cat.id) {
                                  reorderTableCategories(draggingCategory!.id, cat.id);
                                }
                                setDraggingCategory(null);
                                setDragOverCategory(null);
                              }}
                              className={`transition-all duration-150 ${
                                isTableDragging
                                  ? 'opacity-40 bg-rose-50/20 border-dashed border-2 border-[#800020]'
                                  : isTableTarget
                                  ? 'border-t-2 border-t-[#800020] bg-amber-50/40'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <td className="py-2.5 px-2 text-center">
                                <div
                                  className="cursor-grab active:cursor-grabbing inline-flex p-1 text-gray-400 hover:text-[#800020] hover:bg-gray-100 rounded transition select-none"
                                  title="Drag to change position"
                                >
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                {cat.thumbnail || cat.banner ? (
                                  <img
                                    src={cat.thumbnail || cat.banner}
                                    alt={cat.name}
                                    className="w-12 h-7 object-cover rounded border border-gray-200 shadow-2xs"
                                    title={cat.thumbnail ? "Thumbnail Image" : "Banner Image"}
                                  />
                                ) : (
                                  <div className="w-12 h-7 rounded border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300">
                                    <ImageIcon className="w-3.5 h-3.5" />
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-gray-900">{cat.name}</div>
                                {cat.name_en && (
                                  <span className="text-[10px] text-gray-400 font-normal block">{cat.name_en}</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                {cat.parent ? (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold w-fit">
                                      Sub-category
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                      under <strong className="text-gray-700">{categoryMap.get(cat.parent)?.name || `#${cat.parent}`}</strong>
                                    </span>
                                  </div>
                                ) : (
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[10px] font-bold">
                                    Primary Section
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-gray-600 font-mono text-[11px]">
                                /{cat.slug}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1 font-bold">
                                  {editingOrderCatId === cat.id ? (
                                    <input
                                      type="number"
                                      min={1}
                                      max={flatCategories.length}
                                      value={inputOrderVal}
                                      onChange={(e) => setInputOrderVal(e.target.value)}
                                      onBlur={() => handleCommitDirectOrder(cat, inputOrderVal)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCommitDirectOrder(cat, inputOrderVal);
                                        if (e.key === 'Escape') setEditingOrderCatId(null);
                                      }}
                                      autoFocus
                                      className="w-11 text-center text-xs py-0 px-1 border border-[#800020] rounded bg-white text-gray-900 font-bold focus:outline-none"
                                    />
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setEditingOrderCatId(cat.id);
                                        setInputOrderVal(String(cat.display_order || 1));
                                      }}
                                      className="hover:text-[#800020] hover:underline cursor-pointer"
                                      title="Click to type exact position"
                                    >
                                      <span>#{cat.display_order}</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleMoveCategoryStep(cat, 'up')}
                                    disabled={catIndex === 0}
                                    className={`p-0.5 rounded transition ${
                                      catIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-black cursor-pointer'
                                    }`}
                                    title="Move Up"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveCategoryStep(cat, 'down')}
                                    disabled={catIndex === filteredFlatCategories.length - 1}
                                    className={`p-0.5 rounded transition ${
                                      catIndex === filteredFlatCategories.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-black cursor-pointer'
                                    }`}
                                    title="Move Down"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <button
                                  onClick={() => handleToggleCategoryNav(cat)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans uppercase border transition cursor-pointer ${
                                    cat.is_nav_visible !== false
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-gray-100 text-gray-500 border-gray-200'
                                  }`}
                                >
                                  {cat.is_nav_visible !== false ? '✓ In Nav' : '✕ Hidden'}
                                </button>
                              </td>
                              <td className="py-2.5 px-3">
                                <button
                                  onClick={() => handleFilterArticlesByCategory(cat.slug)}
                                  className="px-2 py-0.5 bg-gray-100 hover:bg-[#800020] hover:text-white rounded text-[10px] text-gray-700 transition cursor-pointer"
                                >
                                  {cat.articles_count || 0}
                                </button>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => openAddSubcategoryModal(cat)}
                                    className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded transition cursor-pointer"
                                    title="Add child sub-category under this category"
                                  >
                                    <PlusCircle className="w-3.5 h-3.5" />
                                  </button>
                                  <Link
                                    to={`/category/${cat.slug}`}
                                    target="_blank"
                                    className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition"
                                    title="View on site"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                  <button
                                    onClick={() => openEditCategoryModal(cat)}
                                    className="p-1.5 bg-gray-100 hover:bg-[#800020] hover:text-white rounded transition text-gray-600 cursor-pointer"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(cat.slug, cat.name)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white rounded text-rose-600 transition cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: USERS & AUTHORS MANAGEMENT (SUPERADMIN FULL CONTROL)     */}
            {/* ------------------------------------------------------------- */}
            {currentPath === 'users' && user?.is_staff && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#1e2022] font-sans flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#800020]" />
                      <span>{lang === 'en' ? 'Author & User Management' : 'লেখক ও ব্যবহারকারী ব্যবস্থাপনা'}</span>
                    </h2>
                    <p className="text-xs text-gray-500 font-sans mt-0.5">
                      {lang === 'en'
                        ? 'Superadmins can create authors, customize pen names and bios, and assign editorial roles.'
                        : 'সুপার অ্যাডমিনরা নতুন লেখক তৈরি, পরিচিতি ও বায়ো সম্পাদন এবং রোল নিয়ন্ত্রণ করতে পারেন।'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={openNewAuthorModal}
                      className="px-3.5 py-1.5 bg-[#800020] hover:bg-[#9b1b30] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Create Author' : 'নতুন লেখক তৈরি করুন'}</span>
                    </button>
                    <button
                      onClick={openNewUserModal}
                      className="px-3 py-1.5 border border-[#ded7cc] hover:bg-gray-50 text-gray-700 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-gray-500" />
                      <span>{lang === 'en' ? 'Basic User' : 'সাধারণ ব্যবহারকারী'}</span>
                    </button>
                  </div>
                </div>

                {/* Search & Filter pills */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative max-w-sm w-full">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder={lang === 'en' ? 'Search by author, username, email, designation...' : 'নাম, ইউজারনেম, ইমেইল বা পদবি দিয়ে খুঁজুন...'}
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-sans">
                    <button
                      onClick={() => setUserRoleFilter('all')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                        userRoleFilter === 'all'
                          ? 'bg-[#800020] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {lang === 'en' ? 'All' : 'সকল'} ({usersList.length})
                    </button>
                    <button
                      onClick={() => setUserRoleFilter('authors')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                        userRoleFilter === 'authors'
                          ? 'bg-[#800020] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {lang === 'en' ? 'Authors' : 'লেখকবৃন্দ'} ({usersList.filter((u) => !u.is_staff && !u.is_superuser).length})
                    </button>
                    <button
                      onClick={() => setUserRoleFilter('staff')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                        userRoleFilter === 'staff'
                          ? 'bg-[#800020] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {lang === 'en' ? 'Staff Editors' : 'সম্পাদকীয় দল'} ({usersList.filter((u) => u.is_staff && !u.is_superuser).length})
                    </button>
                    <button
                      onClick={() => setUserRoleFilter('superadmins')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                        userRoleFilter === 'superadmins'
                          ? 'bg-[#800020] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {lang === 'en' ? 'Super Admins' : 'সুপার অ্যাডমিন'} ({usersList.filter((u) => u.is_superuser).length})
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#f7f2eb] border-b border-[#ded7cc] text-gray-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Author / User</th>
                        <th className="py-2.5 px-3">Pen Name / Display Name</th>
                        <th className="py-2.5 px-3">Designation</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Articles</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredUsers.map((u) => {
                        const avatar = u.profile?.effective_avatar || u.profile?.avatar;
                        const displayName = u.profile?.display_name || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : '');
                        const designation = u.profile?.designation || (u.is_superuser ? 'সুপার অ্যাডমিন' : u.is_staff ? 'সম্পাদকীয় কর্মী' : 'লেখক');

                        return (
                          <tr key={u.id} className="hover:bg-gray-50 transition">
                            <td className="py-2.5 px-3 font-semibold text-gray-900">
                              <div className="flex items-center gap-2">
                                {avatar ? (
                                  <img
                                    src={avatar}
                                    alt=""
                                    className="w-7 h-7 rounded-full object-cover border border-gray-200 flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-rose-50 text-[#800020] flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                                    {(displayName || u.username).charAt(0)}
                                  </div>
                                )}
                                <div className="leading-tight min-w-0">
                                  <div className="font-semibold text-gray-900 truncate">@{u.username}</div>
                                  <span className="text-[10px] text-gray-400 font-normal truncate block">{u.email || 'No email'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-gray-700">
                              <div className="font-medium text-gray-900">{displayName || '-'}</div>
                              {u.profile?.display_name_en && (
                                <span className="text-[10px] text-gray-400 block">{u.profile.display_name_en}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-gray-600">
                              <span className="text-xs">{designation}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <button
                                onClick={() => handleToggleUserRole(u.id)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition border cursor-pointer ${
                                  u.is_superuser
                                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                                    : u.is_staff
                                    ? 'bg-rose-50 text-[#800020] border-rose-200'
                                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-400'
                                }`}
                                title="Click to toggle staff privilege"
                              >
                                {u.is_superuser ? 'Super Admin' : u.is_staff ? 'Staff / Editor' : 'Author'}
                              </button>
                            </td>
                            <td className="py-2.5 px-3">
                              <button
                                onClick={() => handleToggleUserActive(u.id)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
                                  u.is_active !== false
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : 'bg-gray-200 text-gray-600 line-through'
                                }`}
                                title="Click to toggle active/inactive"
                              >
                                {u.is_active !== false ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-gray-600">
                              <span className="font-semibold">{u.articles_count || 0}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  to={`/author/${u.username}`}
                                  target="_blank"
                                  className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition"
                                  title="View Public Author Page"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  onClick={() => openEditAuthorModal(u)}
                                  className="p-1.5 bg-gray-100 hover:bg-[#800020] hover:text-white rounded text-gray-600 transition cursor-pointer"
                                  title="Edit Author Profile & Bio"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                {u.id !== user?.id && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.username)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white rounded transition text-rose-600 cursor-pointer"
                                    title="Delete user"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: COMMENTS MODERATION                                      */}
            {/* ------------------------------------------------------------- */}
            {currentPath === 'comments' && user?.is_staff && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-lg font-bold text-[#1e2022] font-sans">
                    {lang === 'en' ? 'Reader Comments Moderation' : 'মন্তব্য নিয়ন্ত্রণ ও মডারেশন'}
                  </h2>
                  <p className="text-xs text-gray-500 font-sans">
                    Approve reader reviews or delete spam comments across all published articles.
                  </p>
                </div>

                <div className="relative max-w-sm">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search comment text, author, or article..."
                    value={commentSearch}
                    onChange={(e) => setCommentSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                  />
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#f7f2eb] border-b border-[#ded7cc] text-gray-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Article</th>
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3">Comment Text</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredComments.map((com) => (
                        <tr key={com.id} className="hover:bg-gray-50 transition">
                          <td className="py-2 px-3 max-w-[140px] truncate">
                            <span className="font-semibold text-gray-800">{com.article_title || 'Article'}</span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-gray-900">{com.user_name}</td>
                          <td className="py-2 px-3 max-w-xs text-gray-700 font-serif">
                            "{com.content}"
                          </td>
                          <td className="py-2 px-3">
                            <button
                              onClick={() => handleToggleCommentApproval(com.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                com.is_approved !== false
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              {com.is_approved !== false ? 'Approved' : 'Pending'}
                            </button>
                          </td>
                          <td className="py-2 px-3 text-gray-400 text-[11px]">
                            {new Date(com.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => handleDeleteComment(com.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white rounded transition text-rose-600"
                              title="Delete comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: CONTACT INQUIRIES                                        */}
            {/* ------------------------------------------------------------- */}
            {currentPath === 'inquiries' && user?.is_staff && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-lg font-bold text-[#1e2022] font-sans">
                    {lang === 'en' ? 'Contact Inquiries & Submissions Inbox' : 'পাঠক অনুসন্ধান ও যোগাযোগ ইনবক্স'}
                  </h2>
                  <p className="text-xs text-gray-500 font-sans">
                    Inquiries submitted through the Contact & Editorial Desk form.
                  </p>
                </div>

                <div className="relative max-w-sm">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by sender, email, subject..."
                    value={inquirySearch}
                    onChange={(e) => setInquirySearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                  />
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#f7f2eb] border-b border-[#ded7cc] text-gray-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Sender</th>
                        <th className="py-2.5 px-3">Subject & Message</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredInquiries.map((inq) => (
                        <tr key={inq.id} className="hover:bg-gray-50 transition">
                          <td className="py-2 px-3 font-semibold text-gray-900">
                            <div>{inq.name}</div>
                            <span className="text-[10px] text-gray-400 font-normal">{inq.email}</span>
                          </td>
                          <td
                            className="py-2 px-3 max-w-xs cursor-pointer hover:text-[#800020]"
                            onClick={() => setViewingInquiry(inq)}
                          >
                            <strong className="block text-gray-800 text-xs font-medium">{inq.subject}</strong>
                            <p className="text-gray-500 line-clamp-1 text-[11px]">{inq.message}</p>
                          </td>
                          <td className="py-2 px-3 text-gray-600">{inq.phone || '-'}</td>
                          <td className="py-2 px-3">
                            <select
                              value={inq.status}
                              onChange={(e) => handleSetInquiryStatus(inq.id, e.target.value as any)}
                              className="px-2 py-1 rounded text-[10px] font-bold border focus:outline-none bg-white"
                            >
                              <option value="new">New</option>
                              <option value="in_review">In Review</option>
                              <option value="replied">Replied</option>
                              <option value="archived">Archived</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-gray-400 text-[11px]">
                            {new Date(inq.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewingInquiry(inq)}
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition"
                                title="View Message"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteInquiry(inq.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white rounded transition text-rose-600"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: SUBSCRIBERS                                              */}
            {/* ------------------------------------------------------------- */}
            {currentPath === 'subscribers' && user?.is_staff && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-lg font-bold text-[#1e2022] font-sans">
                    {lang === 'en' ? 'Newsletter Subscribers List' : 'নিউজলেটার গ্রাহক তালিকা'}
                  </h2>
                  <p className="text-xs text-gray-500 font-sans">
                    Manage reader email subscriptions and marketing outreach.
                  </p>
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#f7f2eb] border-b border-[#ded7cc] text-gray-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Subscriber Email</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Subscribed Date</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {subscribersList.map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-50 transition">
                          <td className="py-2.5 px-3 font-semibold text-gray-900">{sub.email}</td>
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => handleToggleSubscriber(sub.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                sub.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-500 line-through'
                              }`}
                            >
                              {sub.is_active ? 'Active' : 'Unsubscribed'}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-gray-400 text-[11px]">
                            {new Date(sub.subscribed_at).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleDeleteSubscriber(sub.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white rounded transition text-rose-600"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: HOMEPAGE CUSTOMIZATION                                   */}
            {/* ------------------------------------------------------------- */}
            {currentPath === 'customization' && user?.is_staff && customization && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#1e2022] font-sans">
                      {t('dash.customization')}
                    </h2>
                    <p className="text-xs text-gray-500 font-sans">
                      Control ticker news, homepage sections, visibility toggles and curation.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveCustomization}
                    disabled={savingCustomization}
                    className="px-4 py-2 bg-[#800020] hover:bg-[#9b1b30] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                  >
                    {savingCustomization ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{lang === 'en' ? 'Save Changes' : 'পরিবর্তন সংরক্ষণ করুন'}</span>
                  </button>
                </div>

                {customSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2 font-sans">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{customSuccessMsg}</span>
                  </div>
                )}

                {/* Section Visibility Switches */}
                <div className="p-4 bg-[#faf7f2] border border-[#ded7cc] rounded-sm space-y-3">
                  <h4 className="font-bold text-xs uppercase font-sans text-gray-700 tracking-wider">
                    {lang === 'en' ? 'Section Visibility Toggles' : 'সেকশন দৃশ্যমানতা টগল'}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-sans">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customization.show_hero}
                        onChange={(e) => setCustomization({ ...customization, show_hero: e.target.checked })}
                        className="rounded text-[#800020] focus:ring-[#800020]"
                      />
                      <span>Hero Slider</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customization.show_lead}
                        onChange={(e) => setCustomization({ ...customization, show_lead: e.target.checked })}
                        className="rounded text-[#800020] focus:ring-[#800020]"
                      />
                      <span>Lead Story Section</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customization.show_art_culture}
                        onChange={(e) => setCustomization({ ...customization, show_art_culture: e.target.checked })}
                        className="rounded text-[#800020] focus:ring-[#800020]"
                      />
                      <span>Art & Culture Section</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customization.show_category_blocks}
                        onChange={(e) => setCustomization({ ...customization, show_category_blocks: e.target.checked })}
                        className="rounded text-[#800020] focus:ring-[#800020]"
                      />
                      <span>Category Grid Blocks</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customization.show_sidebar}
                        onChange={(e) => setCustomization({ ...customization, show_sidebar: e.target.checked })}
                        className="rounded text-[#800020] focus:ring-[#800020]"
                      />
                      <span>Sidebar (Popular & Socials)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customization.show_videos ?? true}
                        onChange={(e) => setCustomization({ ...customization, show_videos: e.target.checked })}
                        className="rounded text-[#800020] focus:ring-[#800020]"
                      />
                      <span>Video Stories Section</span>
                    </label>
                  </div>
                </div>

                {/* Category Grid Blocks Selection (Main or Child Categories) */}
                <div className="p-4 bg-[#faf7f2] border border-[#ded7cc] rounded-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ded7cc] pb-3">
                    <div>
                      <h4 className="font-bold text-xs uppercase font-sans text-gray-700 tracking-wider">
                        {lang === 'en' ? 'Magazine Category Grid Blocks' : 'ম্যাগাজিন ক্যাটাগরি গ্রিড সেকশন'}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-sans mt-0.5">
                        {lang === 'en'
                          ? 'Select which categories appear as blocks in the 2-column magazine grid. You can pick any main category or subcategory.'
                          : 'হোমপেজের ২-কলাম ম্যাগাজিন গ্রিডে কোন কোন ক্যাটাগরি সেকশন হিসেবে দেখাবে তা নির্বাচন করুন (মূল ক্যাটাগরি বা সাব-ক্যাটাগরি যেকোনোটি হতে পারে)।'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#800020] bg-[#800020]/10 px-2.5 py-1 rounded">
                        {(customization.category_blocks || []).length} {lang === 'en' ? 'selected' : 'টি নির্বাচিত'}
                      </span>
                      {(customization.category_blocks || []).length > 0 && (
                        <button
                          type="button"
                          onClick={() => setCustomization({ ...customization, category_blocks: [], category_block_details: [] })}
                          className="text-[10px] text-red-600 hover:text-red-800 font-semibold underline cursor-pointer"
                        >
                          {lang === 'en' ? 'Clear All' : 'সব মুছুন'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Selected Categories Order Bar */}
                  {(customization.category_block_details || []).length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-gray-500 uppercase font-sans">
                        {lang === 'en' ? 'Selected Order in Grid:' : 'গ্রিডে প্রদর্শনের ক্রম:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5 p-2.5 bg-white border border-[#ded7cc] rounded-sm min-h-[38px] items-center">
                        {(customization.category_block_details || []).map((cat, idx) => (
                          <span
                            key={cat.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-[#800020] text-white font-sans shadow-xs"
                          >
                            <span className="text-[10px] opacity-75 font-mono">#{idx + 1}</span>
                            <span>{lang === 'en' && cat.name_en ? cat.name_en : cat.name}</span>
                            <span className="text-[9px] opacity-75">
                              {cat.parent ? `(${lang === 'en' ? 'Sub' : 'সাব'})` : `(${lang === 'en' ? 'Main' : 'মূল'})`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleCategoryBlock(cat.id)}
                              className="hover:text-red-200 transition font-bold text-sm ml-0.5 cursor-pointer"
                              title={lang === 'en' ? 'Remove' : 'বাদ দিন'}
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search and Category Selection List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-gray-700 font-sans">
                        {lang === 'en' ? 'Available Categories (Click to toggle):' : 'উপলব্ধ ক্যাটাগরিসমূহ (টগল করতে ক্লিক করুন):'}
                      </span>
                      <input
                        type="text"
                        placeholder={lang === 'en' ? 'Search categories...' : 'ক্যাটাগরি খুঁজুন...'}
                        value={catBlockSearch}
                        onChange={(e) => setCatBlockSearch(e.target.value)}
                        className="px-2.5 py-1 text-xs border border-[#ded7cc] rounded bg-white w-48 focus:outline-none focus:border-[#800020]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 bg-white border border-[#ded7cc] rounded-sm">
                      {flatCategories
                        .filter((cat) => {
                          if (!catBlockSearch) return true;
                          const q = catBlockSearch.toLowerCase();
                          return (
                            cat.name.toLowerCase().includes(q) ||
                            (cat.name_en && cat.name_en.toLowerCase().includes(q)) ||
                            cat.slug.toLowerCase().includes(q)
                          );
                        })
                        .map((cat) => {
                          const isSelected = (customization.category_blocks || []).includes(cat.id);
                          const isMain = !cat.parent;
                          const parentCat = cat.parent ? flatCategories.find((p) => p.id === cat.parent) : null;

                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleToggleCategoryBlock(cat.id)}
                              className={`flex items-start gap-2 p-2 rounded text-left transition border cursor-pointer ${
                                isSelected
                                  ? 'bg-[#800020]/5 border-[#800020] text-[#800020]'
                                  : 'bg-gray-50/50 border-gray-200 hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="mt-0.5 rounded text-[#800020] focus:ring-[#800020] pointer-events-none"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-xs truncate">
                                    {lang === 'en' && cat.name_en ? cat.name_en : cat.name}
                                  </span>
                                  {isMain ? (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-sans font-medium flex-shrink-0">
                                      {lang === 'en' ? 'Main' : 'মূল'}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-sans font-medium flex-shrink-0">
                                      {lang === 'en' ? 'Sub' : 'সাব'}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-400 font-mono block truncate">
                                  {parentCat ? `${parentCat.slug} > ` : ''}/{cat.slug}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Ticker Headlines */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      টিকার হেডলাইন (বাংলা)
                    </label>
                    <textarea
                      rows={2}
                      value={customization.ticker_text_bn}
                      onChange={(e) => setCustomization({ ...customization, ticker_text_bn: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 font-sans">
                      Ticker Headlines (English)
                    </label>
                    <textarea
                      rows={2}
                      value={customization.ticker_text_en}
                      onChange={(e) => setCustomization({ ...customization, ticker_text_en: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                    />
                  </div>
                </div>

                {/* Section Titles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Trending Section Title (BN)</label>
                    <input
                      type="text"
                      value={customization.colti_title_bn}
                      onChange={(e) => setCustomization({ ...customization, colti_title_bn: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Trending Section Title (EN)</label>
                    <input
                      type="text"
                      value={customization.colti_title_en}
                      onChange={(e) => setCustomization({ ...customization, colti_title_en: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Editor's Choice Title (BN)</label>
                    <input
                      type="text"
                      value={customization.nirbachito_title_bn}
                      onChange={(e) => setCustomization({ ...customization, nirbachito_title_bn: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Editor's Choice Title (EN)</label>
                    <input
                      type="text"
                      value={customization.nirbachito_title_en}
                      onChange={(e) => setCustomization({ ...customization, nirbachito_title_en: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Video Stories Title (BN)</label>
                    <input
                      type="text"
                      value={customization.videos_title_bn || ''}
                      onChange={(e) => setCustomization({ ...customization, videos_title_bn: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Video Stories Title (EN)</label>
                    <input
                      type="text"
                      value={customization.videos_title_en || ''}
                      onChange={(e) => setCustomization({ ...customization, videos_title_en: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Video Stories Subtitle (BN)</label>
                    <input
                      type="text"
                      value={customization.videos_subtitle_bn || ''}
                      onChange={(e) => setCustomization({ ...customization, videos_subtitle_bn: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Video Stories Subtitle (EN)</label>
                    <input
                      type="text"
                      value={customization.videos_subtitle_en || ''}
                      onChange={(e) => setCustomization({ ...customization, videos_subtitle_en: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: SITE SETTINGS (BRANDING, SOCIAL, CONTACT INFO)            */}
            {/* ------------------------------------------------------------- */}
            {currentPath === 'settings' && user?.is_staff && siteSettings && (
              <form onSubmit={handleSaveSiteSettings} className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#1e2022] font-sans">
                      {lang === 'en' ? 'Website Configuration & Branding' : 'ওয়েবসাইট কনফিগারেশন ও ব্র্যান্ডিং'}
                    </h2>
                    <p className="text-xs text-gray-500 font-sans">
                      Control site branding, logos, social media links, and footer coordinates.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-4 py-2 bg-[#800020] hover:bg-[#9b1b30] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                  >
                    {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{lang === 'en' ? 'Save Settings' : 'সেটিংস সংরক্ষণ করুন'}</span>
                  </button>
                </div>

                {settingsSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2 font-sans">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{settingsSuccessMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Site Name</label>
                    <input
                      type="text"
                      value={siteSettings.site_name}
                      onChange={(e) => setSiteSettings({ ...siteSettings, site_name: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={siteSettings.email}
                      onChange={(e) => setSiteSettings({ ...siteSettings, email: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Tagline (Bengali)</label>
                    <input
                      type="text"
                      value={siteSettings.tagline_bn}
                      onChange={(e) => setSiteSettings({ ...siteSettings, tagline_bn: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Tagline (English)</label>
                    <input
                      type="text"
                      value={siteSettings.tagline_en}
                      onChange={(e) => setSiteSettings({ ...siteSettings, tagline_en: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Helpline Phone</label>
                    <input
                      type="text"
                      value={siteSettings.phone}
                      onChange={(e) => setSiteSettings({ ...siteSettings, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Office Address</label>
                    <input
                      type="text"
                      value={siteSettings.address}
                      onChange={(e) => setSiteSettings({ ...siteSettings, address: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>

                  <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                    <ImageUpload
                      value={siteSettings.logo_bn_url || ''}
                      onChange={(url) => setSiteSettings({ ...siteSettings, logo_bn_url: url })}
                      label={lang === 'en' ? 'Bengali Header Logo (R2)' : 'বাংলা হেডার লোগো (ক্লাউডফ্লেয়ার R2)'}
                      helperText={lang === 'en' ? 'Upload header logo in Bengali' : 'হেডার ফ্লিপারের জন্য বাংলা লোগো'}
                      aspectRatio="auto"
                    />
                    <ImageUpload
                      value={siteSettings.logo_en_url || ''}
                      onChange={(url) => setSiteSettings({ ...siteSettings, logo_en_url: url })}
                      label={lang === 'en' ? 'English Header Logo (R2)' : 'ইংরেজি হেডার লোগো (ক্লাউডফ্লেয়ার R2)'}
                      helperText={lang === 'en' ? 'Upload header logo in English' : 'হেডার ফ্লিপারের জন্য ইংরেজি লোগো'}
                      aspectRatio="auto"
                    />
                    <ImageUpload
                      value={siteSettings.footer_logo_url || ''}
                      onChange={(url) => setSiteSettings({ ...siteSettings, footer_logo_url: url })}
                      label={lang === 'en' ? 'Footer Logo (Cloudflare R2)' : 'ফুটার লোগো (ক্লাউডফ্লেয়ার R2)'}
                      helperText={lang === 'en' ? 'Upload dedicated logo for footer' : 'ওয়েবসাইট ফুটারের জন্য আলাদা লোগো'}
                      aspectRatio="auto"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Facebook URL</label>
                    <input
                      type="text"
                      value={siteSettings.facebook_url}
                      onChange={(e) => setSiteSettings({ ...siteSettings, facebook_url: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Instagram URL</label>
                    <input
                      type="text"
                      value={siteSettings.instagram_url}
                      onChange={(e) => setSiteSettings({ ...siteSettings, instagram_url: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Twitter / X URL</label>
                    <input
                      type="text"
                      value={siteSettings.twitter_url}
                      onChange={(e) => setSiteSettings({ ...siteSettings, twitter_url: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">YouTube URL</label>
                    <input
                      type="text"
                      value={siteSettings.youtube_url}
                      onChange={(e) => setSiteSettings({ ...siteSettings, youtube_url: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                </div>
              </form>
            )}
          </main>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT ARTICLE                                           */}
      {/* ------------------------------------------------------------- */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-md shadow-2xl border border-[#ded7cc] w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900 font-sans">
                Edit Article: {editingArticle.title}
              </h3>
              <button
                onClick={() => setEditingArticle(null)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Title (Bengali) <span className="text-[#800020]">*</span>
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={`w-full px-3 py-2 border rounded focus:outline-none transition-colors ${
                    editFormAttempted && !editTitle.trim() && !editTitleEn.trim()
                      ? 'border-rose-500 bg-rose-50/20 ring-1 ring-rose-500'
                      : 'border-[#ded7cc] focus:border-[#800020]'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Title (English)</label>
                <input
                  type="text"
                  value={editTitleEn}
                  onChange={(e) => setEditTitleEn(e.target.value)}
                  className={`w-full px-3 py-2 border rounded focus:outline-none transition-colors ${
                    editFormAttempted && !editTitle.trim() && !editTitleEn.trim()
                      ? 'border-rose-500 bg-rose-50/20 ring-1 ring-rose-500'
                      : 'border-[#ded7cc] focus:border-[#800020]'
                  }`}
                />
                {editFormAttempted && !editTitle.trim() && !editTitleEn.trim() && (
                  <p className="text-rose-600 text-[11px] font-bengali mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>অনুগ্রহ করে একটি শিরোনাম প্রদান করুন (বাংলা অথবা ইংরেজিতে)।</span>
                  </p>
                )}
              </div>

              {/* Author Reassignment (Superadmins & Staff) */}
              {user?.is_staff && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-gray-700">
                      {lang === 'en' ? 'Article Author' : 'প্রবন্ধের লেখক (Article Author)'}
                    </label>
                    <button
                      type="button"
                      onClick={() => openNewAuthorModal()}
                      className="text-[11px] text-[#800020] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>{lang === 'en' ? '+ Create Author' : '+ নতুন লেখক'}</span>
                    </button>
                  </div>
                  <select
                    value={editAuthorDesk ? 'desk' : (editAuthorId || '')}
                    onChange={(e) => {
                      if (e.target.value === 'desk') {
                        setEditAuthorDesk(true);
                        setEditAuthorId(null);
                      } else {
                        setEditAuthorDesk(false);
                        setEditAuthorId(Number(e.target.value));
                      }
                    }}
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] bg-white font-sans text-xs"
                  >
                    <option value="desk">🏢 The Mad Story Desk / সম্পাদনা পরিষদ</option>
                    {usersList.map((u) => {
                      const displayName = u.profile?.display_name || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username);
                      const roleBadge = u.profile?.designation || (u.is_superuser ? 'Super Admin' : u.is_staff ? 'Staff' : 'Author');
                      return (
                        <option key={u.id} value={u.id}>
                          {displayName} (@{u.username}) • {roleBadge}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] bg-white"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Editorial Badges */}
              {user?.is_staff && (
                <div className="p-3 bg-[#faf7f2] border border-[#ded7cc] rounded-sm space-y-2">
                  <label className="block font-bold text-gray-700">
                    {lang === 'en' ? 'Editorial Badges & Sections' : 'সম্পাদকীয় ব্যাজ ও সেকশন'}
                  </label>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editIsFeaturedHero}
                        onChange={(e) => setEditIsFeaturedHero(e.target.checked)}
                        className="w-4 h-4 text-[#800020] rounded border-gray-300 focus:ring-[#800020]"
                      />
                      <span className="font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        বিশেষ ফিচার (Special Featured)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editIsColtiTrending}
                        onChange={(e) => setEditIsColtiTrending(e.target.checked)}
                        className="w-4 h-4 text-[#800020] rounded border-gray-300 focus:ring-[#800020]"
                      />
                      <span className="font-semibold text-rose-900 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        চলতি (Trending)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editIsNirbachitoChoice}
                        onChange={(e) => setEditIsNirbachitoChoice(e.target.checked)}
                        className="w-4 h-4 text-[#800020] rounded border-gray-300 focus:ring-[#800020]"
                      />
                      <span className="font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        নির্বাচিত (Choice)
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-gray-700">
                    {lang === 'en' ? 'Categories & Subcategories' : 'ক্যাটাগরি ও সাব-ক্যাটাগরি (Many-to-Many)'}
                  </label>
                  <span className="text-[11px] font-medium text-gray-500">
                    {editCatIds.length > 0 ? (
                      <span className="text-[#800020] font-semibold">
                        {editCatIds.length} {lang === 'en' ? 'selected' : 'টি নির্বাচিত'}
                      </span>
                    ) : (
                      <span>{lang === 'en' ? 'None selected' : 'কোনোটি নির্বাচন করা হয়নি'}</span>
                    )}
                  </span>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 space-y-2">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={catSearchEdit}
                      onChange={(e) => setCatSearchEdit(e.target.value)}
                      placeholder={lang === 'en' ? 'Search categories...' : 'ক্যাটাগরি খুঁজুন...'}
                      className="w-full pl-7 pr-6 py-1 text-xs bg-white border border-gray-200 rounded focus:outline-none focus:border-[#800020]"
                    />
                    {catSearchEdit && (
                      <button
                        type="button"
                        onClick={() => setCatSearchEdit('')}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Selected badges */}
                  {editCatIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 p-1.5 bg-white rounded border border-gray-200">
                      {editCatIds.map(id => {
                        const cat = categoryMap.get(id);
                        if (!cat) return null;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#800020]/10 text-[#800020] border border-[#800020]/20"
                          >
                            <span>{cat.name}</span>
                            <button
                              type="button"
                              onClick={() => setEditCatIds(prev => prev.filter(x => x !== id))}
                              className="hover:text-red-700 p-0.5 rounded-full hover:bg-rose-100"
                              title="Remove"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Hierarchical category picker list with infinite levels */}
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-gray-200">
                    {categoryTree
                      .filter((cat) => {
                        if (!catSearchEdit.trim()) return true;
                        return categoryMatchesSearch(cat, catSearchEdit.toLowerCase().trim());
                      })
                      .map((cat) => (
                        <ArticleCategoryTreeNode
                          key={cat.id}
                          category={cat}
                          depth={0}
                          selectedIds={editCatIds}
                          onToggle={(id) => {
                            setEditCatIds((prev) =>
                              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                            );
                          }}
                          searchQuery={catSearchEdit}
                          lang={lang}
                        />
                      ))}
                  </div>
                </div>
              </div>

              <div>
                <ImageUpload
                  value={editCoverUrl}
                  onChange={setEditCoverUrl}
                  label={lang === 'en' ? 'Article Cover Image (Cloudflare R2)' : 'প্রবন্ধের কভার ছবি (ক্লাউডফ্লেয়ার R2)'}
                  helperText={lang === 'en' ? 'Upload new cover image directly to Cloudflare R2' : 'ক্লাউডফ্লেয়ার R2 তে নতুন কভার ছবি আপলোড করুন'}
                  aspectRatio="4/3"
                  optimalDimensions={lang === 'en' ? '1200 × 900 px (4:3)' : '১২০০ × ৯০০ px (৪:৩)'}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  {lang === 'en' ? 'Excerpt (Bengali)' : 'সারাংশ / ভূমিকা (বাংলা)'}
                </label>
                <textarea
                  rows={2}
                  value={editExcerpt}
                  onChange={(e) => setEditExcerpt(e.target.value)}
                  className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 font-sans">
                  {lang === 'en' ? 'Excerpt (English - Optional)' : 'সারাংশ / ভূমিকা (ইংরেজি - ঐচ্ছিক)'}
                </label>
                <textarea
                  rows={2}
                  value={editExcerptEn}
                  onChange={(e) => setEditExcerptEn(e.target.value)}
                  className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                />
              </div>

              {loadingEditContent ? (
                <div className="py-12 border border-[#ded7cc] rounded bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin text-[#800020]" />
                  <span className="text-xs font-sans">
                    {lang === 'en' ? 'Loading article content...' : 'প্রবন্ধের মূল কন্টেন্ট লোড করা হচ্ছে...'}
                  </span>
                </div>
              ) : (
                <>
                  {editContentLoadError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {editContentLoadError}
                      </span>
                      <button
                        type="button"
                        onClick={() => editingArticle && openEditArticleModal(editingArticle)}
                        className="px-2.5 py-1 bg-[#800020] text-white rounded font-medium text-[11px] hover:bg-[#9b1b30] flex items-center gap-1 transition"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>{lang === 'en' ? 'Retry' : 'পুনরায় চেষ্টা করুন'}</span>
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      {lang === 'en' ? 'Content Body (Bengali)' : 'মূল প্রবন্ধ / কন্টেন্ট (বাংলা)'} <span className="text-[#800020]">*</span>
                      <span className="text-[10px] text-gray-400 font-normal ml-1">
                        {lang === 'en' ? '(or English content below)' : '(অথবা নিচের ইংরেজিতে লিখুন)'}
                      </span>
                    </label>
                    <RichTextEditor
                      value={editContent}
                      onChange={setEditContent}
                      error={editFormAttempted && !isHtmlContentPresent(editContent) && !isHtmlContentPresent(editContentEn)}
                      errorMessage={
                        lang === 'en'
                          ? 'Please enter content body for the article (in Bengali or English).'
                          : 'অনুগ্রহ করে প্রবন্ধের মূল বক্তব্য বা কন্টেন্ট লিখুন (বাংলা অথবা ইংরেজিতে)।'
                      }
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1 font-sans">
                      {lang === 'en' ? 'Content Body (English Translation - Optional)' : 'মূল প্রবন্ধ / কন্টেন্ট (ইংরেজি অনুবাদ - ঐচ্ছিক)'}
                    </label>
                    <RichTextEditor
                      value={editContentEn}
                      onChange={setEditContentEn}
                      placeholder="Write full article in English..."
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingEditArticle}
                  onClick={handleSaveEditArticle}
                  className="px-4 py-2 bg-[#800020] hover:bg-[#9b1b30] text-white rounded font-semibold flex items-center gap-1.5 transition"
                >
                  {savingEditArticle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Article</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE / EDIT CATEGORY (ENHANCED LIVE PREVIEW)         */}
      {/* ------------------------------------------------------------- */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveCategory}
            className="bg-white rounded-md shadow-2xl border border-[#ded7cc] w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-[#800020]" />
                <h3 className="font-bold text-base text-gray-900 font-sans">
                  {editingCategory
                    ? `Edit Category: ${editingCategory.name}`
                    : catParent && categoryMap.has(catParent)
                    ? `Add Sub-category under "${categoryMap.get(catParent)?.name}"`
                    : 'New Primary Category'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              {catParent && categoryMap.has(catParent) && (
                <div className="p-2.5 bg-[#faf7f2] border border-[#ded7cc] rounded text-xs text-gray-700 flex items-center gap-1.5 font-sans">
                  <FolderTree className="w-3.5 h-3.5 text-[#800020] shrink-0" />
                  <span className="text-gray-500">Creating child sub-category under:</span>
                  <strong className="text-[#800020]">{categoryMap.get(catParent)?.name}</strong>
                  {categoryMap.get(catParent)?.name_en && (
                    <span className="text-gray-400">({categoryMap.get(catParent)?.name_en})</span>
                  )}
                </div>
              )}

              {/* Dual Language Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    ক্যাটাগরির নাম (বাংলা) <span className="text-[#800020]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => {
                      setCatName(e.target.value);
                      if (!editingCategory && !catSlug && !catNameEn) {
                        setCatSlug(autoSlugify(e.target.value));
                      }
                    }}
                    placeholder="যেমন: সমকালীন শিল্প ও ভাস্কর্য..."
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Category Name (English Translation)
                  </label>
                  <input
                    type="text"
                    value={catNameEn}
                    onChange={(e) => {
                      setCatNameEn(e.target.value);
                      if (!editingCategory && (!catSlug || catSlug === autoSlugify(catName))) {
                        setCatSlug(autoSlugify(e.target.value));
                      }
                    }}
                    placeholder="e.g. Contemporary Sculpture & Visual Arts"
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              {/* URL Slug & Parent Hierarchy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-gray-700">URL Route Slug</label>
                    <button
                      type="button"
                      onClick={() => setCatSlug(autoSlugify(catNameEn || catName))}
                      className="text-[10px] text-[#800020] hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Auto-generate
                    </button>
                  </div>
                  <div className="flex items-center">
                    <span className="px-2 py-2 bg-gray-100 border border-r-0 border-[#ded7cc] rounded-l text-gray-500 font-mono text-[11px]">
                      /category/
                    </span>
                    <input
                      type="text"
                      value={catSlug}
                      onChange={(e) => setCatSlug(autoSlugify(e.target.value))}
                      placeholder="sculpture-arts"
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded-r focus:outline-none focus:border-[#800020] font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Parent Category (মূল বিভাগ)
                  </label>
                  <select
                    value={catParent === null ? '' : catParent}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setCatParent(val);
                      const siblings = flatCategories.filter(c => (c.parent || null) === val);
                      setCatOrder(siblings.length + 1);
                    }}
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] bg-white font-sans text-xs"
                  >
                    <option value="">None (Top-Level Primary Section / শীর্ষ স্তর)</option>
                    {parentCategoryOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {'\u00A0\u00A0'.repeat(opt.depth)}
                        {opt.depth > 0 ? '└─ ' : ''}
                        {opt.name} {opt.name_en ? `(${opt.name_en})` : ''} [Level {opt.depth + 1}]
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Select &quot;None&quot; for a root category, or select any existing category to nest under it (infinite levels supported).
                  </p>
                </div>
              </div>

              {/* Dual Language Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    বিবরণ (বাংলা)
                  </label>
                  <textarea
                    rows={2}
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="বিভাগের সংক্ষিপ্ত পরিচয় যা ক্যাটাগরি আর্কাইভে প্রদর্শিত হবে..."
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Description (English)
                  </label>
                  <textarea
                    rows={2}
                    value={catDescEn}
                    onChange={(e) => setCatDescEn(e.target.value)}
                    placeholder="Brief description for category archive page..."
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              {/* Category Thumbnail Image (Cards, Homepage, and Grids) */}
              <div>
                <ImageUpload
                  value={catThumbnail}
                  onChange={setCatThumbnail}
                  label={lang === 'en' ? 'Category Card Thumbnail (Homepage & Grids)' : 'ক্যাটাগরি কার্ড থাম্বনেইল (প্রচ্ছদ ও গ্রিড)'}
                  helperText={
                    lang === 'en'
                      ? 'Upload image for category cards on homepage featured categories, category listing grid, and tiles (recommended ratio: 16:9 or 4:3).'
                      : 'হোমপেজ ফিচার্ড ক্যাটাগরি, ক্যাটাগরি তালিকা গ্রিড ও কার্ডের জন্য ছবি (অনুপাত: ১৬:৯ বা ৪:৩)।'
                  }
                  aspectRatio="video"
                />
              </div>

              {/* Category Detail Page Banner */}
              <div>
                <ImageUpload
                  value={catBanner}
                  onChange={setCatBanner}
                  label={lang === 'en' ? 'Category Page Header Banner (Detail Page Hero)' : 'ক্যাটাগরি পেজ হেডার ব্যানার (বিস্তারিত পাতার হিরো)'}
                  helperText={
                    lang === 'en'
                      ? 'Upload high-resolution header banner image for this category detail page (recommended ratio: 16:6 or 21:9).'
                      : 'ক্যাটাগরি বিস্তারিত পেজের শীর্ষে প্রদর্শিত বিশেষ ব্যানার চিত্র (অনুপাত: ১৬:৬ বা ২১:৯)। ফাঁকা রাখলে সাধারণ ব্যাকগ্রাউন্ড ব্যবহৃত হবে।'
                  }
                  aspectRatio="banner"
                />
              </div>

              {/* Order & Navigation Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-[#faf7f2] p-3 rounded border border-[#ded7cc]">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Display Order Index
                  </label>
                  <input
                    type="number"
                    value={catOrder}
                    onChange={(e) => setCatOrder(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] bg-white font-bold"
                  />
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    Lower numbers appear first on the menu
                  </span>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catNavVisible}
                      onChange={(e) => setCatNavVisible(e.target.checked)}
                      className="rounded text-[#800020] focus:ring-[#800020] w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-gray-800 block text-xs">
                        Show on Navigation Bar
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {catNavVisible ? 'Visible on top menu & mobile drawer' : 'Accessible via URL only'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Live Magazine Header & Card Preview Box */}
              <div className="p-3.5 bg-white border border-[#ded7cc] rounded space-y-3">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-gray-400 block">
                  Live Visual Previews (Card Thumbnail & Header Banner)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. Thumbnail Card Preview */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 font-semibold block">Homepage Card Preview:</span>
                    <div className="relative overflow-hidden rounded-md border border-[#ded7cc] h-28 bg-neutral-900 flex items-center justify-center p-3 text-white">
                      {(catThumbnail || catBanner) ? (
                        <img
                          src={catThumbnail || catBanner}
                          alt="Thumbnail Preview"
                          className="absolute inset-0 w-full h-full object-cover opacity-80"
                        />
                      ) : (
                        <div className="text-[10px] text-gray-400 italic z-10">No thumbnail uploaded</div>
                      )}
                      <div className="relative z-10 bg-white/80 backdrop-blur-xs px-3 py-1 rounded text-black font-bold text-xs shadow-xs text-center">
                        {catName || 'ক্যাটাগরি নাম'}
                      </div>
                    </div>
                  </div>

                  {/* 2. Header Banner Preview */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 font-semibold block">Category Page Banner:</span>
                    <div className="relative overflow-hidden rounded border border-[#ded7cc] h-28 bg-gray-900 flex flex-col justify-end p-2.5 text-white">
                      {catBanner ? (
                        <img
                          src={catBanner}
                          alt="Banner Preview"
                          className="absolute inset-0 w-full h-full object-cover opacity-60"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-400 italic">
                          No header banner uploaded
                        </div>
                      )}
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <div className="font-bold font-serif text-xs text-white drop-shadow">
                            {catName || 'ক্যাটাগরি নাম'}
                          </div>
                          {catNameEn && (
                            <div className="text-[9px] text-white/80">EN: {catNameEn}</div>
                          )}
                        </div>
                        <span className="text-[9px] bg-black/50 px-1.5 py-0.5 rounded font-mono text-white/90">
                          /category/{catSlug || 'slug'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="px-5 py-2 bg-[#800020] hover:bg-[#9b1b30] text-white rounded font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  {savingCat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{editingCategory ? 'Update Category' : 'Save Category'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE / EDIT AUTHOR (SUPERADMIN FULL PROFILE CONTROL) */}
      {/* ------------------------------------------------------------- */}
      {authorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveAuthor}
            className="bg-white rounded-md shadow-2xl border border-[#ded7cc] w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-[#800020]" />
                <div>
                  <h3 className="font-bold text-base text-gray-900 font-sans">
                    {editingAuthorUser
                      ? (lang === 'en' ? `Edit Author: ${authorForm.display_name || authorForm.username}` : `লেখকের তথ্য সম্পাদনা: ${authorForm.display_name || authorForm.username}`)
                      : (lang === 'en' ? 'Create New Author' : 'নতুন লেখক তৈরি করুন')}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-sans">
                    {lang === 'en'
                      ? 'Add author credentials, pen name, bio, and portrait image'
                      : 'লেখকের ছদ্মনাম, পরিচয়, বায়ো ও প্রোফাইল ছবি নির্ধারণ করুন'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuthorModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              {/* Section 1: Pen Name & Identity */}
              <div className="bg-[#faf7f2] p-3 rounded border border-[#ded7cc] space-y-3">
                <span className="font-bold text-gray-800 uppercase text-[10px] tracking-wider block">
                  ১. লেখকের পরিচয় ও ছদ্মনাম (Author Identity)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      লেখকের নাম / ছদ্মনাম (বাংলায়) <span className="text-[#800020]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={authorForm.display_name || ''}
                      onChange={(e) => setAuthorForm({ ...authorForm, display_name: e.target.value })}
                      placeholder="যেমন: কাজী নজরুল ইসলাম"
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Author Name (English)
                    </label>
                    <input
                      type="text"
                      value={authorForm.display_name_en || ''}
                      onChange={(e) => setAuthorForm({ ...authorForm, display_name_en: e.target.value })}
                      placeholder="e.g. Kazi Nazrul Islam"
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      পদবি / পরিচিতি (বাংলায়)
                    </label>
                    <input
                      type="text"
                      value={authorForm.designation || ''}
                      onChange={(e) => setAuthorForm({ ...authorForm, designation: e.target.value })}
                      placeholder="যেমন: লেখক ও গবেষক, সিনিয়র কলামিস্ট"
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Designation (English)
                    </label>
                    <input
                      type="text"
                      value={authorForm.designation_en || ''}
                      onChange={(e) => setAuthorForm({ ...authorForm, designation_en: e.target.value })}
                      placeholder="e.g. Author & Senior Columnist"
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Account Credentials */}
              <div className="bg-white p-3 rounded border border-gray-200 space-y-3">
                <span className="font-bold text-gray-800 uppercase text-[10px] tracking-wider block">
                  ২. অ্যাকাউন্টের বিবরণ (Account & Login Credentials)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Username <span className="text-[#800020]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={Boolean(editingAuthorUser)}
                      value={authorForm.username}
                      onChange={(e) => setAuthorForm({ ...authorForm, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                      placeholder="e.g. nazrul_islam"
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] disabled:bg-gray-100 disabled:text-gray-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={authorForm.email || ''}
                      onChange={(e) => setAuthorForm({ ...authorForm, email: e.target.value })}
                      placeholder="author@themadstory.com"
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Password {editingAuthorUser ? <span className="font-normal text-gray-400">(leave blank to keep unchanged)</span> : <span className="font-normal text-gray-400">(leave blank for random auto-generation)</span>}
                    </label>
                    <input
                      type="password"
                      value={authorForm.password || ''}
                      onChange={(e) => setAuthorForm({ ...authorForm, password: e.target.value })}
                      placeholder={editingAuthorUser ? "•••••••• (unchanged)" : "Min 6 characters (or blank)"}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={authorForm.first_name || ''}
                        onChange={(e) => setAuthorForm({ ...authorForm, first_name: e.target.value })}
                        className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={authorForm.last_name || ''}
                        onChange={(e) => setAuthorForm({ ...authorForm, last_name: e.target.value })}
                        className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Bio & Image */}
              <div className="bg-white p-3 rounded border border-gray-200 space-y-3">
                <span className="font-bold text-gray-800 uppercase text-[10px] tracking-wider block">
                  ৩. বায়োগ্রাফি ও প্রোফাইল ছবি (Bio & Portrait)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      সংক্ষিপ্ত পরিচিতি / বায়ো (বাংলা)
                    </label>
                    <textarea
                      rows={3}
                      value={authorForm.bio || ''}
                      onChange={(e) => setAuthorForm({ ...authorForm, bio: e.target.value })}
                      placeholder="লেখকের সাহিত্য সাধনা, কর্মক্ষেত্র ও চিন্তাধারার সংক্ষিপ্ত পরিচিতি..."
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Biography (English)
                    </label>
                    <textarea
                      rows={3}
                      value={authorForm.bio_en || ''}
                      onChange={(e) => setAuthorForm({ ...authorForm, bio_en: e.target.value })}
                      placeholder="Brief biography, literary background, and contributions..."
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                </div>

                <div>
                  <ImageUpload
                    value={authorForm.avatar || ''}
                    onChange={(url) => setAuthorForm({ ...authorForm, avatar: url })}
                    label={lang === 'en' ? 'Author Avatar Image (Portrait / Photo)' : 'লেখকের প্রোফাইল ছবি (পোর্ট্রেট / ছবি)'}
                    helperText={lang === 'en' ? 'Upload author square portrait (recommended: 400x400 px)' : 'লেখকের স্কয়ার পোর্ট্রেট ছবি (৪০০ × ৪০০ px)'}
                    aspectRatio="square"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Location / অবস্থান</label>
                    <input
                      type="text"
                      value={authorForm.location || ''}
                      onChange={(e) => setAuthorForm({ ...authorForm, location: e.target.value })}
                      placeholder="ঢাকা, বাংলাদেশ"
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Website / পোর্টফোলিও</label>
                    <input
                      type="url"
                      value={authorForm.website || ''}
                      onChange={(e) => setAuthorForm({ ...authorForm, website: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Facebook</label>
                    <input
                      type="url"
                      value={authorForm.facebook_url || ''}
                      onChange={(e) => setAuthorForm({ ...authorForm, facebook_url: e.target.value })}
                      placeholder="https://facebook.com/..."
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Twitter / X</label>
                    <input
                      type="url"
                      value={authorForm.twitter_url || ''}
                      onChange={(e) => setAuthorForm({ ...authorForm, twitter_url: e.target.value })}
                      placeholder="https://twitter.com/..."
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Instagram</label>
                    <input
                      type="url"
                      value={authorForm.instagram_url || ''}
                      onChange={(e) => setAuthorForm({ ...authorForm, instagram_url: e.target.value })}
                      placeholder="https://instagram.com/..."
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Privileges */}
              <div className="p-3 bg-[#faf7f2] rounded border border-[#ded7cc] space-y-2">
                <span className="font-bold text-gray-800 uppercase text-[10px] tracking-wider block">
                  ৪. পারমিশন ও স্ট্যাটাস (Permissions & Status)
                </span>
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={authorForm.is_staff || false}
                      onChange={(e) => setAuthorForm({ ...authorForm, is_staff: e.target.checked })}
                      className="rounded text-[#800020] focus:ring-[#800020]"
                    />
                    <span className="font-semibold text-gray-800">
                      Grant Staff / Editor Privileges (সম্পাদকীয় প্যানেল অ্যাক্সেস)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={authorForm.is_active !== false}
                      onChange={(e) => setAuthorForm({ ...authorForm, is_active: e.target.checked })}
                      className="rounded text-[#800020] focus:ring-[#800020]"
                    />
                    <span className="font-semibold text-gray-800">Active Account (সক্রিয় অ্যাকাউন্ট)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAuthorModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAuthor}
                  className="px-5 py-2 bg-[#800020] hover:bg-[#9b1b30] text-white rounded font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingAuthor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{editingAuthorUser ? 'Update Author' : 'Create Author'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE USER                                            */}
      {/* ------------------------------------------------------------- */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleCreateUser}
            className="bg-white rounded-md shadow-2xl border border-[#ded7cc] w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900 font-sans">
                Create New User Account
              </h3>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Username <span className="text-[#800020]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. editor_david"
                  className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Password <span className="text-[#800020]">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newUserFirst}
                    onChange={(e) => setNewUserFirst(e.target.value)}
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newUserLast}
                    onChange={(e) => setNewUserLast(e.target.value)}
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUserStaff}
                    onChange={(e) => setNewUserStaff(e.target.checked)}
                    className="rounded text-[#800020] focus:ring-[#800020]"
                  />
                  <span className="font-semibold text-gray-800">Grant Staff / Editor Privileges</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUserActive}
                    onChange={(e) => setNewUserActive(e.target.checked)}
                    className="rounded text-[#800020] focus:ring-[#800020]"
                  />
                  <span className="font-semibold text-gray-800">Active Account</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-4 py-2 bg-[#800020] hover:bg-[#9b1b30] text-white rounded font-semibold flex items-center gap-1.5 transition"
                >
                  {savingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Create User</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: VIEW INQUIRY MESSAGE                                   */}
      {/* ------------------------------------------------------------- */}
      {viewingInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-md shadow-2xl border border-[#ded7cc] w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900 font-sans">
                Inquiry Details
              </h3>
              <button
                onClick={() => setViewingInquiry(null)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="block text-sm text-gray-900">{viewingInquiry.name}</strong>
                  <span className="text-gray-500">{viewingInquiry.email} {viewingInquiry.phone ? `• ${viewingInquiry.phone}` : ''}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                  {viewingInquiry.status}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-gray-400 block mb-0.5 text-[10px] uppercase font-bold">Subject</span>
                <p className="font-bold text-gray-900">{viewingInquiry.subject}</p>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-gray-400 block mb-0.5 text-[10px] uppercase font-bold">Message Body</span>
                <div className="p-3 bg-gray-50 rounded border border-gray-200 text-gray-800 leading-relaxed font-serif whitespace-pre-wrap">
                  {viewingInquiry.message}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-[11px] text-gray-400">
                  Received on {new Date(viewingInquiry.created_at).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => setViewingInquiry(null)}
                  className="px-4 py-1.5 bg-[#800020] text-white rounded text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: REJECT ARTICLE WITH REASON                             */}
      {/* ------------------------------------------------------------- */}
      {rejectingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-md shadow-2xl border border-[#ded7cc] w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900 font-sans">
                প্রত্যাখ্যানের কারণ লিখুন (Reason for Rejection)
              </h3>
              <button
                onClick={() => setRejectingArticle(null)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-gray-600 font-sans">
                Article: <strong>{rejectingArticle.title}</strong>
              </p>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="লেখকের উন্নতির জন্য সুস্পষ্ট কারণ বা সংশোধন পরামর্শ উল্লেখ করুন..."
                className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectingArticle(null)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded text-xs"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  onClick={handleRejectConfirm}
                  className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold"
                >
                  প্রত্যাখ্যান নিশ্চিত করুন (Confirm Reject)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE / EDIT HERO SLIDE (WITH LIVE BANNER PREVIEW)   */}
      {/* ------------------------------------------------------------- */}
      {heroSlideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-md shadow-2xl border border-[#ded7cc] w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#800020]" />
                <h3 className="font-bold text-base text-gray-900 font-sans">
                  {editingHeroSlide
                    ? (lang === 'en' ? 'Edit Hero Banner Slide' : 'হিরো ব্যানার স্লাইড সম্পাদনা করুন')
                    : (lang === 'en' ? 'Add New Hero Banner Slide' : 'নতুন হিরো ব্যানার স্লাইড যোগ করুন')}
                </h3>
              </div>
              <button
                onClick={() => setHeroSlideModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveHeroSlide} className="space-y-4 text-xs font-sans">
              
              {/* Banner Image Upload (Cloudflare R2) */}
              <div>
                <ImageUpload
                  value={slideImage}
                  onChange={setSlideImage}
                  label={lang === 'en' ? 'Banner Image (Cloudflare R2)' : 'ব্যানারের ছবি (ক্লাউডফ্লেয়ার R2)'}
                  required
                  helperText={lang === 'en' ? 'Upload high-resolution landscape banner image directly to Cloudflare R2' : 'সরাসরি ক্লাউডফ্লেয়ার R2 তে উচ্চ-রেজোলিউশনের ল্যান্ডস্কেপ ব্যানার ছবি আপলোড করুন'}
                  aspectRatio="banner"
                  presets={[
                    { label: 'Living Room 3D', url: '/assets/images/18-1024x678.jpg' },
                    { label: 'Tropical Island', url: '/assets/images/beach_resort_paradise_island_aerial_drone_top_view_summer_tropical_nature_landscape_holiday_travel_vacation-1024x683.jpg' },
                    { label: 'Architectural House', url: '/assets/images/shutterstock_398822470-1024x683.jpg' },
                    { label: 'Minimal Interior', url: '/assets/images/Modern_living_room_interior_design_3d_render_illustration_7-1024x576.jpg' },
                  ]}
                />
              </div>

              {/* Destination Link on the Image */}
              <div>
                <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-[#800020]" />
                  {lang === 'en' ? 'Destination Link / URL on Banner Image' : 'ব্যানারের ছবির উপর ক্লিকযোগ্য লিঙ্ক (URL)'}
                  <span className="ml-1 text-[10px] text-gray-400 font-normal">({lang === 'en' ? 'optional' : 'ঐচ্ছিক'})</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={slideButtonLink}
                    onChange={(e) => setSlideButtonLink(e.target.value)}
                    placeholder={lang === 'en' ? 'https://example.com  or  /category/architecture-interiors' : 'https://... অথবা /category/my-category'}
                    className="w-full pl-3 pr-24 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-mono text-xs"
                    title={lang === 'en' ? 'Enter a full URL (https://...) or an internal path (/page)' : 'পূর্ণ URL (https://...) অথবা আভ্যন্তরীণ পাথ (/page) দিন'}
                  />
                  {slideButtonLink && (
                    <button
                      type="button"
                      onClick={() => setSlideButtonLink('')}
                      title={lang === 'en' ? 'Clear link' : 'লিঙ্ক মুছুন'}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                    >
                      ✕ {lang === 'en' ? 'Clear' : 'মুছুন'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {/* Quick-fill suggestions */}
                  <span className="text-[10px] text-gray-400">{lang === 'en' ? 'Quick fill:' : 'দ্রুত পূরণ:'}</span>
                  {['/about', '/contact', '/category/lifestyle'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSlideButtonLink(preset)}
                      className="text-[10px] px-1.5 py-0.5 border border-[#ded7cc] rounded font-mono text-gray-500 hover:border-[#800020] hover:text-[#800020] transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  {lang === 'en'
                    ? 'Clicking anywhere on this banner image will navigate to this URL. Leave blank to make the banner non-clickable.'
                    : 'ভিজিটররা হোমপেজে এই ব্যানার ছবিতে ক্লিক করলে সরাসরি এই পেজ বা লিঙ্কে চলে যাবে। ফাঁকা রাখলে ব্যানার ক্লিকযোগ্য হবে না।'}
                </span>
              </div>

              {/* Title / Label for Admin & Banner display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {lang === 'en' ? 'Banner Title / Headline (Bengali)' : 'ব্যানারের শিরোনাম / টাইটেল (বাংলা)'}
                  </label>
                  <input
                    type="text"
                    value={slideTitle}
                    onChange={(e) => setSlideTitle(e.target.value)}
                    placeholder="যেমন: আধুনিক স্থাপত্য প্রদর্শনী"
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {lang === 'en' ? 'Banner Title / Headline (English)' : 'ব্যানারের শিরোনাম / টাইটেল (ইংরেজি)'}
                  </label>
                  <input
                    type="text"
                    value={slideTitleEn}
                    onChange={(e) => setSlideTitleEn(e.target.value)}
                    placeholder="e.g. Modern Architecture Exhibition"
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              {/* Button Text (Optional custom label for CTA button) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {lang === 'en' ? 'Button Text on Banner (Bengali)' : 'ব্যানার বোতামের লেখা (বাংলা)'}
                    <span className="ml-1 text-[10px] text-gray-400 font-normal">({lang === 'en' ? 'default: বিস্তারিত দেখুন' : 'ডিফল্ট: বিস্তারিত দেখুন'})</span>
                  </label>
                  <input
                    type="text"
                    value={slideButtonText}
                    onChange={(e) => setSlideButtonText(e.target.value)}
                    placeholder="যেমন: বিস্তারিত দেখুন"
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {lang === 'en' ? 'Button Text on Banner (English)' : 'ব্যানার বোতামের লেখা (ইংরেজি)'}
                    <span className="ml-1 text-[10px] text-gray-400 font-normal">({lang === 'en' ? 'default: Explore More' : 'ডিফল্ট: Explore More'})</span>
                  </label>
                  <input
                    type="text"
                    value={slideButtonTextEn}
                    onChange={(e) => setSlideButtonTextEn(e.target.value)}
                    placeholder="e.g. Explore More"
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              {/* Display Order & Active Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {lang === 'en' ? 'Display Order Weight' : 'প্রদর্শনের ক্রম (Display Order)'}
                  </label>
                  <input
                    type="number"
                    value={slideOrder}
                    onChange={(e) => setSlideOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    {lang === 'en' ? 'Lower values appear first (e.g. 0, 1, 2...)' : 'ছোট সংখ্যা আগে প্রদর্শিত হবে (যেমন: ০, ১, ২...)'}
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <input
                    type="checkbox"
                    id="slideActiveCheckbox"
                    checked={slideActive}
                    onChange={(e) => setSlideActive(e.target.checked)}
                    className="w-4 h-4 text-[#800020] rounded border-[#ded7cc] focus:ring-[#800020]"
                  />
                  <label htmlFor="slideActiveCheckbox" className="font-bold text-gray-700 cursor-pointer select-none">
                    {lang === 'en' ? 'Active on Homepage Slider' : 'হোমপেজ স্লাইডারে সক্রিয় রাখুন'}
                  </label>
                </div>
              </div>

              {/* LIVE BANNER PREVIEW (Exact Homepage Look: Title on banner & Link in button) */}
              <div className="pt-2">
                <label className="block font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#800020]" />
                    <span>{lang === 'en' ? 'Live Banner Preview (Exact Homepage Look)' : 'লাইভ ব্যানার প্রিভিউ (হোমপেজে যেভাবে দেখাবে)'}</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    {lang === 'en' ? 'Title & CTA button overlaid on banner image' : 'ব্যানারের উপর টাইটেল এবং বোতামে লিঙ্ক প্রদর্শিত'}
                  </span>
                </label>
                <div className="relative w-full h-56 sm:h-72 rounded-md overflow-hidden border border-[#ded7cc] bg-black shadow-inner group">
                  <img
                    src={slideImage || '/assets/images/18-1024x678.jpg'}
                    alt="Preview"
                    className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/images/18-1024x678.jpg';
                    }}
                  />

                  {/* Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none" />
                  
                  {/* Top Link Preview Pill */}
                  <div className={`absolute top-3 left-3 backdrop-blur-xs text-white text-[10px] font-mono px-2.5 py-1 rounded-full shadow flex items-center gap-1.5 ${slideButtonLink ? 'bg-black/75' : 'bg-gray-700/80'}`}>
                    <span className={`w-2 h-2 rounded-full ${slideButtonLink ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
                    {slideButtonLink ? (
                      <>
                        <span>{lang === 'en' ? 'Link →' : 'লিঙ্ক →'}</span>
                        <span className="max-w-[200px] truncate">{slideButtonLink}</span>
                        {(slideButtonLink.startsWith('http://') || slideButtonLink.startsWith('https://')) && (
                          <span className="text-yellow-300 text-[9px]">[{lang === 'en' ? 'external' : 'বাহ্যিক'}]</span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-300">{lang === 'en' ? 'No link (non-clickable)' : 'কোনো লিঙ্ক নেই'}</span>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white/80 text-[10px] px-2 py-0.5 rounded z-20">
                    Slide #{slideOrder}
                  </div>

                  {/* Content Preview: Title & Button */}
                  <div className="absolute inset-0 z-10 flex flex-col justify-end items-start p-5 sm:p-7 pb-6 pointer-events-none">
                    {(slideTitle || slideTitleEn) ? (
                      <h3 className="font-bengali font-bold text-white text-lg sm:text-2xl drop-shadow-md mb-2.5 line-clamp-2 max-w-xl">
                        {lang === 'en' ? (slideTitleEn || slideTitle) : (slideTitle || slideTitleEn)}
                      </h3>
                    ) : (
                      <h3 className="font-bengali font-bold text-white/40 italic text-base sm:text-lg mb-2.5">
                        {lang === 'en' ? '(Enter banner title above)' : '(উপরে ব্যানারের টাইটেল দিন)'}
                      </h3>
                    )}

                    {slideButtonLink && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#800020] text-white font-bengali font-semibold text-xs rounded shadow-lg">
                        <span>
                          {lang === 'en'
                            ? (slideButtonTextEn || slideButtonText || 'Explore More')
                            : (slideButtonText || slideButtonTextEn || 'বিস্তারিত দেখুন')}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setHeroSlideModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded text-xs hover:bg-gray-50 transition"
                >
                  {lang === 'en' ? 'Cancel' : 'বাতিল'}
                </button>
                <button
                  type="submit"
                  disabled={savingHeroSlide}
                  className="px-5 py-2 bg-[#800020] hover:bg-[#600018] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-60"
                >
                  {savingHeroSlide ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{lang === 'en' ? 'Saving...' : 'সংরক্ষণ হচ্ছে...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Save Hero Slide' : 'স্লাইড সংরক্ষণ করুন'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE / EDIT VIDEO (YOUTUBE EMBED OR DIRECT UPLOAD)   */}
      {/* ------------------------------------------------------------- */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-md shadow-2xl border border-[#ded7cc] w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[#800020]" />
                <h3 className="font-bold text-base text-gray-900 font-sans">
                  {editingVideo
                    ? (lang === 'en' ? 'Edit Video Story' : 'ভিডিও স্টোরি সম্পাদনা করুন')
                    : (lang === 'en' ? 'Add New Video Story' : 'নতুন ভিডিও স্টোরি যোগ করুন')}
                </h3>
              </div>
              <button
                onClick={() => setVideoModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveVideo} className="space-y-4 text-xs font-sans">
              {/* Video Type Selector */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">
                  {lang === 'en' ? 'Video Source Type' : 'ভিডিওর উৎস / মাধ্যম'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVideoType('youtube')}
                    className={`p-3 rounded-md border flex items-center gap-2.5 transition cursor-pointer ${
                      videoType === 'youtube'
                        ? 'border-red-600 bg-red-50 text-red-900 font-bold shadow-2xs'
                        : 'border-[#ded7cc] bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Youtube className="w-5 h-5 text-red-600 shrink-0" />
                    <div className="text-left">
                      <span className="block text-xs font-semibold">YouTube Embed</span>
                      <span className="text-[10px] text-gray-500 font-normal">
                        {lang === 'en' ? 'Paste YouTube link (auto-embed & thumbnail)' : 'ইউটিউব লিঙ্ক পেস্ট করুন (স্বয়ংক্রিয় প্লেয়ার)'}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVideoType('direct')}
                    className={`p-3 rounded-md border flex items-center gap-2.5 transition cursor-pointer ${
                      videoType === 'direct'
                        ? 'border-[#800020] bg-rose-50 text-[#800020] font-bold shadow-2xs'
                        : 'border-[#ded7cc] bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Film className="w-5 h-5 text-[#800020] shrink-0" />
                    <div className="text-left">
                      <span className="block text-xs font-semibold">Direct Video Upload / URL</span>
                      <span className="text-[10px] text-gray-500 font-normal">
                        {lang === 'en' ? 'Upload MP4, WebM or paste direct URL' : 'সরাসরি MP4/WebM আপলোড বা ভিডিও লিংক'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* YouTube Specific Input */}
              {videoType === 'youtube' && (
                <div className="p-4 bg-red-50/40 border border-red-200/60 rounded-md space-y-3">
                  <div>
                    <label className="block font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                      <Youtube className="w-4 h-4 text-red-600" />
                      {lang === 'en' ? 'YouTube Video URL or Video ID' : 'ইউটিউব ভিডিও লিঙ্ক অথবা ভিডিও আইডি'}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={videoYoutubeUrl}
                      onChange={(e) => setVideoYoutubeUrl(e.target.value)}
                      placeholder="যেমন: https://www.youtube.com/watch?v=dQw4w9WgXcQ অথবা https://youtu.be/..."
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-red-600 font-mono text-xs bg-white"
                      required={videoType === 'youtube'}
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      {lang === 'en'
                        ? 'Accepts standard watch links, youtu.be short links, embed links, or shorts.'
                        : 'সাধারণ ইউটিউব লিঙ্ক, শর্ট লিঙ্ক, এমবেড লিঙ্ক অথবা শর্টস সব ধরনের লিঙ্ক সমর্থন করে।'}
                    </span>
                  </div>

                  {/* YouTube Live Embed Preview */}
                  {(() => {
                    const match = videoYoutubeUrl.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/|\/v\/)([a-zA-Z0-9_-]{11})/);
                    const yId = match ? match[1] : (/^[a-zA-Z0-9_-]{11}$/.test(videoYoutubeUrl.trim()) ? videoYoutubeUrl.trim() : '');
                    if (!yId) return null;
                    return (
                      <div className="pt-2 border-t border-red-200/50">
                        <span className="text-[10px] font-bold uppercase text-gray-600 block mb-1">
                          {lang === 'en' ? 'Live Player Preview:' : 'লাইভ ভিডিও প্রিভিউ:'}
                        </span>
                        <div className="aspect-video w-full max-w-md bg-black rounded overflow-hidden shadow border border-gray-300">
                          <iframe
                            src={`https://www.youtube.com/embed/${yId}?rel=0`}
                            title="YouTube Preview"
                            className="w-full h-full border-0"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Direct Video Input */}
              {videoType === 'direct' && (
                <div className="p-4 bg-amber-50/40 border border-amber-200/60 rounded-md space-y-3">
                  <div>
                    <label className="block font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-[#800020]" />
                      {lang === 'en' ? 'Upload Video File (MP4, WebM, MOV)' : 'সরাসরি ভিডিও ফাইল আপলোড করুন (MP4, WebM)'}
                    </label>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setVideoFile(file);
                      }}
                      className="w-full p-2 border border-[#ded7cc] rounded bg-white font-sans text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#800020] file:text-white hover:file:bg-[#600018] cursor-pointer"
                    />
                    {videoFile && (
                      <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                        ✓ {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      {lang === 'en' ? 'Or Direct Hosted Video URL (CDN / Storage URL)' : 'অথবা সিডিএন / সার্ভার ভিডিও লিংক (URL)'}
                    </label>
                    <input
                      type="text"
                      value={videoDirectUrl}
                      onChange={(e) => setVideoDirectUrl(e.target.value)}
                      placeholder="https://example.com/videos/my-documentary.mp4"
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-mono text-xs bg-white"
                    />
                  </div>

                  {/* Direct Video Preview */}
                  {(videoFile || videoDirectUrl || editingVideo?.effective_video_url) && (
                    <div className="pt-2 border-t border-amber-200/50">
                      <span className="text-[10px] font-bold uppercase text-gray-600 block mb-1">
                        {lang === 'en' ? 'HTML5 Player Preview:' : 'প্লেয়ার প্রিভিউ:'}
                      </span>
                      <div className="aspect-video w-full max-w-md bg-black rounded overflow-hidden shadow border border-gray-300">
                        <video
                          src={videoFile ? URL.createObjectURL(videoFile) : (videoDirectUrl || editingVideo?.effective_video_url)}
                          controls
                          playsInline
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Title Fields (Bengali & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {lang === 'en' ? 'Video Title (Bengali)' : 'ভিডিও শিরোনাম (বাংলা)'}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="যেমন: শিল্পের রূপরেখা ও ঢাকা আর্ট সামিট"
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {lang === 'en' ? 'Video Title (English)' : 'ভিডিও শিরোনাম (ইংরেজি)'}
                    <span className="ml-1 text-[10px] text-gray-400 font-normal">({lang === 'en' ? 'optional' : 'ঐচ্ছিক'})</span>
                  </label>
                  <input
                    type="text"
                    value={videoTitleEn}
                    onChange={(e) => setVideoTitleEn(e.target.value)}
                    placeholder="e.g. Artistic Perspectives & Dhaka Art Summit"
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              {/* Category Field */}
              <div>
                <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-[#800020]" />
                  {lang === 'en' ? 'Category' : 'ক্যাটাগরি বা বিভাগ'}
                  <span className="ml-1 text-[10px] text-gray-400 font-normal">
                    ({lang === 'en' ? 'optional - organizes video into categorized homepage sections' : 'ঐচ্ছিক - হোমপেজে ক্যাটাগরিভিত্তিক সেকশনে সাজাতে'})
                  </span>
                </label>
                <select
                  value={videoCategoryId}
                  onChange={(e) => setVideoCategoryId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] bg-white font-sans text-xs cursor-pointer"
                >
                  <option value="">{lang === 'en' ? '-- Select a Category (Optional) --' : '-- ক্যাটাগরি নির্বাচন করুন (ঐচ্ছিক) --'}</option>
                  {allFlattenedCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.depth > 0 ? '— '.repeat(c.depth) : ''}{c.name} {c.name_en ? `(${c.name_en})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description Fields (Bengali & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {lang === 'en' ? 'Description (Bengali)' : 'সংক্ষিপ্ত বিবরণ (বাংলা)'}
                  </label>
                  <textarea
                    rows={2}
                    value={videoDesc}
                    onChange={(e) => setVideoDesc(e.target.value)}
                    placeholder="ভিডিও সম্পর্কে সংক্ষিপ্ত বিবরণ বা প্রেক্ষাপট লিখুন..."
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {lang === 'en' ? 'Description (English)' : 'সংক্ষিপ্ত বিবরণ (ইংরেজি)'}
                  </label>
                  <textarea
                    rows={2}
                    value={videoDescEn}
                    onChange={(e) => setVideoDescEn(e.target.value)}
                    placeholder="Brief description or context..."
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              {/* Thumbnail Configuration */}
              <div className="p-4 bg-[#faf7f2] border border-[#ded7cc] rounded-md space-y-3">
                <label className="block font-bold text-gray-700">
                  {lang === 'en' ? 'Custom Thumbnail Image' : 'কাস্টম থাম্বনেইল ছবি'}
                  <span className="ml-1 text-[10px] text-gray-400 font-normal">
                    {lang === 'en'
                      ? '(optional - YouTube videos auto-fetch HQ thumbnail if omitted)'
                      : '(ঐচ্ছিক - ইউটিউব ভিডিওর ক্ষেত্রে না দিলেও স্বয়ংক্রিয়ভাবে আসবে)'}
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1 font-semibold">
                      {lang === 'en' ? 'Upload Image File:' : 'ছবি আপলোড করুন:'}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setVideoThumbnailFile(file);
                      }}
                      className="w-full p-2 border border-[#ded7cc] rounded bg-white text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-gray-800 file:text-white cursor-pointer"
                    />
                    {videoThumbnailFile && (
                      <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                        ✓ {videoThumbnailFile.name}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1 font-semibold">
                      {lang === 'en' ? 'Or Image URL:' : 'অথবা ছবির লিঙ্ক (URL):'}
                    </label>
                    <input
                      type="text"
                      value={videoThumbnailUrl}
                      onChange={(e) => setVideoThumbnailUrl(e.target.value)}
                      placeholder="/assets/images/... অথবা https://..."
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] text-xs bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Duration & Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    {lang === 'en' ? 'Duration Label' : 'ভিডিওর দৈর্ঘ্য / সময়কাল'}
                  </label>
                  <input
                    type="text"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    placeholder="যেমন: ০৮:৪৫ অথবা 08:45"
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {lang === 'en' ? 'Display Order (Sequence)' : 'প্রদর্শনের ক্রম (Order)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={videoOrder}
                    onChange={(e) => setVideoOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              {/* Toggles: Featured & Active */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={videoFeatured}
                    onChange={(e) => setVideoFeatured(e.target.checked)}
                    className="rounded text-[#800020] focus:ring-[#800020]"
                  />
                  <span className="font-semibold text-gray-800">
                    {lang === 'en' ? 'Spotlight Video (Featured as Main Player)' : 'স্পটলাইট ভিডিও (হোমপেজ প্লেয়ারে প্রধান ফোকাস)'}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={videoActive}
                    onChange={(e) => setVideoActive(e.target.checked)}
                    className="rounded text-[#800020] focus:ring-[#800020]"
                  />
                  <span className="font-semibold text-gray-800">
                    {lang === 'en' ? 'Active on Homepage' : 'হোমপেজে সক্রিয় / দৃশ্যমান'}
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setVideoModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded text-xs hover:bg-gray-50 transition cursor-pointer"
                >
                  {lang === 'en' ? 'Cancel' : 'বাতিল'}
                </button>
                <button
                  type="submit"
                  disabled={savingVideo}
                  className="px-5 py-2 bg-[#800020] hover:bg-[#600018] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-60 cursor-pointer"
                >
                  {savingVideo ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{lang === 'en' ? 'Saving...' : 'সংরক্ষণ হচ্ছে...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Save Video Story' : 'ভিডিও সংরক্ষণ করুন'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
