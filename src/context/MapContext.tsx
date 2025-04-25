// src/context/MapContext.tsx
import {
  createContext,
  useContext,
  useRef,
  MutableRefObject,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import { OSM } from "ol/source";
import { fromLonLat } from "ol/proj";
import type Feature from "ol/Feature";
import type { Geometry } from "ol/geom";

interface MapContextType {
  mapRef: MutableRefObject<HTMLDivElement | null>;
  mapInstance: MutableRefObject<Map | null>;
  isMapReady: boolean;
  zoomToFeature: (feature: Feature<Geometry>) => void;
}

export const AZERBAIJAN_CENTER: [number, number] = [47.5769, 40.1431];
export const AZERBAIJAN_ZOOM = 7.0;

const MapContext = createContext<MapContextType | null>(null);

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;

      // Инициализируем карту ровно один раз, когда контейнер получил ненулевые размеры
      if (!mapInstance.current && width > 0 && height > 0) {
        console.log(
          `📏 Инициализация карты при размере: ${Math.round(width)}×${Math.round(
            height
          )}`
        );
        mapInstance.current = new Map({
          target: mapRef.current!,
          layers: [
            new TileLayer({
              source: new OSM({ attributions: [] }),
            }),
          ],
          view: new View({
            center: fromLonLat(AZERBAIJAN_CENTER),
            zoom: AZERBAIJAN_ZOOM,
          }),
          controls: [],
        });
        setIsMapReady(true);
      }

      // При любом изменении размера контейнера обновляем карту
      mapInstance.current?.updateSize();
    });

    resizeObserver.observe(mapRef.current!);

    return () => {
      resizeObserver.disconnect();
      mapInstance.current?.setTarget(undefined);
    };
  }, []);

  const zoomToFeature = (feature: Feature<Geometry>) => {
    const map = mapInstance.current;
    if (!map) return;

    const geom = feature.getGeometry();
    if (!geom) return;

    const extent = geom.getExtent();
    if (!extent || extent.some((v) => !isFinite(v))) return;

    map.getView().fit(extent, {
      padding: [50, 50, 50, 50],
      maxZoom: 16,
      duration: 800,
    });
  };

  return (
    <MapContext.Provider
      value={{ mapRef, mapInstance, isMapReady, zoomToFeature }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMap = (): MapContextType => {
  const ctx = useContext(MapContext);
  if (!ctx) {
    throw new Error("MapProvider должен оборачивать ваше приложение!");
  }
  return ctx;
};