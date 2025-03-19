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
    const [minX, minY, maxX, maxY] = extent;
    const extentSize = Math.max(maxX - minX, maxY - minY); // Размер объекта
    const featureCenter = [(minX + maxX) / 2, (minY + maxY) / 2]; // Центр объекта

    console.log("📏 Размер объекта:", extentSize);

    let targetZoom = mapInstance.current.getView().getZoom() || 10; // Текущий зум
    const padding = [70, 70, 70, 70];

    if (geometry.getType() === "Point") {
      targetZoom = 14; // Ближе для точек
    } else if (geometry.getType() === "Polygon" || geometry.getType() === "LineString") {
      if (extentSize < 500) {
        targetZoom = 16; // Маленькие полигоны и линии приближаем
      } else if (extentSize > 5000) {
        // Огромные полигоны **НЕ** меняем масштаб, просто центрируем
        console.log("🛑 Полигон слишком большой, просто центрируем!");
        mapInstance.current.getView().animate({
          center: featureCenter,
          duration: 800,
        });
        return;
      } else {
        targetZoom = Math.min(targetZoom, 10); // Для средних размеров ограничиваем отдаление
      }
    }

    mapInstance.current.getView().fit(extent, {
      padding,
      maxZoom: targetZoom,
      duration: 800,
    });

    console.log(`🔍 Приближаем объект типа ${geometry.getType()}, зум: ${targetZoom}`);
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
    throw new Error("MapProvider!!!");
  }
  return context;
};