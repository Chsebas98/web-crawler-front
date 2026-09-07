import type { StoryFilter } from '../types/story';

type FilterOption = {
  value: StoryFilter;
  label: string;
  description: string;
};

const FILTER_OPTIONS: FilterOption[] = [
  {
    value: 'MORE_THAN_FIVE_WORDS',
    label: 'More than 5 words',
    description: 'Ordered by comments',
  },
  {
    value: 'FIVE_OR_FEWER_WORDS',
    label: '5 words or fewer',
    description: 'Ordered by points',
  },
];

type FilterSelectorProps = {
  selected: StoryFilter;
  onChange: (filter: StoryFilter) => void;
  disabled?: boolean;
};

/** Lets the user pick which backend filter to apply. Internal enum values are never shown to the user. */
export function FilterSelector({ selected, onChange, disabled = false }: FilterSelectorProps) {
  return (
    <fieldset className="filter-selector">
      <legend>Select filter</legend>
      <div className="filter-options">
        {FILTER_OPTIONS.map((option) => (
          <label key={option.value} className="filter-option">
            <input
              type="radio"
              name="story-filter"
              value={option.value}
              checked={selected === option.value}
              disabled={disabled}
              onChange={() => onChange(option.value)}
            />
            <span className="filter-option-text">
              <span className="filter-option-label">{option.label}</span>
              <span className="filter-option-description">{option.description}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
