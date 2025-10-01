import React, { useEffect, useRef } from "react";
import L from "leaflet";

const MapComponent = ({ geojsonUrl, tilesUrl }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // Initialize the map
    mapInstanceRef.current = L.map(mapRef.current).setView([0, 0], 2);

    // Add OpenStreetMap base layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    // URLs from DynaCrop

    // Add tiled raster layer (zonation map)
    L.tileLayer(tilesUrl, {
      maxZoom: 19,
      attribution: "DynaCrop Zonation",
      opacity: 0.7,
    }).addTo(mapInstanceRef.current);

    // Fetch and add GeoJSON layer
    fetch(geojsonUrl)
      .then((response) => response.json())
      .then((data) => {
        const geojsonLayer = L.geoJSON(data, {
          style: {
            color: "#000000",
            weight: 2,
            fillOpacity: 0.2,
          },
        }).addTo(mapInstanceRef.current);

        // Fit map to GeoJSON bounds
        mapInstanceRef.current.fitBounds(geojsonLayer.getBounds());
      })
      .catch((error) => console.error("Error loading GeoJSON:", error));

    // Cleanup on component unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  return <div id="map" ref={mapRef} style={{ height: "270px", width: "100%" }}></div>;
};

export default MapComponent;
