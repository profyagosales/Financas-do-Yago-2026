"use client";

import { useState } from "react";

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface Props {
  tags: Tag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

function tagStyle(color: string | null) {
  return color
    ? { backgroundColor: color + "22", borderColor: color, color }
    : undefined;
}

export function TagsSelector({ tags, selectedIds, onChange }: Props) {
  const [search, setSearch] = useState("");

  const filtered = tags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  if (tags.length === 0) {
    return (
      <p className="text-xs text-slate-500 italic">
        Nenhuma tag criada ainda. Crie tags na secao abaixo.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {tags.length > 5 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrar tags..."
          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
        />
      )}
      <div className="flex flex-wrap gap-2">
        {filtered.map((tag) => {
          const selected = selectedIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag.id)}
              style={selected ? tagStyle(tag.color) : undefined}
              className={[
                "rounded-full border px-3 py-0.5 text-xs font-medium transition",
                selected
                  ? "border-transparent shadow-sm"
                  : "border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700",
              ].join(" ")}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
      {/* IDs selecionados enviados junto com o form */}
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="tag_ids" value={id} />
      ))}
    </div>
  );
}
