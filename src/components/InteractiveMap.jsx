import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Map, { Source, Layer, Popup, Marker } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ArrowLeft, Route, Activity, ShieldAlert, CheckCircle, Server, Radio, HeartPulse, Package, Car, Footprints, Map as MapIcon } from 'lucide-react';
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

const ASSEMBLY_POINTS = [
  { id: 'ap1', name: 'Zeytinburnu Millet Bahçesi (Ana Kriz Merkezi)', coordinates: [28.9020, 40.9960], isMain: true },
  { id: 'ap2', name: 'Çırpıcı Şehir Parkı Geniş Alanı', coordinates: [28.8950, 40.9980] },
  { id: 'ap4', name: 'Merkezefendi Şehir Parkı', coordinates: [28.9130, 41.0060] },
];

const MEDICAL_FACILITIES = [
  { id: 'h1', name: 'Yedikule Göğüs Hastalıkları Hastanesi', coordinates: [28.9180, 40.9950] },
  { id: 'h2', name: 'Balıklı Rum Hastanesi', coordinates: [28.9130, 40.9930] },
  { id: 'h3', name: 'Zeytinburnu Devlet Hastanesi', coordinates: [28.9040, 40.9880] },
  { id: 'h4', name: 'Avrasya Hastanesi', coordinates: [28.8953, 41.0042] },
  { id: 'h5', name: 'Koç Üniversitesi Hastanesi', coordinates: [28.9069, 41.0125] },
  { id: 'h6', name: 'Surp Pırgiç Ermeni Hastanesi', coordinates: [28.9153, 40.9942] },
];

const HEALTH_CENTERS = [
  { id: 's1', name: 'Merkezefendi Aile Sağlığı Merkezi', coordinates: [28.9100, 41.0050] },
  { id: 's2', name: 'Sümer Mahallesi Sağlık Ocağı', coordinates: [28.8950, 40.9900] },
  { id: 's3', name: 'Beştelsiz Sağlık Ocağı', coordinates: [28.9000, 40.9980] },
  { id: 's4', name: 'Nuripaşa Aile Sağlığı Merkezi', coordinates: [28.9050, 40.9920] },
  { id: 's5', name: 'Çırpıcı Aile Sağlığı Merkezi', coordinates: [28.8960, 41.0020] },
];

const PHARMACIES = [
  { id: 'e1', name: 'Meydan Eczanesi (Zeytinburnu Bulvarı)', coordinates: [28.9045, 40.9905] },
  { id: 'e2', name: 'Şifa Eczanesi (Surp Pırgiç Yakını)', coordinates: [28.9140, 40.9950] },
  { id: 'e3', name: 'Avrasya Eczanesi (Avrasya Hast. Karşısı)', coordinates: [28.8940, 41.0035] },
  { id: 'e4', name: 'Umut Eczanesi (Göğüs Hastalıkları Yakını)', coordinates: [28.9175, 40.9960] },
];

const MESH_NODES = [
  // Çırpıcı (Sol)
  { id: 'm1', coordinates: [28.8950, 40.9980] },
  { id: 'm2', coordinates: [28.8965, 40.9995] },
  { id: 'm3', coordinates: [28.8955, 41.0010] },
  // Ortaya Doğru
  { id: 'm4', coordinates: [28.8980, 40.9970] },
  { id: 'm5', coordinates: [28.8995, 40.9985] },
  { id: 'm6', coordinates: [28.9005, 40.9950] },
  // Ana Kriz (Orta)
  { id: 'm7', coordinates: [28.9020, 40.9960] },
  { id: 'm8', coordinates: [28.9030, 40.9980] },
  { id: 'm9', coordinates: [28.9025, 41.0005] },
  { id: 'm10', coordinates: [28.9045, 40.9955] },
  // Sağa Doğru
  { id: 'm11', coordinates: [28.9065, 40.9975] },
  { id: 'm12', coordinates: [28.9080, 40.9995] },
  { id: 'm13', coordinates: [28.9070, 41.0020] },
  { id: 'm14', coordinates: [28.9095, 41.0040] },
  { id: 'm15', coordinates: [28.9110, 41.0015] },
  // Merkezefendi (Sağ)
  { id: 'm16', coordinates: [28.9130, 41.0060] }
];

// Her düğümün diğer TÜM düğümlere bağlı olduğunu gösteren Full Mesh Topolojisi
const MESH_EDGES = [];
for (let i = 0; i < MESH_NODES.length; i++) {
  for (let j = i + 1; j < MESH_NODES.length; j++) {
    MESH_EDGES.push([i, j]);
  }
}

const PING_PATH = [0, 3, 4, 6, 7, 11, 14, 15, 13, 12, 8, 4, 1]; // Zıplama rotası

const SPIDER_LINES = {
  type: 'FeatureCollection',
  features: MESH_EDGES.map(edge => ({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [MESH_NODES[edge[0]].coordinates, MESH_NODES[edge[1]].coordinates]
    }
  }))
};

const UPLINK_NODES = [
  { id: 'u0', coordinates: [28.8720, 41.0250] }, // Fiber Tap
  { id: 'u1', coordinates: [28.8760, 41.0200] },
  { id: 'u2', coordinates: [28.8820, 41.0180] },
  { id: 'u3', coordinates: [28.8800, 41.0120] },
  { id: 'u4', coordinates: [28.8880, 41.0080] },
  { id: 'u5', coordinates: [28.8850, 41.0030] },
  { id: 'u6', coordinates: [28.8920, 41.0020] },
  { id: 'u7', coordinates: [28.8950, 40.9980] }  // Zeytinburnu Çırpıcı
];

const UPLINK_EDGES = [];
for(let i=0; i<UPLINK_NODES.length; i++) {
   for(let j=i+1; j<UPLINK_NODES.length; j++) {
      if (Math.abs(i - j) <= 3) {
         UPLINK_EDGES.push([i, j]);
      }
   }
}

const UPLINK_LINE = {
  type: 'FeatureCollection',
  features: UPLINK_EDGES.map(edge => ({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [UPLINK_NODES[edge[0]].coordinates, UPLINK_NODES[edge[1]].coordinates]
    }
  }))
};

// Sultangazi (Sağ Fiber Ucu) ağı
const SULTAN_NODES = [
  { id: 's0', coordinates: [28.9050, 41.0600] }, // Right Fiber End
  { id: 's1', coordinates: [28.9000, 41.0660] },
  { id: 's2', coordinates: [28.8960, 41.0700] },
  { id: 's3', coordinates: [28.8930, 41.0740] },
  { id: 's4', coordinates: [28.8880, 41.0800] },
  { id: 's5', coordinates: [28.8840, 41.0850] },
  { id: 's6', coordinates: [28.8800, 41.0900] }  // Sultangazi Management Center
];

const SULTAN_EDGES = [];
for(let i=0; i<SULTAN_NODES.length; i++) {
   for(let j=i+1; j<SULTAN_NODES.length; j++) {
      if (Math.abs(i - j) <= 3) {
         SULTAN_EDGES.push([i, j]);
      }
   }
}

const SULTAN_LINE = {
  type: 'FeatureCollection',
  features: SULTAN_EDGES.map(edge => ({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [SULTAN_NODES[edge[0]].coordinates, SULTAN_NODES[edge[1]].coordinates]
    }
  }))
};

// Zeytinburnu & Tozkoparan Polygon Geometry
const ZEYTINBURNU_COORDS = [
  [28.8910, 40.9890], // Güney Batı / Bakırköy sınırı
  [28.9280, 40.9910], // Güney Doğu / Yedikule sınırı
  [28.9240, 41.0110], // Doğu / Topkapı E-5
  [28.9070, 41.0180], // Kuzey / Davutpaşa - YTÜ sınırı
  [28.8800, 41.0150], // Kuzey Batı / Tozkoparan & Güngören
  [28.8850, 41.0000], // Batı / Merter
  [28.8910, 40.9890]  // Döngüyü kapat
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

// Özel İletişim Hattı (Doğrusal Fiber Hat)
const METRO_FIBER_LINE = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: { name: 'Düz Fiber Hattı' },
    geometry: { type: 'LineString', coordinates: [
      [28.8450, 41.0020], // Bahçelievler
      [28.8720, 41.0250], // Güngören
      [28.8830, 41.0400], // Esenler
      [28.9050, 41.0600]  // Gaziosmanpaşa
    ]}
  }]
};
const MAINFRAME_COORD = [28.7890, 41.1060];

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

const InteractiveMap = ({ onBack, mode = 'building' }) => {
  const [pingIndex, setPingIndex] = useState(0);

  useEffect(() => {
    let interval;
    if (mode === 'mesh_view') {
      interval = setInterval(() => {
        setPingIndex(prev => (prev + 1) % PING_PATH.length);
      }, 300); // 300ms hizli data pingi
    }
    return () => clearInterval(interval);
  }, [mode]);

  const [viewState, setViewState] = useState({
    longitude: ZEYTINBURNU_CENTER.longitude, 
    latitude: ZEYTINBURNU_CENTER.latitude,
    zoom: ZEYTINBURNU_CENTER.zoom,
    pitch: 60, 
    bearing: -20
  });

  useEffect(() => {
    if (mode === 'mesh_view') {
      setViewState({
        longitude: 28.9040, 
        latitude: 41.0020,
        zoom: 14.1, // Genel agi gormek icin ayarlandi
        pitch: 0, 
        bearing: 0
      });
    } else {
      setViewState({
        longitude: ZEYTINBURNU_CENTER.longitude, 
        latitude: ZEYTINBURNU_CENTER.latitude,
        zoom: ZEYTINBURNU_CENTER.zoom,
        pitch: 60, 
        bearing: -20
      });
    }
  }, [mode]);

  const [reports, setReports] = useState(() => {
    // 1. Sayfa açıldığında verileri hafızadan (localStorage) yükle
    try {
      const saved = localStorage.getItem('disaster_reports');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // 2. Yeni bir rapor (bina yıkılması) girildiğinde bunu tarayıcı hafızasına kaydet
  useEffect(() => {
    localStorage.setItem('disaster_reports', JSON.stringify(reports));
  }, [reports]);

  // 3. Çoklu Kullanıcı Simülasyonu: Başka bir sekmeden/pencereden rapor girilirse bu ekranı da anında güncelle
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'disaster_reports' && e.newValue) {
        setReports(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const [formReports, setFormReports] = useState(() => {
    try {
      const saved = localStorage.getItem('form_reports');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [hoverInfo, setHoverInfo] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedAssembly, setSelectedAssembly] = useState(null);
  const [selectedFormReport, setSelectedFormReport] = useState(null);

  // Storage Sync for form_reports
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'form_reports' && e.newValue) {
        setFormReports(JSON.parse(e.newValue));
      } else if (!e.key) { // Force reload event
        try {
          const saved = localStorage.getItem('form_reports');
          if (saved) setFormReports(JSON.parse(saved));
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // AFAD/Kızılay API Simulasyon State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState(0);
  const [syncComplete, setSyncComplete] = useState(false);
  const [syncPayload, setSyncPayload] = useState(null);

  // Dynamic Scale: Harita yaklaştıkça veya uzaklaştıkça yazı/ikon boyutunu ayarlar
  const markerScale = viewState.zoom < 13 ? 0.6 : (viewState.zoom > 15.5 ? 0.75 : 0.9);

  // Routing State
  const [routeMode, setRouteMode] = useState('idle'); 
  const [activeNearestMode, setActiveNearestMode] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [isRouting, setIsRouting] = useState(false);
  const [transportMode, setTransportMode] = useState('cycling-road');
  const [showEmergencyRoads, setShowEmergencyRoads] = useState(false);
  const [showFiber, setShowFiber] = useState(false);

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
    
    // Close popups if clicking on empty map
    setSelectedFeature(null);
    setSelectedAssembly(null);
  }, [routeMode]);

  // Right click places a virtual building box exactly where clicked
  const onContextMenu = useCallback(event => {
    event.preventDefault(); 
    if (mode === 'supply_view') return; // Viewer modunda form açılamaz
    
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
    if (routeMode !== 'idle' || mode === 'supply_view') {
      if (event.target.getCanvas) event.target.getCanvas().style.cursor = mode === 'supply_view' ? 'grab' : 'crosshair';
      setHoverInfo(null);
      return;
    }

    setHoverInfo({
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat
    });
    // Sadece bina olan normal alanlarda sağ tık ipucu ver (toplanma alanlarında değil)
    if (event.target.getCanvas) event.target.getCanvas().style.cursor = 'context-menu'; 
  }, [routeMode, mode]);

  const handleReportSubmit = (e) => {
    e.preventDefault();

    if (mode === 'medical' || mode === 'supply') {
       const data = {
          id: selectedFeature.id,
          type: mode === 'medical' ? 'MEDICAL' : 'SUPPLY',
          coordinate: [selectedFeature.lngLat.lng, selectedFeature.lngLat.lat],
          data: {
             kisiSayisi: e.target.kisiSayisi.value,
             notlar: e.target.notlar.value,
             lokasyon: `Harita Pin (${selectedFeature.lngLat.lat.toFixed(4)}, ${selectedFeature.lngLat.lng.toFixed(4)})`
          }
       };
       if (mode === 'supply') {
          data.data.ihtiyaclar = {
             su: e.target.su?.checked,
             gida: e.target.gida?.checked,
             cadir: e.target.cadir?.checked,
             bebek_bezi: e.target.bebek?.checked,
             isatici: e.target.isatici?.checked
          };
       }
       if (mode === 'medical') {
          data.data.ihtiyacTuru = e.target.ihtiyacTuru.value;
       }

       const existing = JSON.parse(localStorage.getItem('form_reports') || '[]');
       const newReports = [...existing, { ...data, timestamp: new Date().toISOString() }];
       localStorage.setItem('form_reports', JSON.stringify(newReports));
       setFormReports(newReports);
       window.dispatchEvent(new Event('storage'));
       setSelectedFeature(null);
       return;
    }

    // Default (Building/Road Mode)
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

  const handleAssemblySubmit = (e) => {
    e.preventDefault();
    const status = e.target.status.value;
    const notes = e.target.notes.value;
    
    // Raporları toplanma alanı ID'si ile kaydet
    setReports(prev => ({
      ...prev,
      [selectedAssembly.id]: {
        isAssembly: true,
        status,
        notes,
        name: selectedAssembly.name,
        properties: { color: status === 'acil_ihtiyac' ? '#f44336' : (status === 'cadir_kuruluyor' ? '#ff9800' : '#4caf50') }
      }
    }));
    
    setSelectedAssembly(null);
  };

  const handleAFADSync = () => {
    // Sahadaki toplanmış tüm raporları API formatına dönüştürüyoruz
    const payload = {
      timestamp: new Date().toISOString(),
      intranet_uplink: "METRO_FIBER_GW_ZEYTINBURNU_01",
      encryption: "AES-256",
      critical_reports: Object.entries(reports).map(([id, r]) => ({
        id: id,
        type: r.isAssembly ? "ASSEMBLY_POINT_LOGISTICS" : "BUILDING_DAMAGE_REPORT",
        status_code: r.status,
        emergency_notes: r.notes || "Belirtilmemiş",
      }))
    };
    
    setSyncPayload(JSON.stringify(payload, null, 2));
    console.log(">>> [SECURE_INTRANET] OUTGOING AFAD PAYLOAD: ", payload);

    setIsSyncing(true);
    setSyncStep(1); // Metro Fiber Bağlantısı Kuruluyor...

    setTimeout(() => setSyncStep(2), 1500); // Özel Ağ Üzerinden Aktif...
    setTimeout(() => setSyncStep(3), 3000); // Sunucu Onayı...
    setTimeout(() => {
      setIsSyncing(false);
      setSyncComplete(true);
      setTimeout(() => setSyncComplete(false), 5000); // 5 saniye sonra kapat
    }, 4500); 
  };

  // Helper to fetch a route from OpenRouteService API with exclusions
  const fetchRoute = async (startCoords, endCoords, mode = 'driving-car') => {
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

      const res = await fetch(`https://api.openrouteservice.org/v2/directions/${mode}/geojson`, {
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
               const data = await fetchRoute(ASSEMBLY_POINTS[0].coordinates, fac.coordinates, transportMode);
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
              setStartPoint(ASSEMBLY_POINTS[0].coordinates);
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
           const data = await fetchRoute(startPoint, endPoint, transportMode);
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
  }, [startPoint, endPoint, activeNearestMode, reports, transportMode]);

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
      let color = '#ffeb3b'; // Default (hasarli)
      let customHeight = 15.2; // Standart bina boyundan (15m) çok az yüksek ki üst üste binmede (z-fighting) titreme yapmasın

      if (report.status === 'yikildi') {
        color = '#f44336';
        customHeight = 15.2; // Yıkılan binalar haritada daha belirgin görünsün diye tekrar eski standart yüksekliğine getirildi.
      } else if (report.status === 'agir_hasarli') {
        color = '#ff9800';
        customHeight = 15.2;
      } else if (report.status === 'yol_kapali') {
        color = '#e91e63';
        customHeight = 0.5; // Yol asfalt boyundadır, havaya kalkmasın
      }

      return {
        type: 'Feature',
        geometry: report.geometry,
        properties: {
          ...report.properties,
          color,
          height: customHeight,
          min_height: report.properties.render_min_height || 0
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
          <h2 className={styles.title}>
            {mode === 'mesh_view' ? '📡 Mesh Ağı Canlı Veri Akış Topolojisi' : '3D Hasar ve Yol Bildirim Haritası (Zeytinburnu & Tozkoparan)'}
          </h2>
        </div>
        
        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
          {mode !== 'mesh_view' && (
            <>
          <button 
            onClick={handleAFADSync}
            style={{
              padding: '6px 12px', 
              background: '#e53935', 
              color: 'white', 
              borderRadius: '4px', 
              border: '2px solid white', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
            title="Verileri güvenli kapalı ağ üzerinden ilgili kriz merkezine gönder."
          >
            <ShieldAlert size={16} />
            AFAD / AKOM'a Aktar
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
            onClick={() => setShowEmergencyRoads(!showEmergencyRoads)}
            style={{
              padding: '6px 12px', 
              background: showEmergencyRoads ? '#f59e0b' : '#333', 
              color: 'white', 
              borderRadius: '4px', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Dışarıdan gelen acil yardım tırları için ana ulaşım arterlerini göster/gizle"
          >
            <MapIcon size={16} />
            Acil Yollar
          </button>

          <button 
            onClick={() => {
               setShowFiber(!showFiber);
               if (!showFiber) {
                  // Focus the map so both Zeytinburnu and Başakşehir are visible roughly
                  setViewState(prev => ({ ...prev, longitude: 28.8450, latitude: 41.0500, zoom: 11.5 }));
               }
            }}
            style={{
              padding: '6px 12px', 
              background: showFiber ? '#facc15' : '#333', 
              color: showFiber ? '#000' : 'white', 
              borderRadius: '4px', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Başakşehir'den Zeytinburnu güvenli noktasına uzanan veri akış ağını göster/gizle"
          >
            <Server size={16} color={showFiber ? '#000' : 'white'} />
            Fiber Ağ
          </button>

          {/* Transport Mode Toggles */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '4px', padding: '2px', marginLeft: '4px' }}>
            <button
               onClick={() => setTransportMode('cycling-road')}
               style={{
                  background: transportMode === 'cycling-road' ? '#fff' : 'transparent',
                  color: transportMode === 'cycling-road' ? '#2196f3' : '#64748b',
                  border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer',
                  boxShadow: transportMode === 'cycling-road' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex', alignItems: 'center'
               }}
               title="Afet Aracı Rotası (Ters Yön İhlali Yapabilir)"
            >
               <Car size={16} />
            </button>
            <button
               onClick={() => setTransportMode('foot-walking')}
               style={{
                  background: transportMode === 'foot-walking' ? '#fff' : 'transparent',
                  color: transportMode === 'foot-walking' ? '#2196f3' : '#64748b',
                  border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer',
                  boxShadow: transportMode === 'foot-walking' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex', alignItems: 'center'
               }}
               title="Yaya Rotası Algoritması"
            >
               <Footprints size={16} />
            </button>
          </div>

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
            </>
          )}
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
        >
          {/* Zeytinburnu Boundary Line */}
          <Source id="zeytinburnu-boundary" type="geojson" data={ZEYTINBURNU_POLYGON}>
             <Layer
                id="zeytinburnu-fill"
                type="fill"
                paint={{
                   'fill-color': '#7e57c2', // Hafif, kafa karıştırmayan bir mor
                   'fill-opacity': 0.15
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

          {/* 1. Derece Acil Ulaşım Yolları (Dış Yardım Koridorları) Gerçek Veri */}
          {showEmergencyRoads && (
             <Source id="emergency-roads" type="geojson" data="/acil_yollar.geojson">
                <Layer
                   id="emergency-roads-bg"
                   type="line"
                   paint={{
                      'line-color': '#f59e0b',
                      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 14, 6],
                      'line-opacity': 0.4
                   }}
                />
                <Layer
                   id="emergency-roads-line"
                   type="line"
                   paint={{
                      'line-color': '#d97706',
                      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 14, 3],
                      'line-dasharray': [2, 1]
                   }}
                />
             </Source>
          )}

          {/* Toplanma Alanları Yeşil Bölge (Safe Zone) Halesi */}
          <Source id="assembly-safe-zones" type="geojson" data={{
              type: 'FeatureCollection',
              features: ASSEMBLY_POINTS.map(ap => ({
                  type: 'Feature', geometry: { type: 'Point', coordinates: ap.coordinates }
              }))
          }}>
              <Layer
                  id="assembly-halo-fill"
                  type="circle"
                  paint={{
                      'circle-color': '#4caf50',
                      'circle-opacity': 0.15,
                      'circle-stroke-width': 2,
                      'circle-stroke-color': '#4caf50',
                      'circle-stroke-opacity': 0.6,
                      'circle-radius': [
                          'interpolate',
                          ['exponential', 2],
                          ['zoom'],
                          12, 10,
                          14, 40,
                          16, 120,
                          18, 300
                      ]
                  }}
              />
          </Source>

          {/* Özel Fiber Ağı ve Bahçeşehir Sunucusu */}
          {(showFiber || mode === 'mesh_view') && (
             <Source id="fiber-line" type="geojson" data={METRO_FIBER_LINE}>
                <Layer
                   id="fiber-bg"
                   type="line"
                   paint={{
                      'line-color': '#facc15',
                      'line-width': 6,
                      'line-opacity': 0.9
                   }}
                />
                <Layer
                   id="fiber-glow"
                   type="line"
                   paint={{
                      'line-color': '#000',
                      'line-width': 2,
                      'line-dasharray': [2, 2]
                   }}
                />
             </Source>
          )}

           {/* (AFAD Ana Bilgisayar Marker'ı İptal Edildi - Sadece Fiber Ağ Görünüyor) */}

          {/* Mesh Network Layers */}
          {mode === 'mesh_view' && (
             <>
               <Source id="mesh-line" type="geojson" data={SPIDER_LINES}>
                  <Layer
                     id="mesh-bg"
                     type="line"
                     paint={{
                        'line-color': '#69f0ae',
                        'line-width': 1.5,
                        'line-opacity': 0.35,
                        'line-dasharray': [2, 4]
                     }}
                  />
               </Source>
               <Source id="uplink-line" type="geojson" data={UPLINK_LINE}>
                  <Layer
                     id="uplink-bg"
                     type="line"
                     paint={{
                        'line-color': '#00e676',
                        'line-width': 1.5,
                        'line-opacity': 0.4,
                        'line-dasharray': [2, 3]
                     }}
                  />
               </Source>
               <Source id="sultan-line" type="geojson" data={SULTAN_LINE}>
                  <Layer
                     id="sultan-bg"
                     type="line"
                     paint={{
                        'line-color': '#00e676',
                        'line-width': 1.5,
                        'line-opacity': 0.4,
                        'line-dasharray': [2, 3]
                     }}
                  />
               </Source>
             </>
          )}

          {/* HTML Overlay for Nodes and Pings to allow scaling and CSS Animation */}
          {mode === 'mesh_view' && MESH_NODES.map((n, i) => {
             const isPing = PING_PATH[pingIndex] === i;
             return (
               <Marker key={`mesh-node-${i}`} longitude={n.coordinates[0]} latitude={n.coordinates[1]} anchor="center">
                  <div className={styles.meshNodeContainer}>
                    <div className={styles.meshNodeGlow} />
                    {isPing && (
                      <div className={styles.meshPingEffect} />
                    )}
                  </div>
               </Marker>
             );
          })}

          {/* Fiber to Mesh Uplink Nodes */}
          {mode === 'mesh_view' && [...UPLINK_NODES, ...SULTAN_NODES].map((n, i) => (
             <Marker key={`extra-node-${i}`} longitude={n.coordinates[0]} latitude={n.coordinates[1]} anchor="center">
                <div className={styles.meshNodeContainer}>
                  <div className={styles.meshNodeGlow} style={{ borderColor: '#69f0ae', width: '12px', height: '12px', opacity: 0.8 }} />
                </div>
             </Marker>
          ))}

          {/* Sultangazi Management Center Marker */}
          {mode === 'mesh_view' && (
             <Marker longitude={SULTAN_NODES[6].coordinates[0]} latitude={SULTAN_NODES[6].coordinates[1]} anchor="bottom">
                <div style={{
                  background: '#69f0ae', color: '#000', padding: '6px 10px',
                  borderRadius: '6px', border: '2px solid #000',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  fontWeight: 'bold', boxShadow: '0 0 10px rgba(105, 240, 174, 0.8)',
                  cursor: 'default',
                  marginBottom: '10px'
                }}>
                  <span style={{ fontSize: '0.75rem' }}>SULTANGAZİ</span>
                  <span style={{ fontSize: '0.65rem' }}>YÖNETİM MERKEZİ</span>
                </div>
             </Marker>
          )}

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

          {/* Assembly Points Markers */}
          {ASSEMBLY_POINTS.map(point => {
            const report = reports[point.id];
            let bgColor = point.isMain ? '#4caf50' : '#8bc34a'; // Default
            if (report) {
               bgColor = report.properties.color; // Duruma göre değişir
            }

            return (
              <Marker key={point.id} longitude={point.coordinates[0]} latitude={point.coordinates[1]} anchor="bottom">
                <div 
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: mode === 'mesh_view' ? 'default' : 'pointer', transform: `scale(${markerScale})`, transformOrigin: 'bottom center', transition: 'transform 0.2s' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (mode === 'mesh_view') return;
                    setSelectedAssembly(point);
                    setSelectedFeature(null);
                  }}
                >
                  <div style={{ background: bgColor, color: 'white', padding: point.isMain ? '4px 8px' : '2px 6px', borderRadius: '4px', fontSize: point.isMain ? '11px' : '9px', fontWeight: 'bold', marginBottom: '2px', whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: point.isMain ? '2px solid white' : '1px solid white' }}>
                    {point.isMain ? 'Ana Kriz Merkezi' : 'Toplanma Alanı'}
                    {report && ` (${report.status === 'acil_ihtiyac' ? 'Acil İhtiyaç' : (report.status === 'cadir_kuruluyor' ? 'Kuruluyor' : 'Aktif')})`}
                  </div>
                  <div style={{ background: bgColor, width: point.isMain ? '14px' : '10px', height: point.isMain ? '14px' : '10px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
                </div>
              </Marker>
            );
          })}

          {/* Medical Facilities Markers */}
          {mode !== 'mesh_view' && MEDICAL_FACILITIES.map(facility => (
            <Marker key={facility.id} longitude={facility.coordinates[0]} latitude={facility.coordinates[1]} anchor="center">
              <div 
                style={{ background: 'white', border: '3px solid #e91e63', color: '#e91e63', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', transform: `scale(${markerScale})`, transition: 'transform 0.2s' }} 
                title={facility.name}
              >
                H
              </div>
            </Marker>
          ))}

          {/* Health Centers Markers (Mavi, "S" Harfi) */}
          {mode !== 'mesh_view' && HEALTH_CENTERS.map(center => (
            <Marker key={center.id} longitude={center.coordinates[0]} latitude={center.coordinates[1]} anchor="center">
              <div 
                style={{ background: 'white', border: '2px solid #0288d1', color: '#0288d1', borderRadius: '4px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', transform: `scale(${markerScale})`, transition: 'transform 0.2s' }} 
                title={center.name}
              >
                S
              </div>
            </Marker>
          ))}

          {/* Pharmacies Markers (Türkiye standardı Kırmızı "E" Harfi) */}
          {mode !== 'mesh_view' && PHARMACIES.map(pharmacy => (
            <Marker key={pharmacy.id} longitude={pharmacy.coordinates[0]} latitude={pharmacy.coordinates[1]} anchor="center">
              <div 
                style={{ background: 'white', border: '2px solid #e53935', color: '#e53935', borderRadius: '4px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', transform: `scale(${markerScale})`, transition: 'transform 0.2s' }} 
                title={pharmacy.name}
              >
                E
              </div>
            </Marker>
          ))}

          {/* Form Reports (Supply and Medical Demands) Markers */}
          {formReports.map((r, index) => {
             if (!r.coordinate) return null;
             const isMedical = r.type === 'MEDICAL';
             return (
               <Marker key={r.id || `fr-${index}`} longitude={r.coordinate[0]} latitude={r.coordinate[1]} anchor="center">
                 <div
                   style={{
                     background: isMedical ? '#ffebee' : '#fff3e0',
                     border: `2px solid ${isMedical ? '#d32f2f' : '#ef6c00'}`,
                     color: isMedical ? '#d32f2f' : '#ef6c00',
                     borderRadius: isMedical ? '50%' : '4px',
                     width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                     fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                     zIndex: 10, transform: `scale(${markerScale})`, transition: 'transform 0.2s'
                   }}
                   onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFormReport(r);
                      setSelectedFeature(null);
                      setSelectedAssembly(null);
                   }}
                 >
                   {isMedical ? '+' : '📦'}
                 </div>
               </Marker>
             )
          })}

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
              paint={{
                'fill-extrusion-color': ['get', 'color'],
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'min_height'],
                'fill-extrusion-opacity': 0.9
              }}
            />
          </Source>

          {hoverInfo && !selectedFeature && routeMode === 'idle' && (
            <Popup
              longitude={hoverInfo.longitude}
              latitude={hoverInfo.latitude}
              closeButton={false}
              className={styles.hoverPopup}
            >
              <div style={{ color: '#333', fontSize: '14px', padding: '4px' }}>
                <strong>Bina Bilgisi</strong>
                <br />
                <em>Raporlamak için SAĞ TIKLAYIN</em>
              </div>
            </Popup>
          )}

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
                
                {mode === 'medical' && (
                  <>
                    <h3 style={{ color: '#d32f2f', marginBottom: '0.5rem', fontSize: '1rem', marginTop: 0, display: 'flex', alignItems: 'center', gap: '4px' }}><HeartPulse size={16} /> Yaralı Bildirimi</h3>
                    <label style={{ color: '#333', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Vaka Durumu / İhtiyaç</label>
                    <select name="ihtiyacTuru" defaultValue="ilk_yardim" style={{width: '100%', padding: '6px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc'}}>
                      <option value="ilk_yardim">Acil İlk Yardım Gerekli</option>
                      <option value="agir_yarali">Ağır Yaralı / Taşıma Gerekli</option>
                      <option value="doktor">Ciddi Vaka (Doktor Şart)</option>
                      <option value="enkaz">Enkaz Altında Ses Var</option>
                    </select>
                    <label style={{ color: '#333', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Tahmini Kişi Sayısı</label>
                    <input type="number" required min="1" name="kisiSayisi" defaultValue="1" style={{width: '100%', padding: '6px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc'}} />
                    <label style={{ color: '#333', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Ek Notlar</label>
                    <input type="text" name="notlar" placeholder="Örn: 2 çocuk var..." style={{width: '100%', padding: '6px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc'}} />
                    <button type="submit" style={{width: '100%', padding: '8px', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>Yardım Çağrısı Başlat</button>
                  </>
                )}

                {mode === 'supply' && (
                  <>
                    <h3 style={{ color: '#f57f17', marginBottom: '0.5rem', fontSize: '1rem', marginTop: 0, display: 'flex', alignItems: 'center', gap: '4px' }}><Package size={16} /> Malzeme Talebi</h3>
                    <label style={{ color: '#333', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Kişi Sayısı</label>
                    <input type="number" required min="1" name="kisiSayisi" defaultValue="1" style={{width: '100%', padding: '6px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc'}} />
                    
                    <label style={{ color: '#333', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Erzak & Lojistik İhtiyacı</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                       <label style={{fontSize: '11px', background: '#f0f0f0', padding: '4px 8px', borderRadius: '12px', cursor: 'pointer', border: '1px solid #ccc'}}><input type="checkbox" name="su" style={{display: 'none'}} /> 💧 Su</label>
                       <label style={{fontSize: '11px', background: '#f0f0f0', padding: '4px 8px', borderRadius: '12px', cursor: 'pointer', border: '1px solid #ccc'}}><input type="checkbox" name="gida" style={{display: 'none'}} /> 🍞 Gıda</label>
                       <label style={{fontSize: '11px', background: '#f0f0f0', padding: '4px 8px', borderRadius: '12px', cursor: 'pointer', border: '1px solid #ccc'}}><input type="checkbox" name="cadir" style={{display: 'none'}} /> ⛺ Çadır</label>
                       <label style={{fontSize: '11px', background: '#f0f0f0', padding: '4px 8px', borderRadius: '12px', cursor: 'pointer', border: '1px solid #ccc'}}><input type="checkbox" name="bebek" style={{display: 'none'}} /> 🍼 Bebek Bezi</label>
                       <label style={{fontSize: '11px', background: '#f0f0f0', padding: '4px 8px', borderRadius: '12px', cursor: 'pointer', border: '1px solid #ccc'}}><input type="checkbox" name="isatici" style={{display: 'none'}} /> 🔥 Isıtıcı</label>
                    </div>

                    <label style={{ color: '#333', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Özel Not</label>
                    <input type="text" name="notlar" placeholder="Örn: Özellikle kuru gıda lazım..." style={{width: '100%', padding: '6px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc'}} />
                    <button type="submit" style={{width: '100%', padding: '8px', background: '#f57f17', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>Talebi Haritaya Sabitle</button>
                  </>
                )}

                {(mode === 'building' || mode === 'road') && (
                  <>
                    <h3 style={{ color: '#000', marginBottom: '0.5rem', fontSize: '1rem', marginTop: 0 }}>Bina Hasar Bildirimi</h3>
                    
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
                  </>
                )}
              </form>
            </Popup>
          )}

          {selectedAssembly && (
            <Popup
              longitude={selectedAssembly.coordinates[0]}
              latitude={selectedAssembly.coordinates[1]}
              anchor="top"
              onClose={() => setSelectedAssembly(null)}
              closeOnClick={false}
              className={styles.actionPopup}
            >
              <form onSubmit={handleAssemblySubmit} className={styles.popupForm}>
                <h3 style={{ color: '#000', marginBottom: '0.5rem', fontSize: '1rem', marginTop: 0 }}>Alan Durumu ({selectedAssembly.name})</h3>
                
                <label style={{ color: '#333', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Lojistik Durumu</label>
                <select name="status" defaultValue="aktif" className={styles.select} style={{width: '100%', padding: '6px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc'}}>
                  <option value="aktif">Aktif & Güvenli Koordinasyon</option>
                  <option value="cadir_kuruluyor">Çadır / Aşevi Kuruluyor</option>
                  <option value="acil_ihtiyac">Aşırı Kalabalık / Acil Erzak İhtiyacı</option>
                </select>

                <label style={{ color: '#333', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>İhtiyaç Notları</label>
                <textarea name="notes" rows="2" className={styles.textarea} placeholder="Örn: Bebek bezi ve çadır kiti lazım..." style={{width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px'}}></textarea>

                <button type="submit" className={styles.submitBtn} style={{width: '100%', padding: '8px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>
                  Alan Durumunu Kaydet
                </button>
              </form>
            </Popup>
          )}

          {selectedFormReport && (
            <Popup
              longitude={selectedFormReport.coordinate[0]}
              latitude={selectedFormReport.coordinate[1]}
              anchor="top"
              onClose={() => setSelectedFormReport(null)}
              closeOnClick={true}
              className={styles.actionPopup}
            >
              <div style={{ padding: '4px', fontFamily: 'sans-serif' }}>
                <h3 style={{ color: selectedFormReport.type === 'MEDICAL' ? '#d32f2f' : '#f57f17', marginBottom: '0.5rem', fontSize: '1rem', marginTop: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {selectedFormReport.type === 'MEDICAL' ? <HeartPulse size={16}/> : <Package size={16} />}
                  {selectedFormReport.type === 'MEDICAL' ? 'Tıbbi Kriz / Yaralı' : 'Lojistik/Erzak Talebi'}
                </h3>
                
                <div style={{ fontSize: '0.85rem', color: '#333', marginBottom: '8px' }}>
                  <strong>Kişi Sayısı:</strong> {selectedFormReport.data.kisiSayisi || '?'} Kişi
                </div>

                <div style={{ fontSize: '0.85rem', color: '#333', marginBottom: '8px' }}>
                  <strong>{selectedFormReport.type === 'MEDICAL' ? 'Yardım Türü' : 'İhtiyaçlar'}:</strong><br/>
                  <span style={{ color: '#555', fontWeight: 'bold' }}>
                    {selectedFormReport.type === 'MEDICAL' 
                      ? (selectedFormReport.data.ihtiyacTuru.replace('_', ' ').toUpperCase())
                      : Object.keys(selectedFormReport.data.ihtiyaclar).filter(k=>selectedFormReport.data.ihtiyaclar[k]).join(', ').toUpperCase()
                    }
                  </span>
                </div>

                {selectedFormReport.data.notlar && (
                  <div style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic', background: '#f5f5f5', padding: '6px', borderRadius: '4px' }}>
                    "{selectedFormReport.data.notlar}"
                  </div>
                )}
              </div>
            </Popup>
          )}
        </Map>
      </div>

      {/* AFAD API Sync Simülasyonu Modalı */}
      {(isSyncing || syncComplete) && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontFamily: 'monospace'
        }}>
          <div style={{ background: '#111', padding: '2rem', border: `2px solid ${syncComplete ? '#4caf50' : '#e91e63'}`, borderRadius: '8px', maxWidth: '600px', width: '90%'}}>
            
            <div style={{textAlign: 'center', marginBottom: '1.5rem'}}>
              {syncComplete ? <CheckCircle size={64} color="#4caf50" /> : <Server size={64} color="#e91e63" className={styles.pulseAnim} />}
              <h2 style={{ color: syncComplete ? '#4caf50' : '#e91e63', margin: '1rem 0 0.5rem 0' }}>
                {syncComplete ? 'Veri Aktarımı Başarılı!' : 'AFAD Sunucularına Güvenli Bağlantı...'}
              </h2>
            </div>

            {!syncComplete && (
              <div style={{fontSize: '14px', lineHeight: '1.8', color: '#00ff00', background: '#000', padding: '1rem', borderRadius: '4px'}}>
                <p style={{margin:0}}>{syncStep >= 1 ? '✓ Metro Ethernet Fiber Omurgasına bağlanıldı...' : 'Bağlantı aranıyor...'} </p>
                <p style={{margin:0, opacity: syncStep >= 2 ? 1 : 0.4}}>{syncStep >= 2 ? '✓ AES-256 Kapalı Intranet köprüsü kuruldu...' : 'Güvenli kapı oluşturuluyor...'} </p>
                <p style={{margin:0, opacity: syncStep >= 3 ? 1 : 0.4}}>{syncStep >= 3 ? '✓ Veri paketlenip yola çıktı...' : 'AFAD API uç noktası bekleniyor...'} </p>
              </div>
            )}

            {syncComplete && (
              <div style={{fontSize: '14px', lineHeight: '1.5', background: '#000', padding: '1rem', borderRadius: '4px', overflowY: 'auto', maxHeight: '150px'}}>
                <p style={{color: '#fff', marginBottom: '0.5rem', fontWeight: 'bold'}}>1 Gönderilen JSON API Paketi:</p>
                <pre style={{color: '#aaa', margin: 0}}>{syncPayload}</pre>
              </div>
            )}

          </div>
        </div>
      )}

      <div className={styles.legend}>
        <div className={styles.legendItem}><span className={styles.colorBox} style={{background: '#f44336'}}></span> Yıkılmış</div>
        <div className={styles.legendItem}><span className={styles.colorBox} style={{background: '#ff9800'}}></span> Ağır Hasarlı</div>
        <div className={styles.legendItem}><span className={styles.colorBox} style={{background: '#ffeb3b'}}></span> Hasarlı</div>
        <div className={styles.legendItem}><span className={styles.colorBox} style={{background: '#e91e63'}}></span> Yol Kapalı</div>
      </div>
    </div>
  );
};

export default InteractiveMap;
