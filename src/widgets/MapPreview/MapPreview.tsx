import { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";

export const MapPreview = ({ geojsonData }: { geojsonData: any }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const vectorLayerRef = useRef<VectorLayer | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const AZERBAIJAN_CENTER = [47.5769, 40.1431];
  const AZERBAIJAN_ZOOM = 7.5;
  const MIN_ZOOM = 7.5; // 🔹 Минимальный зум перед сменой файла
  const MAX_ZOOM = 18; // 🔹 Максимальное приближение

  useEffect(() => {
    if (!mapRef.current) {
      console.error("❌ `mapRef.current` не найден, карта не будет создана!");
      return;
    }

    console.log("📌 `mapRef.current` найден, инициализируем карту...");

    mapInstance.current = new Map({
      target: mapRef.current!,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat(AZERBAIJAN_CENTER),
        zoom: AZERBAIJAN_ZOOM,
      }),
    });

    setTimeout(() => {
      console.log("🔄 Принудительно обновляем размеры карты...");
      mapInstance.current?.updateSize();
    }, 500);

    setIsMapReady(true);

    return () => {
      mapInstance.current?.setTarget(undefined);
    };
  }, []);

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

        // 1️⃣ Проверяем, что `mapInstance.current` точно существует
        if (!mapInstance.current) return;

        // 2️⃣ Уменьшаем карту перед сменой файла
        mapInstance.current.getView()?.animate({ zoom: MIN_ZOOM, duration: 800 });

        // 3️⃣ После уменьшения через 900ms → приближаем к новому файлу
        setTimeout(() => {
          if (!mapInstance.current) return; // Проверяем снова перед изменением зума

          mapInstance.current.getView()?.fit(extent, {
            padding: [10, 10, 10, 10],
            maxZoom: MAX_ZOOM,
            duration: 1000, // Плавная анимация приближения
          });

          console.log("✅ Карта центрирована и приближена к загруженным данным");
        }, 900);
      } else {
        console.warn("⚠️ Невозможно центрировать карту: пустой `extent`.");
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