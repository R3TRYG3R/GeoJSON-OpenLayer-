import React, { useEffect, useState } from "react";
import "./EditGeometryModal.css";
import {
  Point,
  LineString,
  Polygon,
  MultiPolygon,
  MultiLineString,
  Geometry,
} from "ol/geom";
import { toLonLat, fromLonLat } from "ol/proj";
import { useMoveMode } from "../../context/MoveModeContext"; // 👈 добавлено

interface Props {
  isOpen: boolean;
  onClose: () => void;
  feature: any;
  onGeometryUpdate: () => void;
}

export const EditGeometryModal: React.FC<Props> = ({ isOpen, onClose, feature, onGeometryUpdate }) => {
  const geometry = feature.getGeometry();
  const geometryType = geometry?.getType();
  const [coordsText, setCoordsText] = useState("");
  const [error, setError] = useState("");

  const { startMoveMode } = useMoveMode(); // 👈 добавлено

  useEffect(() => {
    if (isOpen && geometry && geometryType) {
      const convertCoords = (coord: any): any =>
        typeof coord[0] === "number" ? toLonLat(coord) : coord.map(convertCoords);

      const coords = convertCoords((geometry as any).getCoordinates());
      setCoordsText(JSON.stringify(coords, null, 2));
      setError("");
    }
  }, [isOpen]);

  const applyCoordinates = () => {
    try {
      const parsed = JSON.parse(coordsText);
      const convertBack = (coord: any): any =>
        typeof coord[0] === "number" ? fromLonLat(coord) : coord.map(convertBack);

      const transformed = convertBack(parsed);
      let newGeometry: Geometry | null = null;

      switch (geometryType) {
        case "Point": newGeometry = new Point(transformed); break;
        case "LineString": newGeometry = new LineString(transformed); break;
        case "Polygon": newGeometry = new Polygon(transformed); break;
        case "MultiPolygon": newGeometry = new MultiPolygon(transformed); break;
        case "MultiLineString": newGeometry = new MultiLineString(transformed); break;
        default: throw new Error("❌ Unsupported geometry type");
      }

      feature.setGeometry(newGeometry);
      onGeometryUpdate(); // Обновляем таблицу
      onClose();
    } catch (err) {
      console.error("❌ Invalid coordinates:", err);
      setError("Неверный формат координат. Проверь JSON.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <h2>Редактирование координат</h2>
        <p className="geom-type">Тип геометрии: <b>{geometryType}</b></p>
        <textarea value={coordsText} onChange={(e) => setCoordsText(e.target.value)} rows={10} />
        {error && <div className="error-message">{error}</div>}
        <div className="modal-buttons">
          <button onClick={applyCoordinates} className="btn-save">Сохранить</button>
          <button onClick={onClose} className="btn-cancel">Отмена</button>
          {geometryType === "Point" && (
            <button
              onClick={() => {
                startMoveMode(feature);
                onClose();
              }}
              className="btn-move"
            >
              📍 Переместить
            </button>
          )}
        </div>
      </div>
    </div>
  );
};