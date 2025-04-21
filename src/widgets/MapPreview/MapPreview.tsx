// src/widgets/MapPreview/MapPreview.tsx
import React, { useEffect, useRef } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { fromLonLat, toLonLat } from "ol/proj";
import { AZERBAIJAN_CENTER, AZERBAIJAN_ZOOM, useMap } from "../../context/MapContext";
import { useSelectedFeature } from "../../context/SelectedFeatureContext";
import { useAddMode } from "../../context/AddModeContext";
import { useMoveMode } from "../../context/MoveModeContext";
import Feature from "ol/Feature";
import { MoveTooltip } from "../../features/MoveTooltip/MoveTooltip";
import { Geometry } from "ol/geom";
import Draw from "ol/interaction/Draw";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style";

interface MapPreviewProps {
  geojsonData: any;
  onAddGeometry?: (coordinates: any) => void;
  onMoveFeature?: (id: string, coords: [number, number]) => void;
}

export const MapPreview: React.FC<MapPreviewProps> = ({
  geojsonData,
  onAddGeometry,
  onMoveFeature,
}) => {
  const { mapRef, isMapReady, mapInstance } = useMap();
  const { selectedFeature, setSelectedFeature } = useSelectedFeature();
  const { isAdding, selectedType, cancelAddMode } = useAddMode();
  const { isMoving, movingFeature, finishMoveMode } = useMoveMode();

  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const drawRef = useRef<Draw | null>(null);

  useEffect(() => {
    if (!isMapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    // если данных нет — сброс
    if (!geojsonData?.features?.length) {
      vectorLayerRef.current && map.removeLayer(vectorLayerRef.current);
      vectorLayerRef.current = null;
      map.getView().animate({
        center: fromLonLat(AZERBAIJAN_CENTER),
        zoom: AZERBAIJAN_ZOOM,
        duration: 800,
      });
      return;
    }

    // читаем GeoJSON
    const features = new GeoJSON().readFeatures(geojsonData, {
      featureProjection: "EPSG:3857",
    });
    features.forEach((f, i) => f.setId(String(f.get("id") ?? i + 1)));
    vectorSourceRef.current = new VectorSource({ features });

    // стили
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

    // добавляем слой
    vectorLayerRef.current = new VectorLayer({
      source: vectorSourceRef.current,
      style: feat =>
        selectedFeature && String(feat.getId()) === String(selectedFeature.getId())
          ? selectedStyle
          : defaultStyle,
    });
    // удаляем предыдущие
    map.getLayers().forEach(l => {
      if (l instanceof VectorLayer) map.removeLayer(l);
    });
    map.addLayer(vectorLayerRef.current);

    // подгон по extent
    const ext = vectorSourceRef.current.getExtent();
    if (ext && ext[0] !== Infinity) {
      map.getView().fit(ext, {
        padding: [20, 20, 20, 20],
        maxZoom: 18,
        duration: 1000,
      });
    }

    // клик: либо перемещение, либо выбор
    const handleClick = (evt: any) => {
      const pixel = evt.pixel;
      const coord = map.getCoordinateFromPixel(pixel);

      if (isMoving && movingFeature) {
        // 📍 сначала обновляем саму OL-геометрию
        finishMoveMode(coord);
        // затем колбэк в ImportPage, который делает setParsedData + зум
        const id = String(movingFeature.getId());
        const lonlat = toLonLat(coord) as [number, number];
        onMoveFeature?.(id, lonlat);
        return;
      }

      let clicked: Feature<Geometry> | null = null;
      map.forEachFeatureAtPixel(pixel, f => {
        if (f instanceof Feature) {
          clicked = f;
          return true;
        }
      }, { hitTolerance: 10 });

      if (clicked) setSelectedFeature(clicked);
      else setSelectedFeature(null);
    };

    map.on("click", handleClick);
    return () => void map.un("click", handleClick);
  }, [geojsonData, isMapReady, selectedFeature, isMoving]);

  // рисование новых фич
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !vectorSourceRef.current) return;
    const map = mapInstance.current;
    if (drawRef.current) {
      map.removeInteraction(drawRef.current);
      drawRef.current = null;
    }
    if (isAdding && selectedType) {
      const draw = new Draw({
        source: vectorSourceRef.current,
        type: selectedType,
      });
      draw.on("drawend", e => {
        const geom = e.feature.getGeometry() as any;
        if (!geom || geom.getType() !== selectedType) return;
        const coords = geom.getCoordinates();
        const convert = (c: any): any =>
          typeof c[0] === "number" ? toLonLat(c) : c.map(convert);
        const transformed = convert(coords);
        onAddGeometry?.(transformed);
        cancelAddMode();
      });
      map.addInteraction(draw);
      drawRef.current = draw;
    }
    return () => {
      if (drawRef.current) mapInstance.current?.removeInteraction(drawRef.current);
    };
  }, [isAdding, selectedType, isMapReady]);

  return (
    <>
      <div ref={mapRef} className="map-container" />
      {isMoving && <MoveTooltip />}
    </>
  );
};