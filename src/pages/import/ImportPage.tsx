import { useRef, useState, useMemo } from "react";
import { FileUpload } from "../../features/FileUpload/FileUpload";
import { MapPreview } from "../../widgets/MapPreview/MapPreview";
import { FeatureTable } from "../../widgets/FeatureTable/FeatureTable";
import { AddFeatureModal } from "../../features/DataAdding/AddFeatureModal";
import { useAddMode, GeometryType } from "../../context/AddModeContext";
import { useSelectedFeature } from "../../context/SelectedFeatureContext";
import { useMap } from "../../context/MapContext";
import GeoJSON from "ol/format/GeoJSON";
import Feature from "ol/Feature";
import { Geometry } from "ol/geom";
import "./ImportPage.css";

export const ImportPage = () => {
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null!);
  const { startAddMode } = useAddMode();
  const { setSelectedFeature } = useSelectedFeature(); // 👈 для выделения
  const { zoomToFeature } = useMap(); // 👈 для приближения

  const geometryTypes = useMemo<GeometryType[]>(() => {
    const types = new Set<GeometryType>();
    parsedData?.features?.forEach((f: any) => {
      if (f.geometry?.type) types.add(f.geometry.type as GeometryType);
    });
    return Array.from(types);
  }, [parsedData]);

  const handleFileParsed = (data: any) => {
    try {
      if (!data || !data.features || !Array.isArray(data.features)) {
        throw new Error("❌ Некорректный формат данных. Ожидался GeoJSON.");
      }
      console.log("📥 Данные переданы в ImportPage:", data);
      setParsedData(data);
    } catch (error) {
      console.error("❌ Ошибка при обработке данных в ImportPage:", error);
    }
  };

  const handleClearMap = () => {
    console.log("🗑 Очищаем карту и сбрасываем данные...");
    setParsedData(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleAddGeometry = (coordinates: any) => {
    const newId = (parsedData?.features.length ?? 0) + 1;

    const newFeatureGeoJSON = {
      type: "Feature",
      geometry: {
        type: selectedGeometryType,
        coordinates,
      },
      properties: {
        id: newId,
        name: `New ${selectedGeometryType} ${newId}`,
      },
    };

    const updated = {
      ...parsedData,
      features: [...(parsedData?.features || []), newFeatureGeoJSON],
    };

    setParsedData(updated);

    // ✅ Сразу выделяем и приближаем
    setTimeout(() => {
      const format = new GeoJSON();
      const feature = format.readFeature(newFeatureGeoJSON, {
        featureProjection: "EPSG:3857",
      }) as Feature<Geometry>;
      feature.setId(String(newId));

      setSelectedFeature(feature); // 👈 выделение
      zoomToFeature(feature);      // 👈 зум
    }, 0); // 👈 даём React время обновить setParsedData
  };

  const [selectedGeometryType, setSelectedGeometryType] = useState<GeometryType>("Point");

  const handleGeometryTypeSelect = (type: GeometryType) => {
    setSelectedGeometryType(type);
    setModalOpen(false);
    startAddMode(type);
  };

  return (
    <div className="import-container">
      {/* Шапка */}
      <div className="import-header">
        <h1 className="import-title">Импорт</h1>
        <div className="import-buttons">
          <FileUpload onFileParsed={handleFileParsed} inputRef={inputRef} />

          <button
            className="add-button"
            onClick={() => setModalOpen(true)}
            disabled={!parsedData}
          >
            ➕ Добавить объект
          </button>

          <button className="clear-button" onClick={handleClearMap}>
            🗑 Очистить карту
          </button>
        </div>
      </div>

      {/* Карта */}
      <div className="map-container">
        <MapPreview
          geojsonData={parsedData || { type: "FeatureCollection", features: [] }}
          onAddGeometry={handleAddGeometry}
        />
      </div>

      {/* Таблица */}
      <div className="table-wrapper">
        <h2 className="table-title">Таблица данных</h2>
        <FeatureTable geojsonData={parsedData} onUpdate={setParsedData} />
      </div>

      {/* Модалка выбора типа геометрии */}
      <AddFeatureModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        types={geometryTypes}
        onSelect={handleGeometryTypeSelect}
      />
    </div>
  );
};