// src/pages/import/ImportPage.tsx
import React, { useRef, useState, useMemo } from "react";
import GeoJSON from "ol/format/GeoJSON";
import Feature from "ol/Feature";
import { Geometry } from "ol/geom";
import { useMap } from "../../context/MapContext";
import { useSelectedFeature } from "../../context/SelectedFeatureContext";
import { useAddMode, GeometryType } from "../../context/AddModeContext";
import { useMoveMode } from "../../context/MoveModeContext";
import { FileUpload } from "../../features/FileUpload/FileUpload";
import { MapPreview } from "../../widgets/MapPreview/MapPreview";
import { FeatureTable } from "../../widgets/FeatureTable/FeatureTable";
import { AddFeatureModal } from "../../features/DataAdding/AddFeatureModal";
import "./ImportPage.css";

export const ImportPage: React.FC = () => {
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null!);

  const { setSelectedFeature } = useSelectedFeature();
  const { startAddMode } = useAddMode();
  const { zoomToFeature } = useMap();
  const { movingFeature } = useMoveMode();
  const { cancelAddMode } = useAddMode();

  const [selectedGeometryType, setSelectedGeometryType] = useState<GeometryType>("Point");
  const geometryTypes = useMemo<GeometryType[]>(() => {
    const types = new Set<GeometryType>();
    parsedData?.features?.forEach((f: any) => {
      if (f.geometry?.type) types.add(f.geometry.type as GeometryType);
    });
    return Array.from(types);
  }, [parsedData]);

  // Парсим файл
  const handleFileParsed = (data: any) => {
    console.log("📥 Данные переданы в ImportPage:", data);
    setParsedData(data);
  };

  // Очищаем карту и сбрасываем ввод
  const handleClearMap = () => {
    setParsedData(null);
    cancelAddMode();
    if (inputRef.current) inputRef.current.value = "";
  };

  // Добавление новой геометрии
  const handleAddGeometry = (coords: any) => {
    const newId = (parsedData?.features.length ?? 0) + 1;
    const newFeat = {
      type: "Feature",
      geometry: { type: selectedGeometryType, coordinates: coords },
      properties: { id: newId, name: `New ${selectedGeometryType} ${newId}` },
    };
    setParsedData({
      ...parsedData!,
      features: [...parsedData!.features, newFeat],
    });
    // Сразу выделяем и зумим
    setTimeout(() => {
      const feat = new GeoJSON().readFeature(newFeat, {
        featureProjection: "EPSG:3857",
      }) as Feature<Geometry>;
      feat.setId(String(newId));
      setSelectedFeature(feat);
      zoomToFeature(feat);
    }, 0);
  };

  // Обработка перемещения существующей точки
  const handleMoveFeature = (id: string, coords: [number, number]) => {
    if (!parsedData) return;
    const updated = {
      ...parsedData,
      features: parsedData.features.map((f: any) => {
        const fid = String(f.properties?.id ?? f.id);
        if (fid === id) {
          return {
            ...f,
            geometry: { type: "Point", coordinates: coords },
            properties: {
              ...f.properties,
              longitude: coords[0],
              latitude: coords[1],
            },
          };
        }
        return f;
      }),
    };
    setParsedData(updated);
    // После обновления снова выделяем и зумим на тот же OL‑Feature
    if (movingFeature) {
      setSelectedFeature(movingFeature);
      zoomToFeature(movingFeature);
    }
  };

  // Запуск режима добавления
  const handleGeometryTypeSelect = (type: GeometryType) => {
    setSelectedGeometryType(type);
    setModalOpen(false);
    startAddMode(type);
  };

  // Экспорт файла
  const handleExport = () => {
    if (!parsedData) return;
  
    const dataStr = JSON.stringify(parsedData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.href = url;
    link.download = "export.geojson";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  
    URL.revokeObjectURL(url);
  };

  return (
    <div className="import-container">
      <div className="import-header">
        <h1 className="import-title">OpenLayers Project</h1>
        <div className="import-buttons">
        <button
            className="export-button"
            onClick={handleExport}
            disabled={!parsedData}
          >
            📤 Экспортировать GeoJSON
          </button>
          <FileUpload onFileParsed={handleFileParsed} inputRef={inputRef} />
  
          <button
            className="add-button" onClick={() => setModalOpen(true)} disabled={!parsedData}>
            ➕ Добавить объект
          </button>
  
          <button className="clear-button" onClick={handleClearMap}>
            🗑 Очистить карту
          </button>
        </div>
      </div>
  
      <div className="map-container">
        <MapPreview
          geojsonData={parsedData || { type: "FeatureCollection", features: [] }}
          onAddGeometry={handleAddGeometry}
          onMoveFeature={handleMoveFeature}
        />
      </div>
  
      <div className="table-wrapper">
        <FeatureTable geojsonData={parsedData} onUpdate={setParsedData} />
      </div>
  
      <AddFeatureModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        types={geometryTypes}
        onSelect={handleGeometryTypeSelect}
      />
    </div>
  );
};