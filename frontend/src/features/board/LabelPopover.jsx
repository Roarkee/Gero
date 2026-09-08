import React, { useState } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Tag, Plus, CheckSquare, X } from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";

export default function LabelPopover({
  allLabels,
  selectedLabels,
  onToggleLabel,
  onCreateLabel,
  triggerNode,
}) {
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6");
  const [isCreating, setIsCreating] = useState(false);

  const colors = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899"
  ];

  const handleCreate = async () => {
    if (!newLabelName.trim()) return;
    try {
      await onCreateLabel({ name: newLabelName, color: newLabelColor });
      setNewLabelName("");
      setIsCreating(false);
    } catch (error) {
      toast.error("Failed to create label");
    }
  };

  return (
    <Popover className="relative">
      <PopoverButton as="div" className="cursor-pointer">
        {triggerNode || (
          <button className="h-6 w-6 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        )}
      </PopoverButton>

      <PopoverPanel className="absolute z-50 mt-2 w-64 rounded-lg bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 p-3 outline-none focus:outline-none overflow-hidden origin-top-left left-0 sm:-translate-x-1/4 translate-y-1">
        {!isCreating ? (
          <>
            <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 text-center">
              Labels
            </h5>
            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar mb-3">
              {allLabels?.map((label) => {
                const isActive = selectedLabels.includes(label.id);
                return (
                  <div
                    key={label.id}
                    onClick={() => onToggleLabel(label)}
                    className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md transition-colors"
                  >
                    <div
                      className="w-full h-8 rounded-md px-3 flex items-center shadow-sm relative group"
                      style={{ backgroundColor: label.color }}
                    >
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-md" />
                      <span className="text-xs font-semibold text-white drop-shadow-sm flex-1 truncate">
                        {label.name}
                      </span>
                      {isActive && (
                        <CheckSquare className="w-4 h-4 text-white drop-shadow-sm flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
              {allLabels?.length === 0 && (
                <p className="text-center text-xs text-gray-400 py-2">No labels found.</p>
              )}
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
            >
              Create a new label
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
              <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Create label
              </h5>
              <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mb-3">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 block">Title</label>
              <input
                autoFocus
                placeholder="Label name"
                className="w-full text-sm p-1.5 rounded border border-gray-200 dark:border-gray-600 focus:ring-1 focus:ring-indigo-500 outline-none bg-transparent dark:text-white"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
            </div>
            
            <div className="mb-3">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 block">Select a color</label>
              <div className="grid grid-cols-5 gap-1.5">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewLabelColor(color)}
                    className={clsx(
                      "w-full aspect-square rounded-md shadow-sm transition-transform hover:scale-105",
                      newLabelColor === color ? "ring-2 ring-offset-1 ring-gray-400" : ""
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <button
              className="w-full text-xs font-medium bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition-colors"
              onClick={handleCreate}
            >
              Create
            </button>
          </>
        )}
      </PopoverPanel>
    </Popover>
  );
}
