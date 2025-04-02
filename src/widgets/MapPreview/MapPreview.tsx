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

    if (!geojsonData || !geojsonData.features?.length) {
      console.log("🗑 Очищаем карту, сбрасываем на Азербайджан...");
      if (vectorLayerRef.current) {
        mapInstance.current.removeLayer(vectorLayerRef.current);
        vectorLayerRef.current = null;
      }
      mapInstance.current.getView()?.animate({
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
        feature.setId(rawId); // ✅ Устанавливаем id для корректной идентификации
      });

      const vectorSource = new Vector({ features });

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

      const extent = vectorSource.getExtent();
      if (extent && extent[0] !== Infinity) {
        mapInstance.current.getView().fit(extent, {
          padding: [20, 20, 20, 20],
          maxZoom: 18,
          duration: 1000,
        });
      }

      mapInstance.current.on("click", (event) => {
        let clickedFeature: Feature<Geometry> | null = null;

        mapInstance.current?.forEachFeatureAtPixel(
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
      });
    } catch (error) {
      console.error("❌ Ошибка загрузки GeoJSON:", error);
    }
  }, [geojsonData, isMapReady, selectedFeature]);

  return <div ref={mapRef} className="map-container" />;
};