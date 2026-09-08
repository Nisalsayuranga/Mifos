import { POI_CATEGORIES, type CategoryConfig } from '../../config/categories';

interface CategoryFiltersProps {
  enabledCategories: string[];
  onToggleCategory: (id: string) => void;
}

export default function CategoryFilters({ enabledCategories, onToggleCategory }: CategoryFiltersProps) {
  return (
    <div className="category-filters">
      <h3 className="section-title">Analyze Surrounding</h3>
      <div className="filters-grid">
        {POI_CATEGORIES.map((cat: CategoryConfig) => {
          const isActive = enabledCategories.includes(cat.id);
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              className={`filter-chip ${isActive ? 'active' : ''}`}
              onClick={() => onToggleCategory(cat.id)}
              style={{
                borderColor: isActive ? cat.color : 'transparent',
                backgroundColor: isActive ? `${cat.color}15` : '#f3f4f6',
                color: isActive ? cat.color : 'var(--text-muted)'
              }}
            >
              <Icon size={16} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
