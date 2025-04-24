import React from "react";
import "./CoordinatesList.css";

interface Props {
  coordinates: [number, number][];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onChange: (index: number, newCoord: [number, number]) => void;
  errors: boolean[];
}

export const CoordinatesList: React.FC<Props> = ({ coordinates, selectedIndex, onSelect, onChange, errors }) => {
  const handleInputChange = (index: number, axis: 0 | 1, value: string) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return;

    const updated: [number, number] = [...coordinates[index]] as [number, number];
    updated[axis] = parsed;
    onChange(index, updated);
  };

  return (
    <div className="coords-list">
      <h4>Координаты</h4>
      {coordinates.map((coord, idx) => (
        <div
          key={idx}
          className={`coord-item ${selectedIndex === idx ? "selected" : ""} ${errors[idx] ? "error" : ""}`}
          onClick={() => onSelect(idx)}
        >
          <span>{idx + 1}.</span>
          <input
            type="text"
            value={coord[0]}
            onChange={(e) => handleInputChange(idx, 0, e.target.value)}
          />
          <input
            type="text"
            value={coord[1]}
            onChange={(e) => handleInputChange(idx, 1, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
};