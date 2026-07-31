import React, { useState } from "react";
import { Plus, X, Tag } from "lucide-react";
import {
  useLabels,
  useCreateLabel,
  useDeleteLabel,
} from "../../../api/queries/useLabels";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
  "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899",
];

export default function LabelSelector({ projectId, selectedLabels, onSelect, onRemove }) {
  const { data: labels } = useLabels();
  const createLabel = useCreateLabel();
  const deleteLabel = useDeleteLabel();

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0]);

  const projectLabels = labels?.filter((l) => l.project === projectId) || [];
  
  // selectedLabels is expected to be an array of label objects (or IDs).
  // Assuming array of objects since TaskDetailDrawer renders task.labels map
  const selectedIds = selectedLabels?.map((l) => typeof l === 'object' ? l.id : l) || [];

  const handleCreate = async () => {
    if (!newLabelName.trim() || createLabel.isPending) return;
    try {
      const newLabel = await createLabel.mutateAsync({
        name: newLabelName,
        color: newLabelColor,
        project: projectId,
      });
      setIsCreating(false);
      setNewLabelName("");
      onSelect(newLabel);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleLabel = (label) => {
    if (selectedIds.includes(label.id)) {
      onRemove(label);
    } else {
      onSelect(label);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <Tag className="w-4 h-4" />
        Add Label
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 p-3">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {isCreating ? "Create Label" : "Select Labels"}
            </h4>
            <button
              onClick={() => {
                setIsOpen(false);
                setIsCreating(false);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isCreating ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Label name..."
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewLabelColor(color)}
                    className={`w-6 h-6 rounded-full border-2 ${newLabelColor === color ? "border-gray-900 dark:border-white" : "border-transparent"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={!newLabelName.trim() || createLabel.isPending}
                  className="flex-1 bg-primary-600 text-white text-xs py-1.5 rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  Create
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar mb-2">
                {projectLabels.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-2">No labels yet.</p>
                ) : (
                  projectLabels.map((label) => {
                    const isSelected = selectedIds.includes(label.id);
                    return (
                      <div
                        key={label.id}
                        className="flex items-center justify-between group px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md cursor-pointer"
                        onClick={() => toggleLabel(label)}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${label.color}20`, color: label.color }}
                          >
                            {label.name}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Delete this label?")) {
                              deleteLabel.mutate(label.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center justify-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 py-1.5 rounded-md border border-dashed border-gray-300 dark:border-gray-600"
              >
                <Plus className="w-3 h-3" /> Create new label
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
