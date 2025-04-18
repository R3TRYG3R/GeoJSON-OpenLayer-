import { useRef, useState, useMemo, useEffect } from "react";
import { FileUpload } from "../../features/FileUpload/FileUpload";
import { MapPreview } from "../../widgets/MapPreview/MapPreview";
import { FeatureTable } from "../../widgets/FeatureTable/FeatureTable";
import { AddFeatureModal } from "../../features/DataAdding/AddFeatureModal";
import { useAddMode, GeometryType } from "../../context/AddModeContext";
import { useSelectedFeature } from "../../context/SelectedFeatureContext";
import { useMap } from "../../context/MapContext";
import { useMoveMode } from "../../context/MoveModeContext";
import GeoJSON from "ol/format/GeoJSON";
import Feature from "ol/Feature";
import { Geometry } from "ol/geom";
import "./ImportPage.css";

export const ImportPage = () => {
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null!);

  const { startAddMode } = useAddMode();
  const { setSelectedFeature } = useSelectedFeature();
  const { zoomToFeature } = useMap();
  const { movingFeature } = useMoveMode();

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

    setTimeout(() => {
      const format = new GeoJSON();
      const feature = format.readFeature(newFeatureGeoJSON, {
        featureProjection: "EPSG:3857",
      }) as Feature<Geometry>;
      feature.setId(String(newId));

      setSelectedFeature(feature);
      zoomToFeature(feature);
    }, 0);
  };

  const [selectedGeometryType, setSelectedGeometryType] = useState<GeometryType>("Point");

  const handleGeometryTypeSelect = (type: GeometryType) => {
    setSelectedGeometryType(type);
    setModalOpen(false);
    startAddMode(type);
  };

  // ✅ Обновляем GeoJSON после перемещения точки
  useEffect(() => {
    if (!parsedData || !movingFeature) return;

    const geometry = movingFeature.getGeometry();
    if (!geometry || geometry.getType() !== "Point") return;

    const movedId = movingFeature.getId();
    const format = new GeoJSON();
    const newGeom = format.writeGeometryObject(geometry, {
      featureProjection: "EPSG:3857",
      dataProjection: "EPSG:4326",
    });

    const updated = {
      ...parsedData,
      features: parsedData.features.map((f: any) => {
        const fid = f.properties?.id ?? f.id;
        if (String(fid) === String(movedId)) {
          return { ...f, geometry: newGeom };
        }
        return f;
      }),
    };

    setParsedData(updated);
  }, [parsedData, movingFeature]);

  return (
    <div className="import-container">
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

      <div className="map-container">
        <MapPreview
          geojsonData={parsedData || { type: "FeatureCollection", features: [] }}
          onAddGeometry={handleAddGeometry}
        />
      </div>

      <div className="table-wrapper">
        <h2 className="table-title">Таблица данных</h2>
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