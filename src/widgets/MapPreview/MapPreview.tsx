import { useEffect, useRef } from "react";
import VectorLayer from "ol/layer/Vector";
import Vector from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { fromLonLat } from "ol/proj";
import { AZERBAIJAN_CENTER, AZERBAIJAN_ZOOM, useMap } from "../../context/MapContext";
import { useSelectedFeature } from "../../context/SelectedFeatureContext"; // Контекст выделенного объекта
import Feature from "ol/Feature";
import { Geometry } from "ol/geom";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style";

export const MapPreview = ({ geojsonData }: { geojsonData: any }) => {
  const { mapRef, isMapReady, mapInstance } = useMap();
  const { setSelectedFeature } = useSelectedFeature();
  const vectorLayerRef = useRef<VectorLayer | null>(null);
  const vectorSourceRef = useRef<Vector | null>(null);

  useEffect(() => {
    if (!isMapReady || !mapInstance.current) return;

    if (!geojsonData || !geojsonData.features?.length) {
      console.log("🗑 Очищаем карту, сбрасываем на Азербайджан...");
      if (vectorLayerRef.current) {
        mapInstance.current.removeLayer(vectorLayerRef.current);
        vectorLayerRef.current = null;
      }
      mapInstance.current?.getView()?.animate({
        center: fromLonLat(AZERBAIJAN_CENTER),
        zoom: AZERBAIJAN_ZOOM,
        duration: 800,
      });
      return;
    }

    console.log("📥 Загружаем данные на карту...", geojsonData);

    try {
      // ✅ Принудительно добавляем ID, если его нет
      const features = new GeoJSON().readFeatures(geojsonData, {
        featureProjection: "EPSG:3857",
      });

      features.forEach((feature, index) => {
        if (!feature.getId()) {
          feature.setId(index + 1); // Устанавливаем уникальный ID
        }
      });

      const vectorSource = new Vector({
        features,
      });

      // ✅ Создаем стили для точек и полигонов
      const pointStyle = new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: "blue" }), // Cиний цвет для точек
          stroke: new Stroke({ color: "white", width: 2 }), // Белый контур
        }),
      });

      const polygonStyle = new Style({
        stroke: new Stroke({
          color: "blue", // Синий контур для полигонов
          width: 2,
        }),
        fill: new Fill({
          color: "rgba(0, 0, 255, 0.3)", // Полупрозрачная заливка
        }),
      });

      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: (feature) =>
          feature.getGeometry()?.getType() === "Point" ? pointStyle : polygonStyle, // Условие для разных типов геометрии
      });

      if (vectorLayerRef.current) {
        mapInstance.current.removeLayer(vectorLayerRef.current);
        console.log("🗑 Удалён предыдущий слой с полигонами");
      }

      mapInstance.current.addLayer(vectorLayer);
      vectorLayerRef.current = vectorLayer;
      vectorSourceRef.current = vectorSource;

      // ✅ Добавляем приближение к загруженным данным
      const extent = vectorSource.getExtent();
      if (extent && extent[0] !== Infinity) {
        console.log("🔄 Центрируем карту на данных...");
        mapInstance.current.getView()?.fit(extent, {
          padding: [20, 20, 20, 20],
          maxZoom: 18,
          duration: 1000,
        });
      } else {
        console.warn("⚠️ Невозможно центрировать карту: пустой `extent`.");
      }

      // ✅ Добавляем обработчик кликов по полигонам и точкам
      mapInstance.current.on("click", (event) => {
        let selectedFeature: Feature<Geometry> | null = null;

        mapInstance.current?.forEachFeatureAtPixel(event.pixel, (featureLike) => {
          if (featureLike instanceof Feature) {
            selectedFeature = featureLike as Feature<Geometry>;
            return true; // Прекращаем поиск после первого найденного объекта
          }
        }, { hitTolerance: 10 }); // ✅ Увеличиваем чувствительность клика

        if (selectedFeature) {
          console.log("✅ Выбран объект:", selectedFeature);
          setSelectedFeature(selectedFeature); // ✅ Обновляем выделенный объект
        } else {
          console.log("🗑 Объект не выбран");
          setSelectedFeature(null);
        }
      });

    } catch (error) {
      console.error("❌ Ошибка загрузки GeoJSON:", error);
    }
  }, [geojsonData, isMapReady]);

  return (
    <div
      ref={mapRef}
      className="w-full h-96 border border-gray-600 rounded-lg bg-gray-200"
      style={{ minHeight: "500px", width: "100%" }}
    />
  );
};