import React, { useEffect, useRef, useState } from "react";

interface EditFeatureProps {
  value: string;
  onChange: (value: string) => void;
  onExit: () => void;
  ["data-column"]?: string;
}

export const EditFeature: React.FC<EditFeatureProps> = ({ value, onChange, onExit, ...rest }) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onChange(localValue);
      inputRef.current?.blur(); // 🚪 Закрываем редактирование
    }
  };

  const handleBlur = () => {
    onChange(localValue); // 💾 Сохраняем при потере фокуса
    onExit();
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      style={{ padding: "4px", width: "100%" }}
      {...rest} // 🔄 Прокидываем data-column
    />
  );
};