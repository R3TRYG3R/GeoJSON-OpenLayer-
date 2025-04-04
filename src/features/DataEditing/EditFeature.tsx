import React, { useEffect, useRef, useState } from "react";

interface EditFeatureProps {
  value: string;
  onChange: (value: string) => void;
  onExit: () => void;
}

export const EditFeature: React.FC<EditFeatureProps> = ({ value, onChange, onExit }) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onChange(localValue);
      inputRef.current?.blur(); // 💡 Завершаем редактирование
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={onExit} // 🔁 Сообщаем родителю о выходе
      style={{ padding: "4px", width: "100%" }}
    />
  );
};