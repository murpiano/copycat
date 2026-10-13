import { useState } from 'react';
import type { ClipboardItem } from '../../shared/types';

interface TagEditorProps {
  item: ClipboardItem;
  onAddTag: (id: number, tag: string) => void;
  onRemoveTag: (id: number, tag: string) => void;
}

export function TagEditor({ item, onAddTag, onRemoveTag }: TagEditorProps) {
  const [draft, setDraft] = useState('');

  function submit() {
    const tag = draft.trim();
    if (tag) onAddTag(item.id, tag);
    setDraft('');
  }

  return (
    <div className="tag-editor">
      {item.tags.map((tag) => (
        <span key={tag} className="tag-chip">
          {tag}
          <button aria-label={`remove-${tag}`} onClick={() => onRemoveTag(item.id, tag)}>
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        placeholder="Add tag..."
      />
    </div>
  );
}
