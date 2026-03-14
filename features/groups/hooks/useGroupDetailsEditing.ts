import { useState } from "react";

export type EditableField = "name" | "description";

interface UseGroupDetailsEditingOptions {
  onSave?: (field: EditableField, value: string) => Promise<void> | void;
}

export function useGroupDetailsEditing(options: UseGroupDetailsEditingOptions = {}) {
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { onSave } = options;

  function startEditing(field: EditableField, value: string) {
    setEditingField(field);
    setTempValue(value);
  }

  function cancelEdit() {
    setEditingField(null);
    setTempValue("");
  }

  async function saveEdit() {
    if (editingField !== "name" && editingField !== "description") return;
    setIsSaving(true);
    try {
      if (onSave) await onSave(editingField, tempValue.trim());
      setEditingField(null);
      setTempValue("");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    editingField,
    tempValue,
    setTempValue,
    isSaving,
    startEditing,
    cancelEdit,
    saveEdit,
  };
}
