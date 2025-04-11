import { useEffect, useRef } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { fromLonLat, toLonLat } from "ol/proj";
import { AZERBAIJAN_CENTER, AZERBAIJAN_ZOOM, useMap } from "../../context/MapContext";
import { useSelectedFeature } from "../../context/SelectedFeatureContext";
import { useAddMode } from "../../context/AddModeContext";
import Feature from "ol/Feature";
import { Geometry } from "ol/geom";
import Draw from "ol/interaction/Draw";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style";

interface MapPreviewProps {
  geojsonData: any;
  onAddGeometry?: (coordinates: any) => void;
}

export const MapPreview: React.FC<MapPreviewProps> = ({ geojsonData, onAddGeometry }) => {
  const { mapRef, isMapReady, mapInstance } = useMap();
  const { selectedFeature, setSelectedFeature } = useSelectedFeature();
  const { isAdding, selectedType, cancelAddMode } = useAddMode();

  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const drawRef = useRef<Draw | null>(null);

  useEffect(() => {
    if (!isMapReady || !mapInstance.current) return;

    const map = mapInstance.current;

    // Очистка карты
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

      // Удаляем предыдущие векторные слои
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
        map.un("click", handleClick);
      };
    } catch (error) {
      console.error("❌ Ошибка загрузки GeoJSON:", error);
    }
  }, [geojsonData, isMapReady, selectedFeature]);

  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !vectorSourceRef.current) return;

    const map = mapInstance.current;

    // Удаляем предыдущий draw
    if (drawRef.current) {
      map.removeInteraction(drawRef.current);
      drawRef.current = null;
    }

    if (isAdding && selectedType) {
      const draw = new Draw({
        source: vectorSourceRef.current,
        type: selectedType,
      });

      draw.on("drawend", (e) => {
        const geometry = e.feature.getGeometry() as any;
        const type = geometry?.getType();

        if (!geometry || type !== selectedType) {
          console.warn("❌ Геометрия не создана или тип не совпадает");
          return;
        }

        const coords = geometry.getCoordinates();

        const convertCoords = (coord: any): any =>
          typeof coord[0] === "number" ? toLonLat(coord) : coord.map(convertCoords);

        const transformed = convertCoords(coords);

        console.log("🆕 Добавлена геометрия:", transformed);

        onAddGeometry?.(transformed);
        cancelAddMode();
      });

      map.addInteraction(draw);
      drawRef.current = draw;
    }

    return () => {
      if (drawRef.current) {
        mapInstance.current?.removeInteraction(drawRef.current);
        drawRef.current = null;
      }
    };
  }, [isAdding, selectedType, isMapReady]);

  return <div ref={mapRef} className="map-container" />;
};