import { useEffect, useRef } from "react";
import VectorLayer from "ol/layer/Vector";
import Vector from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { fromLonLat } from "ol/proj";
import { AZERBAIJAN_CENTER, AZERBAIJAN_ZOOM, useMap } from "../../context/MapContext";
import { useSelectedFeature } from "../../context/SelectedFeatureContext";
import Feature from "ol/Feature";
import { Geometry } from "ol/geom";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style";

interface MapPreviewProps {
  geojsonData: any;
}

export const MapPreview: React.FC<MapPreviewProps> = ({ geojsonData }) => {
  const { mapRef, isMapReady, mapInstance } = useMap();
  const { selectedFeature, setSelectedFeature } = useSelectedFeature();
  const vectorLayerRef = useRef<VectorLayer | null>(null);
  const vectorSourceRef = useRef<Vector | null>(null);

  useEffect(() => {
    if (!isMapReady || !mapInstance.current) return;

    // Если данных нет – очищаем карту и сбрасываем камеру
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

      const vectorSource = new Vector({ features });

      // ✅ Стили
      const defaultStyle = new Style({
        stroke: new Stroke({ color: "blue", width: 2 }),
        fill: new Fill({ color: "rgba(0, 0, 255, 0.3)" }),
        image: new CircleStyle({ radius: 6, fill: new Fill({ color: "blue" }) }),
      });

      const selectedStyle = new Style({
        stroke: new Stroke({ color: "red", width: 3 }),
        fill: new Fill({ color: "rgba(255, 0, 0, 0.3)" }),
        image: new CircleStyle({ radius: 6, fill: new Fill({ color: "red" }) }),
      });

      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: (feature) =>
          selectedFeature && feature.getId() === selectedFeature.getId() ? selectedStyle : defaultStyle,
      });

      if (vectorLayerRef.current) {
        mapInstance.current.removeLayer(vectorLayerRef.current);
        console.log("🗑 Удалён предыдущий слой с полигонами");
      }

      mapInstance.current.addLayer(vectorLayer);
      vectorLayerRef.current = vectorLayer;
      vectorSourceRef.current = vectorSource;

      // ✅ Центрируем карту
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

      // ✅ Обработчик клика по объекту
      mapInstance.current.on("click", (event) => {
        let clickedFeature: Feature<Geometry> | null = null;

        mapInstance.current?.forEachFeatureAtPixel(
          event.pixel,
          (featureLike) => {
            if (featureLike instanceof Feature) {
              clickedFeature = featureLike as Feature<Geometry>;
              return true;
            }
          },
          { hitTolerance: 10 }
        );

        if (clickedFeature) {
          console.log("✅ Выбран объект:", clickedFeature);
          setSelectedFeature(clickedFeature);
        } else {
          console.log("🗑 Объект не выбран");
          setSelectedFeature(null);
        }
      });
    } catch (error) {
      console.error("❌ Ошибка загрузки GeoJSON:", error);
    }
  }, [geojsonData, isMapReady, selectedFeature]);

  return (
    <div
      ref={mapRef}
      className="w-full h-96 border border-gray-600 rounded-lg bg-gray-200"
      style={{ minHeight: "500px", width: "100%" }}
    />
  );
};