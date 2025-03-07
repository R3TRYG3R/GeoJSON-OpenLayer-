import { useEffect, useRef, useState } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { fromLonLat } from "ol/proj";
import { AZERBAIJAN_CENTER, AZERBAIJAN_ZOOM, useMap } from "../../context/MapContext"; 

export const MapPreview = ({ geojsonData }: { geojsonData: any }) => {
  const { mapRef, isMapReady, mapInstance } = useMap(); // ✅ Получаем mapRef из контекста
  const vectorLayerRef = useRef<VectorLayer | null>(null);

  const MAX_ZOOM = 18;

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
      const vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(geojsonData, {
          featureProjection: "EPSG:3857",
        }),
      });

      const vectorLayer = new VectorLayer({
        source: vectorSource,
      });

      if (vectorLayerRef.current) {
        mapInstance.current.removeLayer(vectorLayerRef.current);
        console.log("🗑 Удалён предыдущий слой с полигонами");
      }

      mapInstance.current.addLayer(vectorLayer);
      vectorLayerRef.current = vectorLayer;

      const extent = vectorSource.getExtent();
      if (extent && extent[0] !== Infinity) {
        console.log("🔄 Добавляем анимацию смены файла...");
        mapInstance.current.getView()?.fit(extent, {
          padding: [10, 10, 10, 10],
          maxZoom: MAX_ZOOM,
          duration: 1000,
        });

        console.log("✅ Карта центрирована и приближена к загруженным данным");
      } else {
        console.warn("⚠️ Невозможно центрировать карту: пустой extent.");
      }
    } catch (error) {
      console.error("❌ Ошибка загрузки GeoJSON:", error);
    }
  }, [geojsonData, isMapReady]);

  return (
    <div
      ref={mapRef}
      className="w-full h-96 border border-gray-600 rounded-lg"
      style={{ backgroundColor: "lightgray", height: "100%", width: "100%" }}
    />
  );
};