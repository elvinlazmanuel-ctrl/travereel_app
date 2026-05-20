'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, Car, Bus, Train, Bike, Utensils, Camera, Coffee, Info, Loader2, AlertCircle, Search, Layers, Satellite, Mountain, Moon, Sun } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import L from 'leaflet'
import 'leaflet-routing-machine'

// Extend Leaflet type to include Routing
declare module 'leaflet' {
  namespace Routing {
    function control(options: any): any
  }
}

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => ({ default: mod.MapContainer })),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => ({ default: mod.TileLayer })),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => ({ default: mod.Marker })),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => ({ default: mod.Popup })),
  { ssr: false }
)
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => ({ default: mod.Polyline })),
  { ssr: false }
)
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => ({ default: mod.Circle })),
  { ssr: false }
)

// City coordinates database
const cityCoordinates: Record<string, [number, number]> = {
  'paris,france': [48.8566, 2.3522],
  'tokyo,japan': [35.6762, 139.6503],
  'bangkok,thailand': [13.7563, 100.5018],
  'manila,philippines': [14.5995, 120.9842],
  'seoul,south korea': [37.5665, 126.9780],
  'sydney,australia': [-33.8688, 151.2093],
  'london,uk': [51.5074, -0.1278],
  'new york,usa': [40.7128, -74.0060],
  'dubai,uae': [25.2048, 55.2708],
  'singapore,singapore': [1.3521, 103.8198],
  'rome,italy': [41.9028, 12.4964],
  'barcelona,spain': [41.3851, 2.1734],
  'amsterdam,netherlands': [52.3676, 4.9041],
  'bali,indonesia': [-8.3405, 115.0920],
  'cebu,philippines': [10.3157, 123.8854],
  'boracay,philippines': [11.9674, 121.9248],
  'palawan,philippines': [9.8345, 118.7384],
}

// Transportation options by region
const transportByRegion: Record<string, Array<{ type: string; icon: any; name: string; description: string; cost: string }>> = {
  'Southeast Asia': [
    { type: 'grab', icon: Car, name: 'Grab/Taxi', description: 'Ride-hailing apps widely available', cost: '$' },
    { type: 'tuk-tuk', icon: Car, name: 'Tuk-Tuk', description: 'Traditional three-wheeler for short trips', cost: '$' },
    { type: 'motorbike', icon: Bike, name: 'Motorbike Rental', description: 'Popular for exploring cities', cost: '$$' },
    { type: 'bus', icon: Bus, name: 'Local Bus', description: 'Extensive public bus networks', cost: '$' },
  ],
  'East Asia': [
    { type: 'train', icon: Train, name: 'Bullet Train/Metro', description: 'High-speed rail and subway systems', cost: '$$' },
    { type: 'bus', icon: Bus, name: 'City Bus', description: 'Reliable and affordable public transport', cost: '$' },
    { type: 'taxi', icon: Car, name: 'Taxi', description: 'Readily available in cities', cost: '$$' },
    { type: 'bike', icon: Bike, name: 'Bicycle', description: 'Bike-sharing programs common', cost: '$' },
  ],
  'Europe': [
    { type: 'train', icon: Train, name: 'Train/Metro', description: 'Excellent rail networks', cost: '$$' },
    { type: 'tram', icon: Bus, name: 'Tram', description: 'Common in many European cities', cost: '$' },
    { type: 'bus', icon: Bus, name: 'Bus', description: 'Comprehensive bus systems', cost: '$' },
    { type: 'bike', icon: Bike, name: 'Bicycle', description: 'Very bike-friendly cities', cost: '$' },
  ],
  'North America': [
    { type: 'car', icon: Car, name: 'Car Rental', description: 'Best for flexibility', cost: '$$$' },
    { type: 'bus', icon: Bus, name: 'Public Transit', description: 'Metro and bus in major cities', cost: '$' },
    { type: 'taxi', icon: Car, name: 'Uber/Taxi', description: 'Ride-sharing widely available', cost: '$$' },
    { type: 'walk', icon: Navigation, name: 'Walking', description: 'Walkable downtown areas', cost: 'Free' },
  ],
}

// Tile layer configurations
const tileLayers = {
  standard: {
    name: 'Standard',
    icon: Sun,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    name: 'Satellite',
    icon: Satellite,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
  terrain: {
    name: 'Terrain',
    icon: Mountain,
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
  },
  dark: {
    name: 'Dark Mode',
    icon: Moon,
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB',
  },
}

type TileLayerType = keyof typeof tileLayers

// Points of interest categories
const poiCategories = [
  { id: 'restaurants', icon: Utensils, label: 'Restaurants', color: '#2F5C9B' },
  { id: 'attractions', icon: Camera, label: 'Attractions', color: '#5CA5CD' },
  { id: 'cafes', icon: Coffee, label: 'Cafes', color: '#5CA5CD' },
]

interface ItineraryMapProps {
  location: string
  country: string
  days_plan?: Array<{
    dayNumber: number
    activities: Array<{
      id?: string
      title: string
      location: string | null
      latitude: number | null
      longitude: number | null
    }>
  }>
  currentDay?: number
}

export function ItineraryMap({ location, country, days_plan, currentDay = 1 }: ItineraryMapProps) {
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null)
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [showGPS, setShowGPS] = useState(false)
  const [showPOI, setShowPOI] = useState<string | null>(null)
  const [selectedPOI, setSelectedPOI] = useState<any>(null)
  const [pois, setPois] = useState<any[]>([])
  const [activeTileLayer, setActiveTileLayer] = useState<TileLayerType>('standard')
  const [showLayerSwitcher, setShowLayerSwitcher] = useState(false)
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null)
  const [weatherData, setWeatherData] = useState<any>(null)
  const mapRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)
  const routingControlRef = useRef<any>(null)

  // Geocode location
  useEffect(() => {
    const fetchCoordinates = async () => {
      setLoading(true)
      
      const key = `${location.toLowerCase()},${country.toLowerCase()}`
      if (cityCoordinates[key]) {
        setCoordinates(cityCoordinates[key])
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${location}, ${country}`)}&limit=1`
        )
        const data = await response.json()
        
        if (data.length > 0) {
          setCoordinates([parseFloat(data[0].lat), parseFloat(data[0].lon)])
        } else {
          setCoordinates([20, 0])
        }
      } catch (error) {
        console.error('Geocoding error:', error)
        setCoordinates([20, 0])
      } finally {
        setLoading(false)
      }
    }

    fetchCoordinates()
  }, [location, country])

  // Get user's GPS location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setShowGPS(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude])
        if (mapRef.current) {
          mapRef.current.setView([position.coords.latitude, position.coords.longitude], 15)
        }
        setShowGPS(false)
      },
      (error) => {
        console.error('GPS error:', error)
        setShowGPS(false)
        alert('Unable to get your location. Please enable GPS permissions.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Fetch nearby POIs (simulated with OpenStreetMap Nominatim)
  const fetchPOIs = async (category: string) => {
    if (!coordinates) return
    
    setShowPOI(category)
    setPois([])

    try {
      const [lat, lon] = coordinates
      const radius = 5000 // 5km radius
      
      const queries: Record<string, string> = {
        restaurants: 'restaurant',
        attractions: 'tourist attraction',
        cafes: 'cafe',
      }

      const query = queries[category] || 'restaurant'
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${lon - 0.05},${lat + 0.05},${lon + 0.05},${lat - 0.05}&bounded=1&limit=10`
      )
      const data = await response.json()
      
      setPois(data.map((item: any) => ({
        id: item.place_id,
        name: item.display_name.split(',')[0],
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        address: item.display_name,
        category,
      })))
    } catch (error) {
      console.error('POI fetch error:', error)
    }
  }

  // Get transportation suggestions
  const getTransportSuggestions = () => {
    const regionMap: Record<string, string> = {
      'Thailand': 'Southeast Asia',
      'Philippines': 'Southeast Asia',
      'Indonesia': 'Southeast Asia',
      'Vietnam': 'Southeast Asia',
      'Japan': 'East Asia',
      'South Korea': 'East Asia',
      'China': 'East Asia',
      'France': 'Europe',
      'Italy': 'Europe',
      'Spain': 'Europe',
      'USA': 'North America',
      'Canada': 'North America',
    }

    const region = regionMap[country] || 'Europe'
    return transportByRegion[region] || transportByRegion['Europe']
  }

  // Switch tile layer
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return
    
    // Remove old layer
    mapRef.current.removeLayer(tileLayerRef.current)
    
    // Add new layer
    const newLayer = L.tileLayer(tileLayers[activeTileLayer].url, {
      attribution: tileLayers[activeTileLayer].attribution,
      maxZoom: 19,
    })
    
    newLayer.addTo(mapRef.current)
    tileLayerRef.current = newLayer
  }, [activeTileLayer])

  // Fetch weather data for location
  useEffect(() => {
    if (!coordinates) return
    
    const fetchWeather = async () => {
      try {
        const [lat, lon] = coordinates
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m`
        )
        const data = await response.json()
        
        if (data.current_weather) {
          setWeatherData({
            temperature: data.current_weather.temperature,
            windspeed: data.current_weather.windspeed,
            weathercode: data.current_weather.weathercode,
          })
        }
      } catch (error) {
        console.error('Weather fetch error:', error)
      }
    }
    
    fetchWeather()
  }, [coordinates])

  // Get weather description
  const getWeatherDescription = (code: number) => {
    const weatherCodes: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      95: 'Thunderstorm',
    }
    return weatherCodes[code] || 'Unknown'
  }

  // Setup routing between activities
  const setupRouting = () => {
    if (!mapRef.current || activitiesWithCoords.length < 2) return
    
    // Remove existing routing control
    if (routingControlRef.current) {
      mapRef.current.removeControl(routingControlRef.current)
    }
    
    // Create waypoints from activities
    const waypoints = activitiesWithCoords.map(a => 
      L.latLng(a.latitude!, a.longitude!)
    )
    
    // Add routing control
    const routingControl = L.Routing.control({
      waypoints,
      routeWhileDragging: false,
      showAlternatives: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: '#2F5C9B', weight: 4, opacity: 0.8 }],
      },
      addWaypoints: false,
      draggableWaypoints: false,
      show: false, // Hide default instructions panel
    }).addTo(mapRef.current)
    
    // Listen for route found event
    routingControl.on('routesfound', (e: any) => {
      const route = e.routes[0]
      const distance = (route.summary.totalDistance / 1000).toFixed(1) // km
      const duration = Math.round(route.summary.totalTime / 60) // minutes
      
      setRouteInfo({
        distance: `${distance} km`,
        duration: `${duration} min`,
      })
    })
    
    routingControlRef.current = routingControl
  }

  const dayActivities = days_plan?.find(d => d.dayNumber === currentDay)?.activities || []
  const activitiesWithCoords = dayActivities.filter(a => a.latitude && a.longitude)

  // Setup routing when activities change
  useEffect(() => {
    if (coordinates && activitiesWithCoords.length >= 2) {
      // Small delay to ensure map is ready
      setTimeout(() => setupRouting(), 500)
    }
  }, [coordinates, currentDay])

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="size-8 animate-spin text-[#2F5C9B] mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (!coordinates) {
    return null
  }

  const transportSuggestions = getTransportSuggestions()

  return (
    <Card className="overflow-hidden">
      <div className="h-96 relative">
        {/* @ts-ignore */}
        <MapContainer
          center={userLocation || coordinates}
          zoom={userLocation ? 15 : 13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          ref={(map) => {
            if (map) {
              mapRef.current = map
              // Initialize tile layer
              tileLayerRef.current = L.tileLayer(tileLayers[activeTileLayer].url, {
                attribution: tileLayers[activeTileLayer].attribution,
                maxZoom: 19,
              }).addTo(map)
            }
          }}
        >
          {/* Tile layer is managed manually via useEffect */}
          
          {/* User GPS location */}
          {userLocation && (
            <>
              {/* @ts-ignore */}
              <Circle
                center={userLocation}
                radius={50}
                pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.2 }}
              />
              {/* @ts-ignore */}
              <Marker position={userLocation}>
                {/* @ts-ignore */}
                <Popup>
                  <div className="text-center">
                    <Navigation className="size-4 mx-auto mb-1 text-blue-500" />
                    <p className="font-semibold">You are here</p>
                    <p className="text-xs text-gray-500">GPS Location</p>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* Main destination marker */}
          {/* @ts-ignore */}
          <Marker position={coordinates}>
            {/* @ts-ignore */}
            <Popup>
              <div className="text-center">
                <MapPin className="size-4 mx-auto mb-1 text-[#2F5C9B]" />
                <p className="font-semibold">{location}</p>
                <p className="text-xs text-gray-500">{country}</p>
              </div>
            </Popup>
          </Marker>

          {/* Day activities markers */}
          {activitiesWithCoords.map((activity, index) => (
            // @ts-ignore
            <Marker
              key={activity.id || index}
              position={[activity.latitude!, activity.longitude!]}
            >
              {/* @ts-ignore */}
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">{activity.title}</p>
                  {activity.location && (
                    <p className="text-xs text-gray-500">{activity.location}</p>
                  )}
                  <p className="text-[10px] text-[#2F5C9B] mt-1">Day {currentDay}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* POI markers */}
          {pois.map((poi) => (
            // @ts-ignore
            <Marker
              key={poi.id}
              position={[poi.lat, poi.lon]}
            >
              {/* @ts-ignore */}
              <Popup>
                <div>
                  <p className="font-semibold">{poi.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{poi.address}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Day activities markers (routing lines are handled by Leaflet Routing Machine) */}
        </MapContainer>

        {/* Layer Switcher Button */}
        <button
          onClick={() => setShowLayerSwitcher(!showLayerSwitcher)}
          className="absolute top-4 left-4 z-[1000] bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition-colors"
        >
          <Layers className="size-5 text-[#2F5C9B]" />
        </button>

        {/* Layer Switcher Panel */}
        {showLayerSwitcher && (
          <div className="absolute top-16 left-4 z-[1000] bg-white rounded-xl shadow-xl p-2 space-y-1 min-w-[160px]">
            {(Object.keys(tileLayers) as TileLayerType[]).map((layerKey) => {
              const layer = tileLayers[layerKey]
              const Icon = layer.icon
              return (
                <button
                  key={layerKey}
                  onClick={() => {
                    setActiveTileLayer(layerKey)
                    setShowLayerSwitcher(false)
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTileLayer === layerKey
                      ? 'bg-[#2F5C9B]/10 text-[#2F5C9B]'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Icon className="size-4" />
                  {layer.name}
                </button>
              )
            })}
          </div>
        )}

        {/* GPS Button */}
        <button
          onClick={getUserLocation}
          className="absolute top-4 right-4 z-[1000] bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition-colors"
          disabled={showGPS}
        >
          {showGPS ? (
            <Loader2 className="size-5 text-[#2F5C9B] animate-spin" />
          ) : (
            <Navigation className="size-5 text-[#2F5C9B]" />
          )}
        </button>

        {/* Route Info Badge */}
        {routeInfo && activitiesWithCoords.length >= 2 && (
          <div className="absolute top-16 right-4 z-[1000] bg-white rounded-lg shadow-lg px-3 py-2">
            <div className="flex items-center gap-2 text-xs">
              <Navigation className="size-3.5 text-[#2F5C9B]" />
              <div>
                <p className="font-semibold text-gray-900">{routeInfo.distance}</p>
                <p className="text-gray-500">{routeInfo.duration}</p>
              </div>
            </div>
          </div>
        )}

        {/* Weather Badge */}
        {weatherData && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur rounded-lg shadow-lg px-3 py-1.5">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-gray-900">{weatherData.temperature}°C</span>
              <span className="text-gray-500">{getWeatherDescription(weatherData.weathercode)}</span>
              <span className="text-gray-400">· {weatherData.windspeed} km/h wind</span>
            </div>
          </div>
        )}

        {/* POI Category Buttons */}
        <div className="absolute bottom-4 left-4 right-4 z-[1000] flex gap-2">
          {poiCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => fetchPOIs(cat.id)}
              className={`flex-1 bg-white rounded-lg px-3 py-2 shadow-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                showPOI === cat.id ? 'ring-2 ring-offset-1' : ''
              }`}
              style={{ 
                color: cat.color
              }}
            >
              <cat.icon className="size-3.5" />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Map Controls & Info */}
      <div className="p-4 space-y-4">
        {/* Location Info */}
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-[#2F5C9B]" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {location}, {country}
            </p>
            <p className="text-xs text-muted-foreground">
              {activitiesWithCoords.length > 0 
                ? `${activitiesWithCoords.length} activities plotted` 
                : `Explore your destination`}
            </p>
          </div>
          {userLocation && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              GPS Active
            </Badge>
          )}
        </div>

        {/* Transportation Suggestions */}
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <Car className="size-3.5 text-[#5CA5CD]" />
            Getting Around
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {transportSuggestions.slice(0, 4).map((transport, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div className="size-7 rounded bg-[#5CA5CD]/10 flex items-center justify-center flex-shrink-0">
                  <transport.icon className="size-3.5 text-[#5CA5CD]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{transport.name}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{transport.description}</p>
                  <p className="text-[10px] font-medium text-[#5CA5CD] mt-0.5">{transport.cost}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Points of Interest */}
        {pois.length > 0 && showPOI && (
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Camera className="size-3.5 text-[#5CA5CD]" />
              Nearby {poiCategories.find(c => c.id === showPOI)?.label || 'Places'}
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {pois.slice(0, 5).map((poi) => (
                <div
                  key={poi.id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setSelectedPOI(poi)}
                >
                  <div className="size-7 rounded bg-[#5CA5CD]/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="size-3.5 text-[#5CA5CD]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{poi.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{poi.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open in External Maps */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location}, ${country}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-[11px] text-[#5CA5CD] font-medium hover:underline py-1.5"
          >
            Open in Google Maps →
          </a>
          <a
            href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(`${location}, ${country}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-[11px] text-[#5CA5CD] font-medium hover:underline py-1.5"
          >
            OpenStreetMap →
          </a>
        </div>
      </div>
    </Card>
  )
}
