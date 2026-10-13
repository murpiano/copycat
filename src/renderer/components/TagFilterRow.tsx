export interface TagCount {
  name: string;
  count: number;
}

interface TagFilterRowProps {
  tags: TagCount[];
  activeTags: string[];
  onToggle: (tag: string) => void;
}

export function TagFilterRow({ tags, activeTags, onToggle }: TagFilterRowProps) {
  return (
    <div className="tag-filter-row">
      {tags.map((tag) => (
        <button
          key={tag.name}
          className={activeTags.includes(tag.name) ? 'tag-chip active' : 'tag-chip'}
          onClick={() => onToggle(tag.name)}
        >
          {tag.name} <span className="tag-count">{tag.count}</span>
        </button>
      ))}
    </div>
  );
}
