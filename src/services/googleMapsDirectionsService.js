// Google Maps Directions Service using Keyless-Google-Maps-API
// Reference: https://github.com/somanchiu/Keyless-Google-Maps-API

let googleMapsLoaded = false;
let loadPromise = null;

// Load Google Maps JavaScript API without API key
function loadGoogleMapsAPI() {
  if (googleMapsLoaded) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      googleMapsLoaded = true;
      resolve();
      return;
    }

    // Load Keyless Google Maps API
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/somanchiu/Keyless-Google-Maps-API@v7.1/mapsJavaScriptAPI.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // Wait for google.maps to be available
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          googleMapsLoaded = true;
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!googleMapsLoaded) {
          clearInterval(checkInterval);
          reject(new Error('Google Maps API failed to load'));
        }
      }, 10000);
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

// Get directions using Google Maps Directions Service
export async function getGoogleMapsDirections({ origin, destination, mode = 'DRIVING' }) {
  try {
    // Load Google Maps API if not already loaded
    await loadGoogleMapsAPI();

    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps API is not available');
    }

    return new Promise((resolve, reject) => {
      const directionsService = new window.google.maps.DirectionsService();

      const request = {
        origin: new window.google.maps.LatLng(origin.lat, origin.lng),
        destination: new window.google.maps.LatLng(destination.lat, destination.lng),
        travelMode: window.google.maps.TravelMode[mode] || window.google.maps.TravelMode.DRIVING,
        language: 'vi', // Vietnamese
        unitSystem: window.google.maps.UnitSystem.METRIC
      };

      directionsService.route(request, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          const route = result.routes[0];
          const leg = route.legs[0];

          // Extract polyline points
          const polyline = [];
          if (leg.steps) {
            leg.steps.forEach((step) => {
              // Get path from each step
              if (step.path) {
                step.path.forEach((point) => {
                  polyline.push({
                    lat: point.lat(),
                    lng: point.lng()
                  });
                });
              }
            });
          }

          // Extract steps
          const steps = leg.steps.map((step, index) => {
            // Extract plain text from HTML instructions
            let instructionText = step.instructions;
            if (typeof instructionText === 'string') {
              // Remove HTML tags
              const div = document.createElement('div');
              div.innerHTML = instructionText;
              instructionText = div.textContent || div.innerText || '';
            }

            return {
              index: index,
              instructionText: instructionText || `Bước ${index + 1}`,
              instructionHtml: step.instructions || '',
              distanceText: step.distance?.text || '',
              distanceMeters: step.distance?.value || 0,
              durationText: step.duration?.text || '',
              durationSeconds: step.duration?.value || 0
            };
          });

          const response = {
            success: true,
            route: {
              polyline: polyline,
              leg: {
                summary: route.summary || 'Lộ trình đề xuất',
                distanceText: leg.distance?.text || '',
                distanceMeters: leg.distance?.value || 0,
                durationText: leg.duration?.text || '',
                durationSeconds: leg.duration?.value || 0,
                steps: steps
              },
              warnings: route.warnings || []
            }
          };

          console.log(`✅ Google Maps Directions API returned route with ${steps.length} steps`);
          resolve(response);
        } else {
          console.error('Google Maps Directions API error:', status);
          reject(new Error(`Directions request failed: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error('Error loading Google Maps API:', error);
    throw error;
  }
}

