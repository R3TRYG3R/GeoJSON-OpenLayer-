// 📁 context/MapContext.tsx

import { View, Map } from "ol";
import TileLayer from "ol/layer/Tile";
import { fromLonLat } from "ol/proj";
import { OSM } from "ol/source";
import { createContext, useContext, useRef, RefObject, useEffect, useState } from "react";
import { Geometry } from "ol/geom";
import { Feature } from "ol";

interface MapContextType {
  mapRef: RefObject<HTMLDivElement>;
  mapInstance: RefObject<Map | null>;
  isMapReady: boolean;
  zoomToFeature: (feature: Feature<Geometry>) => void;
}

export const AZERBAIJAN_CENTER = [47.5769, 40.1431];
export const AZERBAIJAN_ZOOM = 7.0;

const MapContext = createContext<MapContextType | null>(null);

export const MapProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null!);
  const mapInstance = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    console.log("📌 mapRef.current найден, инициализируем карту...");

    mapInstance.current = new Map({
      target: mapRef.current!,
      layers: [
        new TileLayer({
          source: new OSM({
            attributions: [],
          }),
        }),
      ],
      view: new View({
        center: fromLonLat(AZERBAIJAN_CENTER),
        zoom: AZERBAIJAN_ZOOM,
      }),
      controls: [],
    });

    setIsMapReady(true);

    return () => {
      mapInstance.current?.setTarget(undefined);
    };
  }, []);

  const zoomToFeature = (feature: Feature<Geometry>) => {
    if (!mapInstance.current) return;

    const geometry = feature.getGeometry();
    if (!geometry) return;

    const extent = geometry.getExtent();

    // 🛡️ Защита от пустой или некорректной геометрии
    if (!extent || extent.some((v) => !isFinite(v))) {
      console.warn("⚠️ Невозможно зумировать на пустую или некорректную геометрию:", geometry);
      return;
    }

    const type = geometry.getType();
    const [minX, minY, maxX, maxY] = extent;
    const extentSize = Math.max(maxX - minX, maxY - minY);
    const center = [(minX + maxX) / 2, (minY + maxY) / 2];

    let targetZoom = mapInstance.current.getView().getZoom() || 10;
    const padding = [70, 70, 70, 70];

    if (type === "Point") {
      targetZoom = 14;
    } else if (
      type === "Polygon" ||
      type === "LineString" ||
      type === "MultiPolygon" ||
      type === "MultiLineString"
    ) {
      if (extentSize < 500) {
        targetZoom = 16;
      } else if (extentSize > 50000) {
        mapInstance.current.getView().animate({
          center,
          duration: 800,
        });
        return;
      } else {
        targetZoom = Math.min(targetZoom, 10);
      }
    }

    mapInstance.current.getView().fit(extent, {
      padding,
      maxZoom: targetZoom,
      duration: 800,
    });

    console.log(`🔍 Приближаем объект типа ${type}, зум: ${targetZoom}`);
  };

  return (
    <MapContext.Provider value={{ mapRef, mapInstance, isMapReady, zoomToFeature }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("MapProvider должен быть обёрнут вокруг компонентов!");
  }
  return context;
};