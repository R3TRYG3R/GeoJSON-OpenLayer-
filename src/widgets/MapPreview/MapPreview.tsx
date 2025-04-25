// src/widgets/MapPreview/MapPreview.tsx
import React, { useEffect, useRef } from "react";
import Draw from "ol/interaction/Draw";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { fromLonLat, toLonLat } from "ol/proj";
import { AZERBAIJAN_CENTER, AZERBAIJAN_ZOOM, useMap } from "../../context/MapContext";
import { useSelectedFeature } from "../../context/SelectedFeatureContext";
import { useAddMode } from "../../context/AddModeContext";
import { useMoveMode } from "../../context/MoveModeContext";
import Feature from "ol/Feature";
import { Geometry, Point, LineString, Polygon, MultiLineString, MultiPolygon } from "ol/geom";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style";
import { MoveTooltip } from "../../features/MoveTooltip/MoveTooltip";

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
  const { mapRef, mapInstance, isMapReady } = useMap();
  const { selectedFeature, setSelectedFeature } = useSelectedFeature();
  const { isAdding, selectedType, cancelAddMode } = useAddMode();
  const { isMoving, movingFeature, finishMoveMode } = useMoveMode();

  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const drawRef = useRef<Draw | null>(null);

  // Рендерим GeoJSON-фичи и клики
  useEffect(() => {
    if (!isMapReady || !mapInstance.current) return;
    const map = mapInstance.current;

    // Удаляем старый векторный слой
    if (vectorLayerRef.current) {
      map.removeLayer(vectorLayerRef.current);
      vectorLayerRef.current = null;
    }

    // Если нет данных — центрируем на Азербайджан
    if (!geojsonData?.features?.length) {
      map.getView().animate({
        center: fromLonLat(AZERBAIJAN_CENTER),
        zoom: AZERBAIJAN_ZOOM,
        duration: 500,
      });
      return;
    }

    // Читаем фичи из GeoJSON
    const features = new GeoJSON().readFeatures(geojsonData, {
      featureProjection: "EPSG:3857",
    });
    features.forEach((f, i) => f.setId(String(f.get("id") ?? i + 1)));

    const source = new VectorSource({ features });
    vectorSourceRef.current = source;

    // Стили
    const defaultStyle = new Style({
      stroke: new Stroke({ color: "blue", width: 2 }),
      fill: new Fill({ color: "rgba(0,0,255,0.3)" }),
      image: new CircleStyle({ radius: 6, fill: new Fill({ color: "blue" }) }),
    });
    const selectedStyle = new Style({
      stroke: new Stroke({ color: "red", width: 3 }),
      fill: new Fill({ color: "rgba(255,0,0,0.3)" }),
      image: new CircleStyle({ radius: 6, fill: new Fill({ color: "red" }) }),
    });

    // Новый слой
    const layer = new VectorLayer({
      source,
      style: (feat) =>
        selectedFeature && String(feat.getId()) === String(selectedFeature.getId())
          ? selectedStyle
          : defaultStyle,
    });
    vectorLayerRef.current = layer;
    map.addLayer(layer);

    // Fit к extent
    const extent = source.getExtent();
    if (extent && extent[0] !== Infinity) {
      map.getView().fit(extent, {
        padding: [20, 20, 20, 20],
        maxZoom: 18,
        duration: 800,
      });
    }

    // Обработчик клика
    const handleClick = (evt: any) => {
      const pixel = evt.pixel;
      const coord = map.getCoordinateFromPixel(pixel);

      if (isMoving && movingFeature) {
        finishMoveMode(coord);
        const lonlat = toLonLat(coord) as [number, number];
        onMoveFeature?.(String(movingFeature.getId()), lonlat);
        return;
      }

      let clicked: Feature<Geometry> | null = null;
      map.forEachFeatureAtPixel(
        pixel,
        (feat) => {
          clicked = feat as Feature<Geometry>;
          return true;
        },
        { hitTolerance: 8 }
      );
      setSelectedFeature(clicked);
    };

    map.on("click", handleClick);

    return () => {
      map.un("click", handleClick);
      if (vectorLayerRef.current) {
        map.removeLayer(vectorLayerRef.current);
        vectorLayerRef.current = null;
      }
    };
  }, [geojsonData, isMapReady, selectedFeature, isMoving]);

  // Draw-интеракция для добавления новых объектов
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !vectorSourceRef.current) return;
    const map = mapInstance.current;

    // Снимаем старую Draw-интеракцию
    if (drawRef.current) {
      map.removeInteraction(drawRef.current);
      drawRef.current = null;
    }

    if (isAdding && selectedType) {
      const draw = new Draw({ source: vectorSourceRef.current, type: selectedType });
      draw.on("drawend", (e) => {
        const geom = e.feature.getGeometry();
        if (!geom || geom.getType() !== selectedType) {
          cancelAddMode();
          return;
        }

        // Получаем «сырные» координаты в зависимости от типа геометрии
        let rawCoords: any;
        switch (selectedType) {
          case "Point":
            rawCoords = (geom as Point).getCoordinates();
            break;
          case "LineString":
            rawCoords = (geom as LineString).getCoordinates();
            break;
          case "Polygon":
            rawCoords = (geom as Polygon).getCoordinates();
            break;
          case "MultiLineString":
            rawCoords = (geom as MultiLineString).getCoordinates();
            break;
          case "MultiPolygon":
            rawCoords = (geom as MultiPolygon).getCoordinates();
            break;
          default:
            rawCoords = [];
        }

        // Рекурсивно конвертим в lon/lat
        const convert = (c: any): any =>
          Array.isArray(c[0]) ? c.map(convert) : toLonLat(c);
        const lonlat = convert(rawCoords);

        onAddGeometry?.(lonlat);
        cancelAddMode();
      });

      map.addInteraction(draw);
      drawRef.current = draw;
    }

    // чистка
    return () => {
      if (drawRef.current) {
        map.removeInteraction(drawRef.current);
        drawRef.current = null;
      }
    };
  }, [isMapReady, isAdding, selectedType]);

  return (
    <>
      <div ref={mapRef} className="map-container" />
      {isMoving && <MoveTooltip />}
    </>
  );
};