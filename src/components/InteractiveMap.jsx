import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Map, { Source, Layer, Popup, Marker } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ArrowLeft, Route, Activity, Radio } from 'lucide-react';
import styles from './InteractiveMap.module.css';

// HARDCODED ORS API KEY
const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjQ5MzlkMmFjOTZhOTQ5YTQ4ZTc0NTg4OGYxYjFmYWY1IiwiaCI6Im11cm11cjY0In0=";

// Carto Positron (Clean, colorless basemap)
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

// ZEYTINBURNU REGION CONFIGURATION
const ZEYTINBURNU_CENTER = {
  longitude: 28.9050, 
  latitude: 40.9900,
  zoom: 13.5
};

const ASSEMBLY_POINT = { 
  name: 'Zeytinburnu Millet Bahçesi', 
  coordinates: [28.906340, 40.995191] 
};

// Zeytinburnu Millet Bahçesi Polygon Geometry
const MILLET_BAHCESI_COORDS = [
  [28.904, 40.994],
  [28.908, 40.994],
  [28.908, 40.996],
  [28.904, 40.996],
  [28.904, 40.994]
];

const MILLET_BAHCESI_POLYGON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [MILLET_BAHCESI_COORDS]
      }
    }
  ]
};

// Merkezefendi Parkı Polygon Geometry
const MERKEZEFENDI_COORDS = [
  [28.912, 41.014],
  [28.916, 41.014],
  [28.916, 41.016],
  [28.912, 41.016],
  [28.912, 41.014]
];

const MERKEZEFENDI_POLYGON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [MERKEZEFENDI_COORDS]
      }
    }
  ]
};

// Yedikule Hisarı Polygon Geometry
const YEDIKULE_COORDS = [
  [28.9220, 40.9925],
  [28.9225, 40.9940],
  [28.9240, 40.9945],
  [28.9250, 40.9930],
  [28.9235, 40.9915],
  [28.9220, 40.9925]
];

const YEDIKULE_POLYGON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [YEDIKULE_COORDS]
      }
    }
  ]
};

// Local Mesh Network Mock Data (Zeytinburnu)
const INITIAL_MESH_NODES = [
  { id: 'yedikule', name: 'Yedikule Hisarı', coords: [28.9233, 40.9930], status: 'online', type: 'assembly' },
  { id: 'millet', name: 'Millet Bahçesi', coords: [28.906340, 40.995191], status: 'online', type: 'assembly' },
  { id: 'merkezefendi', name: 'Merkezefendi', coords: [28.914, 41.015], status: 'online', type: 'assembly' },
  { id: 'gateway', name: 'Fiber Ağ Geçidi', coords: [28.915, 41.020], status: 'online', type: 'gateway' },
  { id: 'r1', name: 'Röle 1', coords: [28.900, 40.998], status: 'online', type: 'relay' },
  { id: 'r2', name: 'Röle 2', coords: [28.910, 41.000], status: 'online', type: 'relay' },
  { id: 'r3', name: 'Röle 3', coords: [28.905, 41.006], status: 'online', type: 'relay' },
  { id: 'r4', name: 'Röle 4', coords: [28.916, 41.008], status: 'online', type: 'relay' },
  { id: 'r5', name: 'Röle 5', coords: [28.920, 41.010], status: 'offline', type: 'relay' },
  { id: 'r_y1', name: 'Röle 6', coords: [28.912, 40.994], status: 'online', type: 'relay' },
  { id: 'r_y2', name: 'Röle 7', coords: [28.918, 40.993], status: 'online', type: 'relay' },
  { id: 'r_y3', name: 'Röle 8', coords: [28.915, 40.997], status: 'online', type: 'relay' },
];

const MESH_LINKS_BASE = [
  ['yedikule', 'r_y2'],
  ['yedikule', 'r_y3'],
  ['r_y2', 'r_y1'],
  ['r_y3', 'r_y1'],
  ['r_y3', 'millet'],
  ['r_y1', 'millet'],
  ['millet', 'r1'],
  ['millet', 'r2'],
  ['r1', 'r3'],
  ['r2', 'r3'],
  ['r2', 'r4'],
  ['r3', 'r4'],
  ['r3', 'merkezefendi'],
  ['r4', 'merkezefendi'],
  ['r4', 'r5'],
  ['r5', 'merkezefendi'],
  ['merkezefendi', 'gateway']
];

const FIBER_BACKBONE = {
  type: 'FeatureCollection',
  features: [
    { 
      type: 'Feature', 
      geometry: { 
        type: 'LineString', 
        coordinates: [
          [28.885, 40.995], // Merter
          [28.895, 41.002], // Cevizlibağ
          [28.915, 41.020], // Gateway Node
          [28.925, 41.028], // Topkapı direction
          [28.935, 41.035]
        ] 
      }
    }
  ]
};

const MEDICAL_FACILITIES = [
  { id: 'h1', name: 'Yedikule Göğüs Hastalıkları Hastanesi', coordinates: [28.9180, 40.9950] },
  { id: 'h2', name: 'Balıklı Rum Hastanesi', coordinates: [28.9130, 40.9930] },
  { id: 'h3', name: 'Zeytinburnu Devlet Hastanesi', coordinates: [28.9040, 40.9880] },
];

// Zeytinburnu Polygon Geometry
const ZEYTINBURNU_COORDS = [
  [28.890, 40.983],
  [28.928, 40.985],
  [28.932, 41.015],
  [28.915, 41.025],
  [28.895, 41.000],
  [28.890, 40.983]
];

// Boundary for Zeytinburnu
const ZEYTINBURNU_POLYGON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [ZEYTINBURNU_COORDS]
      }
    }
  ]
};

// Helper to create a 20x20m virtual box exactly at the clicked coordinate
const createVirtualBuilding = (lng, lat) => {
  const dLng = 0.00015;
  const dLat = 0.00015;
  return {
    type: 'Polygon',
    coordinates: [[
      [lng - dLng, lat - dLat],
      [lng + dLng, lat - dLat],
      [lng + dLng, lat + dLat],
      [lng - dLng, lat + dLat],
      [lng - dLng, lat - dLat]
    ]]
  };
};

const InteractiveMap = ({ onBack }) => {
  const [viewState, setViewState] = useState({
    longitude: ZEYTINBURNU_CENTER.longitude, 
    latitude: ZEYTINBURNU_CENTER.latitude,
    zoom: ZEYTINBURNU_CENTER.zoom,
    pitch: 0, 
    bearing: 0
  });

  const [reports, setReports] = useState({});
  const [hoverInfo, setHoverInfo] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);

  // Routing State
  const [routeMode, setRouteMode] = useState('idle'); 
  const [activeNearestMode, setActiveNearestMode] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [isRouting, setIsRouting] = useState(false);
  
  // LoRa State
  const [showLoRa, setShowLoRa] = useState(false);
  const [meshNodes, setMeshNodes] = useState(INITIAL_MESH_NODES);
  
  const meshLinksGeoJSON = useMemo(() => {
    const features = MESH_LINKS_BASE.map(([id1, id2]) => {
      const n1 = meshNodes.find(n => n.id === id1);
      const n2 = meshNodes.find(n => n.id === id2);
      if (!n1 || !n2) return null;
      const status = (n1.status === 'online' && n2.status === 'online') ? 'active' : 'offline';
      return {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [n1.coords, n2.coords] },
        properties: { status }
      };
    }).filter(f => f !== null);
    return { type: 'FeatureCollection', features };
  }, [meshNodes]);

  const activePathCoords = useMemo(() => {
    const adj = {};
    meshNodes.filter(n => n.status === 'online').forEach(n => adj[n.id] = []);
    
    MESH_LINKS_BASE.forEach(([u, v]) => {
      if (adj[u] && adj[v]) {
        adj[u].push(v);
        adj[v].push(u);
      }
    });

    if (!adj['yedikule'] || !adj['gateway']) return null;

    const queue = [['yedikule']];
    const visited = new Set(['yedikule']);

    while (queue.length > 0) {
      const path = queue.shift();
      const node = path[path.length - 1];
      if (node === 'gateway') {
        return path.map(id => meshNodes.find(n => n.id === id).coords);
      }
      for (const neighbor of adj[node] || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }
    return null;
  }, [meshNodes]);

  const [pingData, setPingData] = useState(null);
  const requestRef = useRef();

  useEffect(() => {
    if (!activePathCoords || !showLoRa) {
      setPingData(null);
      return;
    }

    const segments = [];
    let totalLength = 0;
    for (let i = 0; i < activePathCoords.length - 1; i++) {
      const p1 = activePathCoords[i];
      const p2 = activePathCoords[i+1];
      const dist = Math.sqrt(Math.pow(p2[0]-p1[0], 2) + Math.pow(p2[1]-p1[1], 2));
      segments.push({ p1, p2, dist });
      totalLength += dist;
    }

    if (totalLength === 0) return;

    let startTime = performance.now();
    const duration = 2000;

    const animate = (time) => {
      let progress = ((time - startTime) % duration) / duration;
      let targetDist = progress * totalLength;

      let currentDist = 0;
      let pos = activePathCoords[0];
      
      for (const seg of segments) {
        if (targetDist <= currentDist + seg.dist) {
          const segProgress = (targetDist - currentDist) / seg.dist;
          pos = [
            seg.p1[0] + (seg.p2[0] - seg.p1[0]) * segProgress,
            seg.p1[1] + (seg.p2[1] - seg.p1[1]) * segProgress
          ];
          break;
        }
        currentDist += seg.dist;
      }

      setPingData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: pos } }]
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [activePathCoords, showLoRa]);

  const toggleNodeStatus = (id) => {
    setMeshNodes(prev => prev.map(n => {
      if (n.id === id && n.type === 'relay') {
        return { ...n, status: n.status === 'online' ? 'offline' : 'online' };
      }
      return n;
    }));
  };

  // Normal left click is for manual routing
  const onClick = useCallback(event => {
    // If routing mode is active, handle manual point selection
    if (routeMode === 'selectStart') {
      setStartPoint([event.lngLat.lng, event.lngLat.lat]);
      setRouteMode('selectEnd');
      return;
    }
    if (routeMode === 'selectEnd') {
      setEndPoint([event.lngLat.lng, event.lngLat.lat]);
      setRouteMode('idle');
      return;
    }
    
    // Close building popup if clicking on map
    setSelectedFeature(null);
  }, [routeMode]);

  // Right click places a virtual building box exactly where clicked
  const onContextMenu = useCallback(event => {
    event.preventDefault(); // Prevent browser context menu
    
    // Create an individual virtual box so we don't select the whole aggregated block
    const virtualGeometry = createVirtualBuilding(event.lngLat.lng, event.lngLat.lat);
    
    setSelectedFeature({
      id: `virtual-${Date.now()}`, 
      properties: { render_height: 30, render_min_height: 0 },
      geometry: virtualGeometry,
      lngLat: event.lngLat
    });
  }, []);

  const onHover = useCallback(event => {
    if (routeMode !== 'idle') {
      if (event.target.getCanvas) event.target.getCanvas().style.cursor = 'crosshair';
      setHoverInfo(null);
      return;
    }

    setHoverInfo({
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat
    });
    if (event.target.getCanvas) event.target.getCanvas().style.cursor = 'context-menu'; // Hint right-click
  }, [routeMode]);

  const handleReportSubmit = (e) => {
    e.preventDefault();
    const status = e.target.status.value;
    const notes = e.target.notes.value;
    
    setReports(prev => ({
      ...prev,
      [selectedFeature.id]: { 
        status, 
        notes,
        geometry: selectedFeature.geometry,
        properties: selectedFeature.properties
      }
    }));
    
    setSelectedFeature(null);
  };

  // Helper to fetch a route from OpenRouteService API with exclusions
  const fetchRoute = async (startCoords, endCoords) => {
      const polygons = [];
      Object.values(reports).forEach(report => {
         if (report.status === 'yol_kapali' || report.status === 'yikildi') {
             if (report.geometry && report.geometry.type === 'Polygon') {
                 polygons.push(report.geometry.coordinates);
             }
         }
      });
      
      const body = {
          coordinates: [startCoords, endCoords]
      };
      
      if (polygons.length > 0) {
          body.options = {
              avoid_polygons: {
                  type: 'MultiPolygon',
                  coordinates: polygons
              }
          };
      }

      const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
          method: 'POST',
          headers: {
              'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
              'Content-Type': 'application/json',
              'Authorization': ORS_API_KEY
          },
          body: JSON.stringify(body)
      });
      
      if (!res.ok) {
          console.error("API Error Response:", await res.text());
          throw new Error("ORS API Error");
      }
      return await res.json();
  };

  // Main routing effect
  useEffect(() => {
    if (activeNearestMode) {
      const findBest = async () => {
         setIsRouting(true);
         try {
           const promises = MEDICAL_FACILITIES.map(async (fac) => {
               const data = await fetchRoute(ASSEMBLY_POINT.coordinates, fac.coordinates);
               return { fac, data };
           });
           const results = await Promise.all(promises);
           let bestRoute = null;
           let bestDuration = Infinity;
           
           results.forEach(res => {
              if (res.data && res.data.features && res.data.features.length > 0) {
                 const feature = res.data.features[0];
                 const duration = feature.properties?.summary?.duration || Infinity;
                 if (duration < bestDuration) {
                    bestDuration = duration;
                    bestRoute = { geometry: feature.geometry, facility: res.fac };
                 }
              }
           });
           
           if (bestRoute) {
              setStartPoint(ASSEMBLY_POINT.coordinates);
              setEndPoint(bestRoute.facility.coordinates);
              setRouteData(bestRoute.geometry);
           } else {
              console.warn("No valid route found to any hospital!");
              setRouteData(null);
           }
         } catch (err) {
           console.error("Routing error:", err);
         }
         setIsRouting(false);
      };
      findBest();

    } else if (startPoint && endPoint) {
      const findManual = async () => {
         setIsRouting(true);
         try {
           const data = await fetchRoute(startPoint, endPoint);
           if (data.features && data.features.length > 0) {
              setRouteData(data.features[0].geometry);
           } else {
              setRouteData(null);
           }
         } catch (err) {
           console.error("Routing error:", err);
         }
         setIsRouting(false);
      };
      findManual();
    }
  }, [startPoint, endPoint, activeNearestMode, reports]);

  const onMapLoad = useCallback((e) => {
    const map = e.target;
    const layers = map.getStyle().layers;

    // 1. Extract Building Source from Carto
    let buildingSource = null;
    let buildingSourceLayer = null;
    for (let i = 0; i < layers.length; i++) {
      if (layers[i].id.includes('building')) {
        buildingSource = layers[i].source;
        buildingSourceLayer = layers[i]['source-layer'];
        break;
      }
    }

    // 2. Add 3D Buildings Back with a FIXED Height!
    // Carto doesn't provide building heights, so we simulate 3D by giving all buildings a 15m height
    if (buildingSource) {
      map.addLayer({
        'id': '3d-buildings',
        'source': buildingSource,
        'source-layer': buildingSourceLayer,
        'type': 'fill-extrusion',
        'minzoom': 14,
        'paint': {
          'fill-extrusion-color': '#e0e0e0', // Professional clean gray
          'fill-extrusion-height': 15, // Fixed 15 meters for all buildings to make it 3D without Mapbox key
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.6
        }
      });
    }
  }, []);

  const reportedBuildingsGeoJSON = useMemo(() => {
    const features = Object.entries(reports).map(([id, report]) => {
      let color = '#ffeb3b';
      if (report.status === 'yikildi') color = '#f44336';
      if (report.status === 'agir_hasarli') color = '#ff9800';
      if (report.status === 'yol_kapali') color = '#e91e63';

      return {
        type: 'Feature',
        geometry: report.geometry,
        properties: {
          ...report.properties,
          color,
          height: report.properties.render_height || 20,
          min_height: report.properties.render_min_height || 0,
          status: report.status
        }
      };
    });
    
    return { type: 'FeatureCollection', features };
  }, [reports]);

  return (
    <div className={styles.mapContainer}>
      <div className={styles.topBar}>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <button className={styles.backButton} onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <h2 className={styles.title}>3D Hasar ve Yol Bildirim Haritası (Zeytinburnu)</h2>
        </div>
        
        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
          <button 
            onClick={() => setShowLoRa(!showLoRa)}
            style={{
              padding: '6px 12px', 
              background: showLoRa ? '#00bcd4' : 'transparent', 
              color: showLoRa ? 'white' : '#00bcd4', 
              border: '1px solid #00bcd4',
              borderRadius: '4px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            title="LoRaWAN İletişim Ağını Göster"
          >
            <Radio size={16} />
            Mesh Ağı
          </button>

          <button 
            onClick={() => {
              setRouteMode('idle');
              setActiveNearestMode(true);
            }}
            style={{
              padding: '6px 12px', 
              background: '#4caf50', 
              color: 'white', 
              borderRadius: '4px', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Toplanma alanından en yakın ve güvenli hastaneyi bulur."
          >
            <Activity size={16} />
            {isRouting && activeNearestMode ? 'Hesaplanıyor...' : 'En Yakın Hastane'}
          </button>

          <button 
            onClick={() => {
              setActiveNearestMode(false);
              if (routeMode === 'idle') {
                setRouteMode('selectStart');
                setStartPoint(null); setEndPoint(null); setRouteData(null);
              } else {
                setRouteMode('idle');
              }
            }}
            style={{
              padding: '6px 12px', 
              background: routeMode !== 'idle' ? '#f44336' : '#2196f3', 
              color: 'white', 
              borderRadius: '4px', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Route size={16} />
            {routeMode === 'idle' ? 'Serbest Rota' : 'İptal'}
          </button>
        </div>
      </div>

      <div className={styles.mapWrapper}>
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle={MAP_STYLE}
          mapLib={maplibregl}
          interactiveLayerIds={['3d-buildings']}
          onClick={onClick}
          onContextMenu={onContextMenu}
          onMouseMove={onHover}
          onLoad={onMapLoad}
          style={{ width: '100%', height: '100%' }}
          pitchWithRotate={false}
          dragRotate={false}
        >
          {/* Zeytinburnu Boundary Line */}
          <Source id="zeytinburnu-boundary" type="geojson" data={ZEYTINBURNU_POLYGON}>
             <Layer
                id="zeytinburnu-fill"
                type="fill"
                paint={{
                   'fill-color': '#9c27b0',
                   'fill-opacity': 0.1
                }}
             />
             <Layer
                id="zeytinburnu-line"
                type="line"
                paint={{
                   'line-color': '#9c27b0',
                   'line-width': 3,
                   'line-dasharray': [2, 2]
                }}
             />
          </Source>

          {/* Millet Bahçesi Area */}
          <Source id="millet-bahcesi" type="geojson" data={MILLET_BAHCESI_POLYGON}>
             <Layer
                id="millet-bahcesi-fill"
                type="fill"
                paint={{
                   'fill-color': '#4caf50',
                   'fill-opacity': 0.25
                }}
             />
             <Layer
                id="millet-bahcesi-line"
                type="line"
                paint={{
                   'line-color': '#388e3c',
                   'line-width': 2,
                   'line-dasharray': [2, 1]
                }}
             />
          </Source>

          {/* Merkezefendi Area */}
          <Source id="merkezefendi-parki" type="geojson" data={MERKEZEFENDI_POLYGON}>
             <Layer
                id="merkezefendi-fill"
                type="fill"
                paint={{
                   'fill-color': '#4caf50',
                   'fill-opacity': 0.25
                }}
             />
             <Layer
                id="merkezefendi-line"
                type="line"
                paint={{
                   'line-color': '#388e3c',
                   'line-width': 2,
                   'line-dasharray': [2, 1]
                }}
             />
          </Source>

          {/* Yedikule Hisarı Area */}
          <Source id="yedikule-hisari" type="geojson" data={YEDIKULE_POLYGON}>
             <Layer
                id="yedikule-fill"
                type="fill"
                paint={{
                   'fill-color': '#4caf50',
                   'fill-opacity': 0.25
                }}
             />
             <Layer
                id="yedikule-line"
                type="line"
                paint={{
                   'line-color': '#388e3c',
                   'line-width': 2,
                   'line-dasharray': [2, 1]
                }}
             />
          </Source>

          {/* Route Layer */}
          {routeData && (
            <Source id="route-source" type="geojson" data={{ type: 'Feature', geometry: routeData }}>
              <Layer 
                id="route-layer-shadow" 
                type="line" 
                paint={{
                  'line-color': '#000',
                  'line-width': 10,
                  'line-opacity': 0.4,
                  'line-blur': 4
                }} 
              />
              <Layer 
                id="route-layer" 
                type="line" 
                paint={{
                  'line-color': '#2196f3',
                  'line-width': 6,
                  'line-opacity': 1
                }} 
              />
            </Source>
          )}

          {/* LoRa Mesh Network Layer */}
          {showLoRa && (
            <>
              {/* Fiber Backbone Layer */}
              <Source id="fiber-backbone" type="geojson" data={FIBER_BACKBONE}>
                <Layer
                  id="fiber-glow"
                  type="line"
                  paint={{
                    'line-color': '#ffeb3b',
                    'line-width': 10,
                    'line-blur': 6,
                    'line-opacity': 0.8
                  }}
                />
                <Layer
                  id="fiber-core"
                  type="line"
                  paint={{
                    'line-color': '#ffffff',
                    'line-width': 3,
                    'line-opacity': 1
                  }}
                />
              </Source>

              <Source id="lora-links" type="geojson" data={meshLinksGeoJSON}>
                <Layer
                  id="lora-links-glow"
                  type="line"
                  paint={{
                    'line-color': ['match', ['get', 'status'], 'active', '#00e5ff', '#ff3d00'],
                    'line-width': 6,
                    'line-blur': 4,
                    'line-opacity': ['match', ['get', 'status'], 'active', 0.6, 0.2]
                  }}
                />
                <Layer
                  id="lora-links-core"
                  type="line"
                  paint={{
                    'line-color': ['match', ['get', 'status'], 'active', '#e0ffff', '#ffab91'],
                    'line-width': 2,
                    'line-dasharray': [3, 2],
                    'line-opacity': ['match', ['get', 'status'], 'active', 0.9, 0.4]
                  }}
                />
              </Source>

              {pingData && (
                <Source id="ping-source" type="geojson" data={pingData}>
                  <Layer
                    id="ping-layer-glow"
                    type="circle"
                    paint={{
                      'circle-color': '#00e5ff',
                      'circle-radius': 12,
                      'circle-blur': 1,
                      'circle-opacity': 0.8
                    }}
                  />
                  <Layer
                    id="ping-layer-core"
                    type="circle"
                    paint={{
                      'circle-color': '#ffffff',
                      'circle-radius': 5
                    }}
                  />
                </Source>
              )}
            </>
          )}

          {/* Assembly Point Marker */}
          <Marker longitude={ASSEMBLY_POINT.coordinates[0]} latitude={ASSEMBLY_POINT.coordinates[1]} anchor="bottom">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {viewState.zoom >= 13.5 && (
                <div style={{ background: '#4caf50', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px', whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  Toplanma Alanı
                </div>
              )}
              <div style={{ background: '#4caf50', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
            </div>
          </Marker>

          {/* Medical Facilities Markers */}
          {MEDICAL_FACILITIES.map(facility => (
            <Marker key={facility.id} longitude={facility.coordinates[0]} latitude={facility.coordinates[1]} anchor="center">
              <div 
                style={{ background: 'white', border: '3px solid #e91e63', color: '#e91e63', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} 
                title={facility.name}
              >
                {viewState.zoom >= 13.5 ? 'H' : ''}
              </div>
            </Marker>
          ))}

          {/* LoRa & Fiber Nodes Markers */}
          {showLoRa && meshNodes.map(node => (
            <Marker key={node.id} longitude={node.coords[0]} latitude={node.coords[1]} anchor="center">
              <div 
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: node.type === 'relay' ? 'pointer' : 'default' }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeStatus(node.id);
                }}
              >
                <div 
                  className={node.type === 'gateway' ? styles.fiberNode : (node.status === 'online' ? styles.loraNode : styles.loraNodeOffline)} 
                  title={`Node (${node.status})`} 
                />
                {node.type !== 'relay' && viewState.zoom >= 13.5 && (
                  <div style={{ 
                    marginTop: '8px', 
                    background: 'rgba(0,0,0,0.8)', 
                    color: '#fff', 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '11px', 
                    whiteSpace: 'nowrap', 
                    border: node.type === 'gateway' ? '1px solid #ffeb3b' : '1px solid #00e5ff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    {node.name}
                  </div>
                )}
                {node.type === 'relay' && viewState.zoom >= 14 && (
                  <div style={{
                    marginTop: '4px',
                    background: 'rgba(0,0,0,0.6)',
                    color: node.status === 'online' ? '#00e5ff' : '#ff3d00',
                    padding: '2px 4px',
                    borderRadius: '2px',
                    fontSize: '9px',
                    whiteSpace: 'nowrap'
                  }}>
                    Röle • {node.status === 'online' ? 'Aktif' : 'Offline'}
                  </div>
                )}
              </div>
            </Marker>
          ))}

          {/* Start and End Markers (For manual routing) */}
          {startPoint && !activeNearestMode && (
            <Source id="start-marker" type="geojson" data={{ type: 'Feature', geometry: { type: 'Point', coordinates: startPoint }}}>
              <Layer id="start-circle-bg" type="circle" paint={{ 'circle-color': '#fff', 'circle-radius': 10 }} />
              <Layer id="start-circle" type="circle" paint={{ 'circle-color': '#4caf50', 'circle-radius': 8 }} />
            </Source>
          )}
          {endPoint && !activeNearestMode && (
            <Source id="end-marker" type="geojson" data={{ type: 'Feature', geometry: { type: 'Point', coordinates: endPoint }}}>
              <Layer id="end-circle-bg" type="circle" paint={{ 'circle-color': '#fff', 'circle-radius': 10 }} />
              <Layer id="end-circle" type="circle" paint={{ 'circle-color': '#f44336', 'circle-radius': 8 }} />
            </Source>
          )}

          {/* Overlay for Reported Buildings */}
          <Source id="reported-buildings" type="geojson" data={reportedBuildingsGeoJSON}>
            <Layer
              id="reported-buildings-layer"
              type="fill-extrusion"
              filter={['!=', 'status', 'yol_kapali']}
              paint={{
                'fill-extrusion-color': ['get', 'color'],
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'min_height'],
                'fill-extrusion-opacity': 0.9
              }}
            />
            <Layer
              id="reported-road-closed"
              type="symbol"
              filter={['==', 'status', 'yol_kapali']}
              layout={{
                'text-field': 'X',
                'text-size': 28,
                'text-allow-overlap': true
              }}
              paint={{
                'text-color': '#e91e63',
                'text-halo-color': '#ffffff',
                'text-halo-width': 2,
                'text-halo-blur': 1
              }}
            />
          </Source>

          {selectedFeature && (
            <Popup
              longitude={selectedFeature.lngLat.lng}
              latitude={selectedFeature.lngLat.lat}
              anchor="top"
              onClose={() => setSelectedFeature(null)}
              closeOnClick={false}
              className={styles.actionPopup}
            >
              <form onSubmit={handleReportSubmit} className={styles.popupForm}>
                <h3 style={{ color: '#000', marginBottom: '0.5rem', fontSize: '1rem', marginTop: 0 }}>Durum Bildir</h3>
                
                <label style={{ color: '#333', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Hasar Durumu</label>
                <select name="status" defaultValue="hasarli" className={styles.select} style={{width: '100%', padding: '6px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc'}}>
                  <option value="yikildi">Tamamen Yıkılmış (Kırmızı)</option>
                  <option value="agir_hasarli">Ağır Hasarlı (Turuncu)</option>
                  <option value="hasarli">Hasarlı (Sarı)</option>
                  <option value="yol_kapali">Yol Kapalı (Pembe)</option>
                </select>

                <label style={{ color: '#333', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Etiketler / Notlar</label>
                <textarea name="notes" rows="2" className={styles.textarea} placeholder="Örn: İçeride mahsur kalan var..." style={{width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px'}}></textarea>

                <button type="submit" className={styles.submitBtn} style={{width: '100%', padding: '8px', background: '#e91e63', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>
                  Kaydet & Rotayı Güncelle
                </button>
              </form>
            </Popup>
          )}
        </Map>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}><span className={styles.colorBox} style={{background: '#f44336'}}></span> Yıkılmış</div>
        <div className={styles.legendItem}><span className={styles.colorBox} style={{background: '#ff9800'}}></span> Ağır Hasarlı</div>
        <div className={styles.legendItem}><span className={styles.colorBox} style={{background: '#ffeb3b'}}></span> Hasarlı</div>
        <div className={styles.legendItem}><span style={{marginRight: '8px', fontSize: '16px'}}>❌</span> Yol Kapalı</div>
      </div>
    </div>
  );
};

export default InteractiveMap;
