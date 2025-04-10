import { useEffect, useRef } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { fromLonLat, toLonLat } from "ol/proj";
import { AZERBAIJAN_CENTER, AZERBAIJAN_ZOOM, useMap } from "../../context/MapContext";
import { useSelectedFeature } from "../../context/SelectedFeatureContext";
import Feature from "ol/Feature";
import { Geometry } from "ol/geom";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style";

interface MapPreviewProps {
  geojsonData: any;
  onAddFeature?: (lonLat: [number, number]) => void;
  addMode?: boolean;
}

export const MapPreview: React.FC<MapPreviewProps> = ({ geojsonData, onAddFeature, addMode }) => {
  const { mapRef, isMapReady, mapInstance } = useMap();
  const { selectedFeature, setSelectedFeature } = useSelectedFeature();
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);

  useEffect(() => {
    if (!isMapReady || !mapInstance.current) return;

    const map = mapInstance.current;

    // 🔄 Очистка карты при отсутствии данных
    if (!geojsonData || !geojsonData.features?.length) {
      if (vectorLayerRef.current) {
        map.removeLayer(vectorLayerRef.current);
        vectorLayerRef.current = null;
      }

      map.getView().animate({
        center: fromLonLat(AZERBAIJAN_CENTER),
        zoom: AZERBAIJAN_ZOOM,
        duration: 800,
      });
      return;
    }

    console.log("📥 Загружаем данные на карту...", geojsonData);

    try {
      const features = new GeoJSON().readFeatures(geojsonData, {
        featureProjection: "EPSG:3857",
      });

      features.forEach((feature, index) => {
        const rawId = feature.get("id") ?? index + 1;
        feature.setId(String(rawId));
      });

      vectorSourceRef.current = new VectorSource({ features });

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

      vectorLayerRef.current = new VectorLayer({
        source: vectorSourceRef.current,
        style: (feature) =>
          selectedFeature && String(feature.getId()) === String(selectedFeature.getId())
            ? selectedStyle
            : defaultStyle,
      });

      map.getLayers().forEach((layer) => {
        if (layer instanceof VectorLayer) {
          map.removeLayer(layer);
        }
      });

      map.addLayer(vectorLayerRef.current);

      const extent = vectorSourceRef.current.getExtent();
      if (extent && extent[0] !== Infinity) {
        map.getView().fit(extent, {
          padding: [20, 20, 20, 20],
          maxZoom: 18,
          duration: 1000,
        });
      }

      const handleClick = (event: any) => {
        const coordinate = event.coordinate;

        if (addMode && onAddFeature) {
          const lonLat = toLonLat(coordinate);
          console.log("🆕 Добавление новой точки по клику:", lonLat);
          onAddFeature([lonLat[0], lonLat[1]]);
          return;
        }

        let clickedFeature: Feature<Geometry> | null = null;

        map.forEachFeatureAtPixel(
          event.pixel,
          (featureLike) => {
            if (featureLike instanceof Feature) {
              clickedFeature = featureLike;
              return true;
            }
          },
          { hitTolerance: 10 }
        );

        if (clickedFeature) {
          setSelectedFeature(clickedFeature);
        } else {
          setSelectedFeature(null);
        }
      };

      map.on("click", handleClick);

      return () => {
        map.un("click", handleClick); // 🧼 Чистим обработчик при размонтировании
      };
    } catch (error) {
      console.error("❌ Ошибка загрузки GeoJSON:", error);
    }
  }, [geojsonData, isMapReady, selectedFeature, addMode, onAddFeature]);

  return <div ref={mapRef} className="map-container" />;
};