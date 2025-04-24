import React, { useEffect, useRef, useState } from "react";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import { OSM } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Modify } from "ol/interaction";
import { Feature } from "ol";
import { Geometry, LineString, Polygon, MultiPolygon, MultiLineString, Point} from "ol/geom";
import { fromLonLat, toLonLat } from "ol/proj";
import { Fill, Stroke, Style, Circle as CircleStyle } from "ol/style";
import { CoordinatesList } from "../../shared/ui/CoordinatesList/CoordinatesList";

import "./EditGeometryMapModal.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  feature: Feature<Geometry>;
  allFeatures: Feature<Geometry>[];
  onSave: (updatedFeature: Feature<Geometry>) => void;
}

export const EditGeometryMapModal: React.FC<Props> = ({ isOpen, onClose, feature, allFeatures, onSave }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const editableSourceRef = useRef<VectorSource | null>(null);
  const highlightSourceRef = useRef<VectorSource | null>(null);

  const [coordsArray, setCoordsArray] = useState<[number, number][]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<boolean[]>([]);

  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    const editableStyle = new Style({
      fill: new Fill({ color: "rgba(255, 0, 0, 0.2)" }),
      stroke: new Stroke({ color: "red", width: 2 }),
      image: new CircleStyle({ radius: 6, fill: new Fill({ color: "red" }) }),
    });

    const backgroundStyle = new Style({
      fill: new Fill({ color: "rgba(0, 0, 255, 0.05)" }),
      stroke: new Stroke({ color: "blue", width: 1 }),
      image: new CircleStyle({ radius: 4, fill: new Fill({ color: "blue" }) }),
    });

    const highlightStyle = new Style({
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({ color: "yellow" }),
        stroke: new Stroke({ color: "orange", width: 2 }),
      }),
    });

    const clonedFeature = feature.clone();
    clonedFeature.setId(feature.getId());

    const editableSource = new VectorSource({ features: [clonedFeature] });
    editableSourceRef.current = editableSource;

    const editableLayer = new VectorLayer({ source: editableSource, style: editableStyle });

    const backgroundFeatures = allFeatures.filter(f => f.getId() !== feature.getId()).map(f => f.clone());
    const backgroundSource = new VectorSource({ features: backgroundFeatures });
    const backgroundLayer = new VectorLayer({ source: backgroundSource, style: backgroundStyle });

    const highlightSource = new VectorSource();
    const highlightLayer = new VectorLayer({ source: highlightSource, style: highlightStyle });
    highlightSourceRef.current = highlightSource;

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        backgroundLayer,
        editableLayer,
        highlightLayer
      ],
      view: new View({
        center: fromLonLat([47.5769, 40.1431]),
        zoom: 7,
      }),
      controls: [],
    });

    const extent = clonedFeature.getGeometry()?.getExtent();
    if (extent) map.getView().fit(extent, { padding: [20, 20, 20, 20], maxZoom: 16 });

    const modify = new Modify({ source: editableSource });
    map.addInteraction(modify);

    // Слушаем изменения геометрии
    clonedFeature.getGeometry()?.on('change', updateCoordsArray);

    // Первый раз загружаем координаты
    updateCoordsArray();

    mapInstance.current = map;

    return () => {
      map.setTarget(undefined);
      mapInstance.current = null;
    };
  }, [isOpen]);

  const flattenCoordinates = (coords: any): [number, number][] => {
    if (typeof coords[0][0] === "number") return coords;
    if (typeof coords[0][0][0] === "number") return coords[0];
    if (typeof coords[0][0][0][0] === "number") return coords[0][0];
    return [];
  };

  const updateCoordsArray = () => {
    const geometry = editableSourceRef.current?.getFeatures()[0].getGeometry();
    if (!geometry) return;

    const coordsRaw = (geometry as any).getCoordinates();
    const flatCoords = flattenCoordinates(coordsRaw);
    const lonLatCoords = flatCoords.map(c => toLonLat(c) as [number, number]);
    setCoordsArray(lonLatCoords);

    if (selectedIndex !== null) {
      highlightPoint(selectedIndex);
    }
  };

  const highlightPoint = (index: number) => {
    const coord = coordsArray[index];
    if (!coord || !highlightSourceRef.current) return;

    highlightSourceRef.current.clear();
    const pointFeature = new Feature(new Point(fromLonLat(coord)));
    highlightSourceRef.current.addFeature(pointFeature);
  };

  const handleSelectPoint = (index: number) => {
    if (selectedIndex === index) {
      setSelectedIndex(null);
      highlightSourceRef.current?.clear();
      const extent = editableSourceRef.current?.getFeatures()[0].getGeometry()?.getExtent();
      if (extent) mapInstance.current?.getView().fit(extent, { padding: [20, 20, 20, 20], maxZoom: 16 });
    } else {
      setSelectedIndex(index);
      highlightPoint(index);
      mapInstance.current?.getView().animate({
        center: fromLonLat(coordsArray[index]),
        zoom: 16,
        duration: 500,
      });
    }
  };

  const handleChangeCoordinate = (index: number, newCoord: [number, number]) => {
    const updatedCoords = [...coordsArray];
    updatedCoords[index] = newCoord;
    setCoordsArray(updatedCoords);

    const newErrors = updatedCoords.map(([lon, lat]) => 
      isNaN(lon) || isNaN(lat) || lon < -180 || lon > 180 || lat < -90 || lat > 90
    );
    setErrors(newErrors);

    const backCoords = updatedCoords.map(c => fromLonLat(c));

    const geomType = feature.getGeometry()?.getType();
    let newGeometry: Geometry | null = null;

    if (geomType === "LineString") newGeometry = new LineString(backCoords);
    if (geomType === "Polygon") newGeometry = new Polygon([backCoords]);
    if (geomType === "MultiPolygon") newGeometry = new MultiPolygon([[backCoords]]);
    if (geomType === "MultiLineString") newGeometry = new MultiLineString([backCoords]);

    if (newGeometry) editableSourceRef.current?.getFeatures()[0].setGeometry(newGeometry);
    highlightPoint(index);
  };

  const handleSave = () => {
    if (!editableSourceRef.current) return;
    const updated = editableSourceRef.current.getFeatures()[0];
    onSave(updated);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-window large horizontal">
        <h2>Редактирование геометрии</h2>
        <div className="horizontal-content">
          <CoordinatesList
            coordinates={coordsArray}
            selectedIndex={selectedIndex}
            onSelect={handleSelectPoint}
            onChange={handleChangeCoordinate}
            errors={errors}
          />
          <div ref={mapRef} className="geometry-edit-map" />
        </div>
        <div className="modal-buttons">
          <button onClick={handleSave} className="btn-save" disabled={errors.includes(true)}
          >💾 Сохранить</button>
          <button onClick={onClose} className="btn-cancel">Отмена</button>
        </div>
      </div>
    </div>
  );
};