import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Calendar, Filter, Layers, Shield, AlertTriangle, CheckCircle2, X, Globe, Navigation } from 'lucide-react';
import { authUtils } from '../utils/auth';
import { loadGoogleMapsAPI, isGoogleMapsLoaded } from '../utils/googleMapsLoader';
import { UnifiedLocationSelector } from './UnifiedLocationSelector';
import { LocationCrimeNews } from './LocationCrimeNews';
import { districtMetrics } from './DistrictMetrics';

interface HeatmapSectionProps {
  fullView?: boolean;
  selectedLocation?: {
    state: string;
    district: string | null;
  } | null;
  onLocationChange?: (location: { state: string; district: string | null }) => void;
  onMetricsUpdate?: (metrics: {
    location: string;
    safetyScore: number;
    activeAlerts: number;
    safeZones: number;
  }) => void;
}

interface AlertLocation {
  name: string;
  lat: number;
  lng: number;
  description: string;
  district: string;
}

interface SafeZoneLocation {
  name: string;
  lat: number;
  lng: number;
  description: string;
  district: string;
}

export function HeatmapSection({ 
  fullView = false, 
  selectedLocation,
  onLocationChange,
  onMetricsUpdate 
}: HeatmapSectionProps) {
  const currentUser = authUtils.getCurrentUser();
  const isCitizen = currentUser?.userType === 'citizen';
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [dateRange, setDateRange] = useState('24h');
  const googleMapRef = useRef<HTMLDivElement>(null);
  const googleMapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circleOverlaysRef = useRef<google.maps.Circle[]>([]);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showSafeZonesModal, setShowSafeZonesModal] = useState(false);

  // Suppress Google Maps deprecation warning for Marker
  useEffect(() => {
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      // Suppress the specific deprecation warning for google.maps.Marker
      const message = args[0]?.toString() || '';
      if (message.includes('google.maps.Marker is deprecated')) {
        return; // Silently ignore this warning
      }
      originalConsoleWarn.apply(console, args);
    };

    return () => {
      console.warn = originalConsoleWarn; // Restore original
    };
  }, []);

  // Load Google Maps API on component mount
  useEffect(() => {
    const initMaps = async () => {
      const loaded = await loadGoogleMapsAPI();
      setGoogleMapsLoaded(loaded);
    };
    initMaps();
  }, []);

  // Region center coordinates for Google Maps
  const regionCenters: {[key: string]: {lat: number, lng: number, zoom: number}} = {
    'Delhi': { lat: 28.6139, lng: 77.2090, zoom: 11 },
    'Maharashtra': { lat: 19.0760, lng: 72.8777, zoom: 11 },
    'Karnataka': { lat: 12.9716, lng: 77.5946, zoom: 11 },
    'Tamil Nadu': { lat: 13.0827, lng: 80.2707, zoom: 11 },
    'West Bengal': { lat: 22.5726, lng: 88.3639, zoom: 11 },
    'Telangana': { lat: 17.3850, lng: 78.4867, zoom: 11 },
    'Gujarat': { lat: 23.0225, lng: 72.5714, zoom: 11 },
    'Uttar Pradesh': { lat: 26.8467, lng: 80.9462, zoom: 10 },
    'Punjab': { lat: 31.1471, lng: 75.3412, zoom: 10 },
    'Kerala': { lat: 10.8505, lng: 76.2711, zoom: 10 },
    'Rajasthan': { lat: 26.9124, lng: 75.7873, zoom: 10 },
    'Madhya Pradesh': { lat: 23.2599, lng: 77.4126, zoom: 10 },
    'Andhra Pradesh': { lat: 15.9129, lng: 79.7400, zoom: 10 },
    'Haryana': { lat: 29.0588, lng: 76.0856, zoom: 10 },
    'Assam': { lat: 26.2006, lng: 92.9376, zoom: 10 },
    'Goa': { lat: 15.2993, lng: 74.1240, zoom: 11 },
    'Bihar': { lat: 25.0961, lng: 85.3131, zoom: 10 },
    'Odisha': { lat: 20.9517, lng: 85.0985, zoom: 10 },
    'Jharkhand': { lat: 23.6102, lng: 85.2799, zoom: 10 },
    'Chhattisgarh': { lat: 21.2787, lng: 81.8661, zoom: 10 },
    'Uttarakhand': { lat: 30.0668, lng: 79.0193, zoom: 10 },
    'Himachal Pradesh': { lat: 31.1048, lng: 77.1734, zoom: 10 },
    'Jammu & Kashmir': { lat: 33.7782, lng: 76.5762, zoom: 9 },
    'Tripura': { lat: 23.9408, lng: 91.9882, zoom: 10 },
    'Meghalaya': { lat: 25.4670, lng: 91.3662, zoom: 10 },
    'Manipur': { lat: 24.6637, lng: 93.9063, zoom: 10 },
    'Mizoram': { lat: 23.1645, lng: 92.9376, zoom: 10 },
    'Nagaland': { lat: 26.1584, lng: 94.5624, zoom: 10 },
    'Arunachal Pradesh': { lat: 28.2180, lng: 94.7278, zoom: 9 },
    'Sikkim': { lat: 27.5330, lng: 88.5122, zoom: 10 },
    'Chandigarh': { lat: 30.7333, lng: 76.7794, zoom: 12 },
    'Puducherry': { lat: 11.9416, lng: 79.8083, zoom: 12 },
    'Lakshadweep': { lat: 10.5667, lng: 72.6417, zoom: 11 },
    'Andaman & Nicobar': { lat: 11.7401, lng: 92.6586, zoom: 10 },
    'Dadra & Nagar Haveli': { lat: 20.1809, lng: 73.0169, zoom: 11 },
    'Ladakh': { lat: 34.1526, lng: 77.5771, zoom: 9 },
  };

  // Region-specific metrics with detailed alert and safe zone locations
  const regionMetrics: {[key: string]: {
    safetyScore: number, 
    activeAlerts: AlertLocation[], 
    safeZones: SafeZoneLocation[]
  }} = {
    'Delhi': { 
      safetyScore: 58,  // Lower due to high alert count (40 alerts)
      activeAlerts: [
        { name: 'Connaught Place Gang Activity', lat: 28.6315, lng: 77.2167, description: 'Gang-related incidents reported in commercial area', district: 'Central Delhi' },
        { name: 'Chandni Chowk Historical Crime', lat: 28.6506, lng: 77.2303, description: 'Pickpocketing and theft in crowded market', district: 'Central Delhi' },
        { name: 'Karol Bagh Market Theft', lat: 28.6519, lng: 77.1905, description: 'Theft and pickpocketing in busy market', district: 'Central Delhi' },
        { name: 'Narela Industrial Danger Zone', lat: 28.8517, lng: 77.0930, description: 'Industrial area with security concerns', district: 'North Delhi' },
        { name: 'Rohini Sector 16 Crime', lat: 28.7491, lng: 77.1170, description: 'Vehicle theft and burglary incidents', district: 'North Delhi' },
        { name: 'Kashmere Gate Suspicious Activity', lat: 28.6672, lng: 77.2276, description: 'Loitering and suspicious behavior', district: 'North Delhi' },
        { name: 'Nehru Place Cyber Crime', lat: 28.5494, lng: 77.2501, description: 'High cyber crime and fraud activity', district: 'South Delhi' },
        { name: 'Saket Mall Area Theft', lat: 28.5245, lng: 77.2066, description: 'Theft incidents in shopping district', district: 'South Delhi' },
        { name: 'Greater Kailash Burglary', lat: 28.5494, lng: 77.2428, description: 'Residential burglary reports', district: 'South Delhi' },
        { name: 'Laxmi Nagar Market Crime', lat: 28.6325, lng: 77.2769, description: 'Pickpocketing in crowded market', district: 'East Delhi' },
        { name: 'Shahdara Drug Activity', lat: 28.6692, lng: 77.2954, description: 'Drug-related incidents reported', district: 'Shahdara' },
        { name: 'Shahdara Railway Station Crime', lat: 28.6727, lng: 77.2878, description: 'Theft at railway station area', district: 'Shahdara' },
        { name: 'Dwarka Drug Activity Zone', lat: 28.5921, lng: 77.0460, description: 'Drug peddling in residential area', district: 'South West Delhi' },
        { name: 'Dwarka Sector 10 Theft', lat: 28.5865, lng: 77.0521, description: 'Vehicle theft incidents', district: 'South West Delhi' },
        { name: 'Janakpuri Robbery', lat: 28.6217, lng: 77.0851, description: 'Armed robbery attempts', district: 'West Delhi' },
        { name: 'Tilak Nagar Crime', lat: 28.6412, lng: 77.0936, description: 'Street crime and mugging', district: 'West Delhi' },
        { name: 'Vikaspuri Burglary', lat: 28.6437, lng: 77.0644, description: 'House breaking incidents', district: 'West Delhi' },
        { name: 'Pitampura Theft', lat: 28.6894, lng: 77.1318, description: 'Theft in residential area', district: 'North West Delhi' },
        { name: 'Shalimar Bagh Crime', lat: 28.7127, lng: 77.1525, description: 'Vehicle theft hotspot', district: 'North West Delhi' },
        { name: 'Dilshad Garden Crime', lat: 28.6831, lng: 77.3189, description: 'Theft and robbery incidents', district: 'North East Delhi' },
        { name: 'Seelampur Drug Zone', lat: 28.6728, lng: 77.2750, description: 'Drug trafficking area', district: 'North East Delhi' },
        { name: 'Kalkaji Crime', lat: 28.5494, lng: 77.2585, description: 'Street crime incidents', district: 'South East Delhi' },
        { name: 'Okhla Industrial Crime', lat: 28.5355, lng: 77.2754, description: 'Industrial area theft', district: 'South East Delhi' },
        { name: 'Rajouri Garden Market Theft', lat: 28.6414, lng: 77.1214, description: 'Pickpocketing in shopping area', district: 'West Delhi' },
        { name: 'Uttam Nagar Violence', lat: 28.6219, lng: 77.0594, description: 'Gang violence and fights', district: 'West Delhi' },
        { name: 'Model Town Burglary', lat: 28.7186, lng: 77.1909, description: 'Residential break-ins', district: 'North Delhi' },
        { name: 'Sadar Bazaar Theft', lat: 28.6542, lng: 77.2165, description: 'Market area theft hotspot', district: 'Central Delhi' },
        { name: 'Paharganj Drug Trade', lat: 28.6448, lng: 77.2167, description: 'Drug trafficking area', district: 'Central Delhi' },
        { name: 'Green Park Mugging', lat: 28.5594, lng: 77.2065, description: 'Mugging and robbery incidents', district: 'South Delhi' },
        { name: 'Vasant Kunj ATM Fraud', lat: 28.5213, lng: 77.1588, description: 'ATM skimming and fraud', district: 'South West Delhi' },
        { name: 'Mayur Vihar Assault', lat: 28.6074, lng: 77.2982, description: 'Assault and battery cases', district: 'East Delhi' },
        { name: 'Krishna Nagar Theft', lat: 28.6686, lng: 77.2895, description: 'Vehicle and home theft', district: 'East Delhi' },
        { name: 'Ashok Vihar Crime', lat: 28.6947, lng: 77.1774, description: 'Multiple crime incidents', district: 'North West Delhi' },
        { name: 'Preet Vihar Robbery', lat: 28.6386, lng: 77.2957, description: 'Armed robbery cases', district: 'East Delhi' },
        { name: 'Sarojini Nagar Theft Hotspot', lat: 28.5753, lng: 77.1923, description: 'Market theft and pickpocketing', district: 'South Delhi' },
        { name: 'Mundka Industrial Crime', lat: 28.6819, lng: 77.0369, description: 'Industrial theft and violence', district: 'West Delhi' },
        { name: 'Burari Violence Zone', lat: 28.7509, lng: 77.1982, description: 'Gang violence hotspot', district: 'North Delhi' },
        { name: 'Bawana Crime Area', lat: 28.8017, lng: 77.0341, description: 'Multiple crime incidents', district: 'North West Delhi' },
        { name: 'Najafgarh Drug Zone', lat: 28.6092, lng: 76.9798, description: 'Drug peddling area', district: 'South West Delhi' },
        { name: 'Rohini Sector 7 Theft', lat: 28.7037, lng: 77.1159, description: 'Vehicle theft zone', district: 'North West Delhi' },
      ],
      safeZones: [
        { name: 'Lodhi Garden Park', lat: 28.5931, lng: 77.2197, description: 'Well-patrolled public park with security', district: 'Central Delhi' },
        { name: 'Rajpath Central Vista', lat: 28.6143, lng: 77.1995, description: 'Government area with strict security', district: 'Central Delhi' },
        { name: 'Red Fort Complex', lat: 28.6562, lng: 77.2410, description: 'Historic monument with comprehensive security', district: 'Central Delhi' },
        { name: 'Nehru Place Metro Station', lat: 28.5494, lng: 77.2500, description: 'High security metro station area', district: 'South Delhi' },
        { name: 'Hauz Khas Fort Complex', lat: 28.5494, lng: 77.1923, description: 'Historic site with security patrol', district: 'South Delhi' },
        { name: 'Select Citywalk Mall', lat: 28.5244, lng: 77.2172, description: 'Shopping complex with 24/7 security', district: 'South Delhi' },
        { name: 'India Gate Monument', lat: 28.6129, lng: 77.2295, description: 'Tourist area with heavy police presence', district: 'New Delhi' },
        { name: 'Rashtrapati Bhavan Area', lat: 28.6143, lng: 77.1995, description: 'Presidential estate with maximum security', district: 'New Delhi' },
        { name: 'Parliament House Zone', lat: 28.6172, lng: 77.2082, description: 'Government district with strict control', district: 'New Delhi' },
        { name: 'Akshardham Temple', lat: 28.6127, lng: 77.2773, description: 'Religious site with comprehensive security', district: 'East Delhi' },
        { name: 'Swaminarayan Temple Complex', lat: 28.6386, lng: 77.3054, description: 'Temple with security systems', district: 'East Delhi' },
        { name: 'Kalkaji Mandir Area', lat: 28.5494, lng: 77.2585, description: 'Religious site with police presence', district: 'East Delhi' },
        { name: 'Rajouri Garden Metro', lat: 28.6414, lng: 77.1214, description: 'Metro station with CCTV coverage', district: 'West Delhi' },
        { name: 'Pacific Mall NSP', lat: 28.6999, lng: 77.1374, description: 'Shopping mall with security', district: 'West Delhi' },
        { name: 'Janakpuri District Centre', lat: 28.6217, lng: 77.0851, description: 'Commercial hub with police patrol', district: 'West Delhi' },
        { name: 'Delhi University North Campus', lat: 28.6967, lng: 77.2094, description: 'University area with campus security', district: 'North Delhi' },
        { name: 'Mall of India Noida', lat: 28.5693, lng: 77.3260, description: 'Large mall with comprehensive security', district: 'North Delhi' },
        { name: 'Tihar Forest Area', lat: 28.6368, lng: 77.0991, description: 'Protected forest with rangers', district: 'North Delhi' },
        { name: 'Pitampura Metro Hub', lat: 28.6894, lng: 77.1318, description: 'Metro interchange with security', district: 'North West Delhi' },
        { name: 'Netaji Subhash Place', lat: 28.6947, lng: 77.1522, description: 'Commercial center with police presence', district: 'North West Delhi' },
        { name: 'Rohini Sector 18 Market', lat: 28.7447, lng: 77.1163, description: 'Shopping area with CCTV coverage', district: 'North West Delhi' },
        { name: 'Karkardooma Court Complex', lat: 28.6519, lng: 77.2986, description: 'Court area with heavy security', district: 'North East Delhi' },
        { name: 'Yamuna Sports Complex', lat: 28.6936, lng: 77.2458, description: 'Sports facility with security', district: 'North East Delhi' },
        { name: 'ISBT Anand Vihar', lat: 28.6469, lng: 77.3159, description: 'Bus terminal with police deployment', district: 'North East Delhi' },
        { name: 'DLF Promenade Vasant Kunj', lat: 28.5213, lng: 77.1588, description: 'Premium mall with high security', district: 'South West Delhi' },
        { name: 'Dwarka Sector 21 Metro', lat: 28.5525, lng: 77.0582, description: 'Metro station with surveillance', district: 'South West Delhi' },
        { name: 'IGI Airport Terminal 3', lat: 28.5562, lng: 77.1000, description: 'International airport with maximum security', district: 'South West Delhi' },
        { name: 'Nehru Park Kalkaji', lat: 28.5494, lng: 77.2585, description: 'Public park with security patrol', district: 'South East Delhi' },
        { name: 'Apollo Hospital Sarita Vihar', lat: 28.5355, lng: 77.2754, description: 'Hospital area with security', district: 'South East Delhi' },
        { name: 'Okhla Bird Sanctuary', lat: 28.5535, lng: 77.3165, description: 'Protected wildlife area with rangers', district: 'South East Delhi' },
        { name: 'Shahdara Metro Station', lat: 28.6727, lng: 77.2878, description: 'Metro hub with CCTV monitoring', district: 'Shahdara' },
        { name: 'Welcome Metro Hub', lat: 28.7095, lng: 77.2769, description: 'Metro interchange with police', district: 'Shahdara' },
        { name: 'Shastri Park Complex', lat: 28.6818, lng: 77.2688, description: 'Community park with security', district: 'Shahdara' },
      ]
    },
    'Maharashtra': { 
      safetyScore: 62,  // Lower due to many alerts (35 alerts)
      activeAlerts: [
        { name: 'Colaba Tourist Scam', lat: 18.9220, lng: 72.8347, description: 'Tourist scams and overcharging incidents', district: 'Mumbai City' },
        { name: 'Crawford Market Pickpocket', lat: 18.9467, lng: 72.8342, description: 'Pickpocketing in crowded market', district: 'Mumbai City' },
        { name: 'CST Station Crime', lat: 18.9398, lng: 72.8355, description: 'Theft at railway station', district: 'Mumbai City' },
        { name: 'Dharavi Gang Territory', lat: 19.0378, lng: 72.8520, description: 'Gang-controlled area with high crime', district: 'Mumbai Suburban' },
        { name: 'Andheri Cyber Crime', lat: 19.1197, lng: 72.8464, description: 'Cyber fraud and scams', district: 'Mumbai Suburban' },
        { name: 'Borivali Drug Zone', lat: 19.2403, lng: 72.8565, description: 'Drug peddling activity', district: 'Mumbai Suburban' },
        { name: 'Pune FC Road Crime', lat: 18.5314, lng: 73.8446, description: 'Street crime in commercial area', district: 'Pune' },
        { name: 'Koregaon Park Theft', lat: 18.5362, lng: 73.8978, description: 'Vehicle theft incidents', district: 'Pune' },
        { name: 'Pune University Area Crime', lat: 18.5089, lng: 73.8077, description: 'Theft near educational campus', district: 'Pune' },
        { name: 'Nagpur Central Crime', lat: 21.1458, lng: 79.0882, description: 'City center theft hotspot', district: 'Nagpur' },
        { name: 'Sitabuldi Market Theft', lat: 21.1498, lng: 79.0806, description: 'Market area theft incidents', district: 'Nagpur' },
        { name: 'Thane Station Crime', lat: 19.1871, lng: 72.9781, description: 'Railway station theft', district: 'Thane' },
        { name: 'Thane Ghodbunder Road', lat: 19.2544, lng: 72.9781, description: 'Highway robbery incidents', district: 'Thane' },
        { name: 'Nashik City Center', lat: 19.9975, lng: 73.7898, description: 'Commercial area crime', district: 'Nashik' },
        { name: 'Nashik Road Crime', lat: 20.0063, lng: 73.7637, description: 'Vehicle theft zone', district: 'Nashik' },
        { name: 'Aurangabad Market Theft', lat: 19.8762, lng: 75.3433, description: 'Market pickpocketing', district: 'Aurangabad' },
        { name: 'Aurangabad Tourist Scam', lat: 19.8744, lng: 75.3654, description: 'Tourist-targeted scams', district: 'Aurangabad' },
        { name: 'Dadar Market Theft', lat: 19.0177, lng: 72.8462, description: 'Pickpocketing in crowded market', district: 'Mumbai City' },
        { name: 'Kurla Gang Activity', lat: 19.0728, lng: 72.8826, description: 'Gang-related crimes', district: 'Mumbai Suburban' },
        { name: 'Malad Drug Zone', lat: 19.1868, lng: 72.8483, description: 'Drug trafficking area', district: 'Mumbai Suburban' },
        { name: 'Kandivali Burglary', lat: 19.2074, lng: 72.8502, description: 'Residential burglary incidents', district: 'Mumbai Suburban' },
        { name: 'Vashi Cyber Fraud', lat: 19.0632, lng: 73.0074, description: 'Cyber crime hotspot', district: 'Thane' },
        { name: 'Pune Station Theft', lat: 18.5285, lng: 73.8748, description: 'Railway station crime', district: 'Pune' },
        { name: 'Kothrud Assault', lat: 18.5074, lng: 73.8077, description: 'Assault and violence cases', district: 'Pune' },
        { name: 'Hadapsar Vehicle Theft', lat: 18.5089, lng: 73.9326, description: 'Vehicle theft zone', district: 'Pune' },
        { name: 'Bandra Vandalism', lat: 19.0596, lng: 72.8295, description: 'Vandalism and property damage', district: 'Mumbai Suburban' },
        { name: 'Worli Mugging', lat: 19.0176, lng: 72.8186, description: 'Mugging incidents', district: 'Mumbai City' },
        { name: 'Lower Parel Crime', lat: 18.9961, lng: 72.8302, description: 'Multiple crime incidents', district: 'Mumbai City' },
        { name: 'Mulund Robbery', lat: 19.1722, lng: 72.9565, description: 'Armed robbery cases', district: 'Mumbai Suburban' },
        { name: 'Powai ATM Fraud', lat: 19.1176, lng: 72.9060, description: 'ATM fraud and skimming', district: 'Mumbai Suburban' },
        { name: 'Nagpur Sadar Theft', lat: 21.1466, lng: 79.0882, description: 'Market area theft', district: 'Nagpur' },
        { name: 'Wardha Road Crime', lat: 21.1594, lng: 79.0910, description: 'Highway crime incidents', district: 'Nagpur' },
        { name: 'Nashik Panchavati Crime', lat: 20.0103, lng: 73.7805, description: 'Residential crime area', district: 'Nashik' },
        { name: 'Aurangabad Station Theft', lat: 19.8762, lng: 75.3433, description: 'Railway station theft', district: 'Aurangabad' },
        { name: 'Kalyan Dombivli Crime', lat: 19.2403, lng: 73.1305, description: 'Multiple crime incidents', district: 'Thane' },
      ],
      safeZones: [
        { name: 'Marine Drive Promenade', lat: 18.9432, lng: 72.8236, description: 'Well-lit coastal area with police patrol', district: 'Mumbai City' },
        { name: 'Gateway of India', lat: 18.9220, lng: 72.8347, description: 'Tourist landmark with security', district: 'Mumbai City' },
        { name: 'Taj Mahal Palace Hotel Area', lat: 18.9217, lng: 72.8329, description: 'Five-star hotel with heavy security', district: 'Mumbai City' },
        { name: 'Chhatrapati Shivaji Terminus', lat: 18.9398, lng: 72.8355, description: 'Railway station with police deployment', district: 'Mumbai City' },
        { name: 'Bandra Fort Area', lat: 19.0459, lng: 72.8206, description: 'Safe recreational area', district: 'Mumbai Suburban' },
        { name: 'Bandra-Kurla Complex', lat: 19.0634, lng: 72.8681, description: 'Business district with security', district: 'Mumbai Suburban' },
        { name: 'Phoenix Marketcity Mall', lat: 19.0876, lng: 72.8918, description: 'Shopping mall with comprehensive security', district: 'Mumbai Suburban' },
        { name: 'Pune University Campus', lat: 18.5089, lng: 73.8077, description: 'Educational campus with security', district: 'Pune' },
        { name: 'Shaniwar Wada Fort', lat: 18.5196, lng: 73.8553, description: 'Historic site with tourist police', district: 'Pune' },
        { name: 'Phoenix Mall Pune', lat: 18.5314, lng: 73.8446, description: 'Major mall with 24/7 security', district: 'Pune' },
        { name: 'Deekshabhoomi Nagpur', lat: 21.1394, lng: 79.0892, description: 'Sacred monument with security', district: 'Nagpur' },
        { name: 'Ambazari Lake Park', lat: 21.1266, lng: 79.0436, description: 'Park with police patrol', district: 'Nagpur' },
        { name: 'Sitabuldi Fort Area', lat: 21.1458, lng: 79.0882, description: 'Historic fort with monitoring', district: 'Nagpur' },
        { name: 'Upvan Lake Thane', lat: 19.2183, lng: 72.9781, description: 'Recreational area with security', district: 'Thane' },
        { name: 'Viviana Mall Thane', lat: 19.2544, lng: 73.0781, description: 'Shopping center with CCTV', district: 'Thane' },
        { name: 'Yeoor Hills Forest', lat: 19.2389, lng: 72.9606, description: 'Protected forest with rangers', district: 'Thane' },
        { name: 'Sula Vineyards Nashik', lat: 19.9975, lng: 73.7898, description: 'Tourist destination with security', district: 'Nashik' },
        { name: 'Pandavleni Caves', lat: 20.0063, lng: 73.7637, description: 'Archaeological site with guards', district: 'Nashik' },
        { name: 'Ramkund Nashik', lat: 20.0103, lng: 73.7805, description: 'Religious site with police presence', district: 'Nashik' },
        { name: 'Bibi Ka Maqbara Aurangabad', lat: 19.8762, lng: 75.3433, description: 'Historic monument with security', district: 'Aurangabad' },
        { name: 'Daulatabad Fort', lat: 19.9378, lng: 75.2224, description: 'Ancient fort with tourist police', district: 'Aurangabad' },
        { name: 'Aurangabad Caves', lat: 19.8935, lng: 75.3433, description: 'Protected archaeological site', district: 'Aurangabad' },
      ]
    },
    'Karnataka': { 
      safetyScore: 72,  // Moderate alerts (12 alerts)
      activeAlerts: [
        { name: 'Bangalore Cyber Crime Hub', lat: 12.9716, lng: 77.5946, description: 'High incidence of cyber fraud and scams', district: 'Bengaluru Urban' },
        { name: 'MG Road Pickpocket', lat: 12.9750, lng: 77.6064, description: 'Pickpocketing in busy area', district: 'Bengaluru Urban' },
        { name: 'Whitefield Tech Scam', lat: 12.9698, lng: 77.7499, description: 'Tech-related scams and fraud', district: 'Bengaluru Urban' },
        { name: 'Koramangala Burglary', lat: 12.9352, lng: 77.6245, description: 'Residential burglary incidents', district: 'Bengaluru Urban' },
        { name: 'Marathahalli Theft', lat: 12.9591, lng: 77.6974, description: 'Vehicle and property theft', district: 'Bengaluru Urban' },
        { name: 'Indiranagar Crime', lat: 12.9784, lng: 77.6408, description: 'Multiple crime incidents', district: 'Bengaluru Urban' },
        { name: 'Electronic City Fraud', lat: 12.8394, lng: 77.6760, description: 'Cyber fraud hotspot', district: 'Bengaluru Urban' },
        { name: 'Jayanagar Assault', lat: 12.9250, lng: 77.5934, description: 'Assault cases reported', district: 'Bengaluru Urban' },
        { name: 'Yelahanka Violence', lat: 13.1007, lng: 77.5963, description: 'Gang violence area', district: 'Bengaluru Urban' },
        { name: 'BTM Layout Crime', lat: 12.9165, lng: 77.6101, description: 'Street crime incidents', district: 'Bengaluru Urban' },
        { name: 'HSR Layout Theft', lat: 12.9082, lng: 77.6476, description: 'Theft and burglary', district: 'Bengaluru Urban' },
        { name: 'Bannerghatta Road Crime', lat: 12.8892, lng: 77.5957, description: 'Highway robbery incidents', district: 'Bengaluru Urban' },
      ],
      safeZones: [
        { name: 'Cubbon Park Bangalore', lat: 12.9762, lng: 77.5929, description: 'Large public park with security patrol', district: 'Bengaluru Urban' },
        { name: 'Lalbagh Botanical Garden', lat: 12.9507, lng: 77.5848, description: 'Historic garden with monitoring', district: 'Bengaluru Urban' },
        { name: 'UB City Mall', lat: 12.9716, lng: 77.5946, description: 'Luxury mall with high security', district: 'Bengaluru Urban' },
        { name: 'Vidhana Soudha Complex', lat: 12.9796, lng: 77.5912, description: 'Government building with strict security', district: 'Bengaluru Urban' },
        { name: 'Mysore Palace Area', lat: 12.3052, lng: 76.6552, description: 'Tourist area with heavy security', district: 'Mysuru' },
        { name: 'Chamundi Hill Temple', lat: 12.2725, lng: 76.6730, description: 'Religious site with security', district: 'Mysuru' },
        { name: 'Brindavan Gardens', lat: 12.4244, lng: 76.5721, description: 'Tourist spot with police patrol', district: 'Mysuru' },
      ]
    },
    'Tamil Nadu': { 
      safetyScore: 68,  // Moderate-high alerts (14 alerts)
      activeAlerts: [
        { name: 'Chennai Beach Road Theft', lat: 13.0827, lng: 80.2707, description: 'Theft incidents along beach area', district: 'Chennai' },
        { name: 'T-Nagar Market Pickpocket', lat: 13.0418, lng: 80.2341, description: 'Crowded market with pickpocket activity', district: 'Chennai' },
        { name: 'Anna Nagar Crime', lat: 13.0850, lng: 80.2101, description: 'Residential crime incidents', district: 'Chennai' },
        { name: 'Adyar Burglary', lat: 13.0067, lng: 80.2574, description: 'House burglary reports', district: 'Chennai' },
        { name: 'Egmore Station Theft', lat: 13.0807, lng: 80.2609, description: 'Railway station theft', district: 'Chennai' },
        { name: 'Mylapore Temple Scam', lat: 13.0339, lng: 80.2676, description: 'Tourist scams near temple', district: 'Chennai' },
        { name: 'Velachery Assault', lat: 12.9759, lng: 80.2209, description: 'Assault and violence cases', district: 'Chennai' },
        { name: 'Tambaram Crime', lat: 12.9249, lng: 80.1000, description: 'Multiple crime incidents', district: 'Chennai' },
        { name: 'Porur Robbery', lat: 13.0375, lng: 80.1564, description: 'Armed robbery cases', district: 'Chennai' },
        { name: 'Guindy Industrial Theft', lat: 13.0067, lng: 80.2206, description: 'Industrial theft incidents', district: 'Chennai' },
        { name: 'Coimbatore RS Puram Crime', lat: 11.0069, lng: 76.9605, description: 'Commercial area theft', district: 'Coimbatore' },
        { name: 'Madurai Temple Scam', lat: 9.9195, lng: 78.1193, description: 'Tourist scams', district: 'Madurai' },
        { name: 'Trichy Central Crime', lat: 10.8155, lng: 78.6856, description: 'Market area theft', district: 'Tiruchirappalli' },
        { name: 'Salem Market Theft', lat: 11.6643, lng: 78.1460, description: 'Pickpocketing in market', district: 'Salem' },
      ],
      safeZones: [
        { name: 'Marina Beach South', lat: 13.0475, lng: 80.2824, description: 'Patrolled beach area', district: 'Chennai' },
        { name: 'Phoenix Marketcity Chennai', lat: 13.0089, lng: 80.2209, description: 'Shopping mall with comprehensive security', district: 'Chennai' },
        { name: 'Kapaleeshwarar Temple Complex', lat: 13.0339, lng: 80.2676, description: 'Historic temple with security', district: 'Chennai' },
        { name: 'Express Avenue Mall', lat: 13.0657, lng: 80.2619, description: 'Major mall with CCTV coverage', district: 'Chennai' },
        { name: 'Mahabalipuram Shore Temple', lat: 12.6169, lng: 80.1932, description: 'UNESCO site with security', district: 'Chengalpattu' },
        { name: 'Mahabalipuram Beach', lat: 12.6169, lng: 80.1932, description: 'Beach with tourist police', district: 'Chengalpattu' },
        { name: 'Crocodile Bank', lat: 12.7478, lng: 80.2451, description: 'Wildlife park with rangers', district: 'Chengalpattu' },
        { name: 'Brookefields Mall Coimbatore', lat: 11.0168, lng: 76.9558, description: 'Shopping center with security', district: 'Coimbatore' },
        { name: 'Marudamalai Temple', lat: 11.0419, lng: 76.8633, description: 'Hill temple with police presence', district: 'Coimbatore' },
        { name: 'VOC Park Coimbatore', lat: 11.0278, lng: 76.9670, description: 'Public park with monitoring', district: 'Coimbatore' },
        { name: 'Ooty Hill Station', lat: 11.4102, lng: 76.6950, description: 'Tourist hill station with safety measures', district: 'The Nilgiris' },
      ]
    },
    'West Bengal': { 
      safetyScore: 64,  // Higher alert count (14 alerts)
      activeAlerts: [
        { name: 'Kolkata Park Street Crime', lat: 22.5726, lng: 88.3639, description: 'Theft and robbery in commercial area', district: 'Kolkata' },
        { name: 'Howrah Gang Territory', lat: 22.5958, lng: 88.2636, description: 'Gang-controlled industrial area', district: 'Howrah' },
        { name: 'Sealdah Station Theft', lat: 22.5675, lng: 88.3711, description: 'Railway station crime', district: 'Kolkata' },
        { name: 'New Market Pickpocket', lat: 22.5577, lng: 88.3519, description: 'Market pickpocketing', district: 'Kolkata' },
        { name: 'Gariahat Market Crime', lat: 22.5166, lng: 88.3636, description: 'Market area theft', district: 'Kolkata' },
        { name: 'Salt Lake Cyber Fraud', lat: 22.5772, lng: 88.4328, description: 'Cyber crime incidents', district: 'North 24 Parganas' },
        { name: 'Esplanade Robbery', lat: 22.5698, lng: 88.3506, description: 'Street robbery incidents', district: 'Kolkata' },
        { name: 'Burrabazar Theft', lat: 22.5779, lng: 88.3506, description: 'Commercial area theft', district: 'Kolkata' },
        { name: 'Tollygunge Crime', lat: 22.4946, lng: 88.3495, description: 'Multiple crime incidents', district: 'Kolkata' },
        { name: 'Dum Dum Violence', lat: 22.6547, lng: 88.4343, description: 'Gang violence area', district: 'North 24 Parganas' },
        { name: 'Behala Burglary', lat: 22.4991, lng: 88.3113, description: 'Residential burglary', district: 'Kolkata' },
        { name: 'Barasat Crime', lat: 22.7234, lng: 88.4840, description: 'Criminal activity zone', district: 'North 24 Parganas' },
        { name: 'Jadavpur Assault', lat: 22.4986, lng: 88.3624, description: 'Assault cases', district: 'Kolkata' },
        { name: 'Howrah Station Crime', lat: 22.5833, lng: 88.3417, description: 'Major railway station theft', district: 'Howrah' },
      ],
      safeZones: [
        { name: 'Victoria Memorial Park', lat: 22.5448, lng: 88.3426, description: 'Historic monument with security', district: 'Kolkata' },
        { name: 'Eco Park New Town', lat: 22.5818, lng: 88.4730, description: 'Modern park with CCTV coverage', district: 'North 24 Parganas' },
        { name: 'Darjeeling Mall Road', lat: 27.0410, lng: 88.2663, description: 'Tourist area with patrol', district: 'Darjeeling' },
      ]
    },
    'Telangana': { 
      safetyScore: 70,  // Moderate alerts (10 alerts)
      activeAlerts: [
        { name: 'Hyderabad HITEC City Cyber', lat: 17.4485, lng: 78.3908, description: 'Cyber crime in IT hub', district: 'Hyderabad' },
        { name: 'Charminar Pickpocket', lat: 17.3616, lng: 78.4747, description: 'Tourist spot with pickpocket activity', district: 'Hyderabad' },
        { name: 'Begumpet Burglary', lat: 17.4399, lng: 78.4669, description: 'Residential burglary incidents', district: 'Hyderabad' },
        { name: 'Kukatpally Crime', lat: 17.4948, lng: 78.4079, description: 'Multiple crime incidents', district: 'Hyderabad' },
        { name: 'Secunderabad Station Theft', lat: 17.4341, lng: 78.5012, description: 'Railway station crime', district: 'Secunderabad' },
        { name: 'Dilsukhnagar Assault', lat: 17.3687, lng: 78.5247, description: 'Assault and violence cases', district: 'Hyderabad' },
        { name: 'Madhapur Tech Fraud', lat: 17.4484, lng: 78.3908, description: 'Tech scams and fraud', district: 'Hyderabad' },
        { name: 'LB Nagar Crime', lat: 17.3420, lng: 78.5526, description: 'Criminal activity area', district: 'Rangareddy' },
        { name: 'Uppal Robbery', lat: 17.4065, lng: 78.5593, description: 'Robbery incidents', district: 'Rangareddy' },
        { name: 'Banjara Hills Theft', lat: 17.4239, lng: 78.4483, description: 'High-value theft cases', district: 'Hyderabad' },
      ],
      safeZones: [
        { name: 'Hussain Sagar Lake', lat: 17.4239, lng: 78.4738, description: 'Public lake area with security', district: 'Hyderabad' },
        { name: 'Ramoji Film City', lat: 17.2543, lng: 78.6808, description: 'Entertainment complex with security', district: 'Rangareddy' },
      ]
    },
    'Gujarat': { 
      safetyScore: 74,  // Lower-moderate alerts (8 alerts)
      activeAlerts: [
        { name: 'Ahmedabad CG Road Crime', lat: 23.0225, lng: 72.5714, description: 'Theft in commercial area', district: 'Ahmedabad' },
        { name: 'Surat Diamond Market Scam', lat: 21.1702, lng: 72.8311, description: 'Scams in diamond trading area', district: 'Surat' },
        { name: 'Maninagar Market Theft', lat: 22.9969, lng: 72.5986, description: 'Market pickpocketing', district: 'Ahmedabad' },
        { name: 'Vastrapur Burglary', lat: 23.0404, lng: 72.5245, description: 'Residential burglary', district: 'Ahmedabad' },
        { name: 'Surat Textile Market Crime', lat: 21.1702, lng: 72.8311, description: 'Commercial crime area', district: 'Surat' },
        { name: 'Vadodara Railway Crime', lat: 22.3072, lng: 73.1812, description: 'Railway station theft', district: 'Vadodara' },
        { name: 'Rajkot Market Theft', lat: 22.3039, lng: 70.8022, description: 'Market area crime', district: 'Rajkot' },
        { name: 'Ahmedabad Station Theft', lat: 23.0258, lng: 72.5873, description: 'Railway theft incidents', district: 'Ahmedabad' },
      ],
      safeZones: [
        { name: 'Sabarmati Ashram', lat: 23.0606, lng: 72.5802, description: 'Historic site with security', district: 'Ahmedabad' },
        { name: 'Dumas Beach Surat', lat: 21.0886, lng: 72.6633, description: 'Beach with patrol services', district: 'Surat' },
      ]
    },
    'Uttar Pradesh': { 
      safetyScore: 56,  // High alert count - lower score (16 alerts)
      activeAlerts: [
        { name: 'Lucknow Hazratganj Crime', lat: 26.8467, lng: 80.9462, description: 'Shopping area with theft incidents', district: 'Lucknow' },
        { name: 'Agra Taj Tourist Scam', lat: 27.1751, lng: 78.0421, description: 'Tourist scams near monument', district: 'Agra' },
        { name: 'Kanpur Gang Territory', lat: 26.4499, lng: 80.3319, description: 'Industrial area with gang activity', district: 'Kanpur' },
        { name: 'Noida Cyber Crime', lat: 28.5355, lng: 77.3910, description: 'High cyber fraud activity', district: 'Noida' },
        { name: 'Varanasi Ghat Scam', lat: 25.2820, lng: 82.9739, description: 'Tourist scams at ghats', district: 'Varanasi' },
        { name: 'Ghaziabad Industrial Crime', lat: 28.6692, lng: 77.4538, description: 'Industrial theft zone', district: 'Ghaziabad' },
        { name: 'Meerut Violence', lat: 28.9845, lng: 77.7064, description: 'Gang violence area', district: 'Meerut' },
        { name: 'Lucknow Gomti Nagar Crime', lat: 26.8569, lng: 81.0074, description: 'Residential crime', district: 'Lucknow' },
        { name: 'Kanpur Central Theft', lat: 26.4669, lng: 80.3499, description: 'Market area theft', district: 'Kanpur' },
        { name: 'Noida Sector 18 Robbery', lat: 28.5678, lng: 77.3232, description: 'Commercial area robbery', district: 'Noida' },
        { name: 'Agra Sadar Bazaar Crime', lat: 27.1767, lng: 78.0081, description: 'Market theft hotspot', district: 'Agra' },
        { name: 'Prayagraj Station Crime', lat: 25.4358, lng: 81.8463, description: 'Railway station theft', district: 'Prayagraj' },
        { name: 'Bareilly Market Theft', lat: 28.3670, lng: 79.4304, description: 'Commercial theft area', district: 'Bareilly' },
        { name: 'Varanasi Lanka Crime', lat: 25.2677, lng: 82.9913, description: 'University area crime', district: 'Varanasi' },
        { name: 'Ghaziabad Crossing Crime', lat: 28.6692, lng: 77.4538, description: 'Traffic junction crime', district: 'Ghaziabad' },
        { name: 'Greater Noida Assault', lat: 28.4744, lng: 77.5040, description: 'Assault incidents', district: 'Noida' },
      ],
      safeZones: [
        { name: 'Taj Mahal Complex', lat: 27.1751, lng: 78.0421, description: 'UNESCO site with strict security', district: 'Agra' },
        { name: 'Dashashwamedh Ghat', lat: 25.3050, lng: 83.0107, description: 'Religious site with patrol', district: 'Varanasi' },
      ]
    },
    'Punjab': { 
      safetyScore: 70,  // Moderate alerts (8 alerts)
      activeAlerts: [
        { name: 'Ludhiana Industrial Crime', lat: 30.9010, lng: 75.8573, description: 'Industrial theft incidents', district: 'Ludhiana' },
        { name: 'Jalandhar Drug Activity', lat: 31.3260, lng: 75.5762, description: 'Drug-related crime activity', district: 'Jalandhar' },
        { name: 'Amritsar Market Theft', lat: 31.6340, lng: 74.8723, description: 'Market pickpocketing', district: 'Amritsar' },
        { name: 'Patiala Crime Zone', lat: 30.3398, lng: 76.3869, description: 'Multiple crime incidents', district: 'Patiala' },
        { name: 'Ludhiana Market Crime', lat: 30.9010, lng: 75.8573, description: 'Commercial theft area', district: 'Ludhiana' },
        { name: 'Jalandhar Robbery', lat: 31.3260, lng: 75.5762, description: 'Armed robbery cases', district: 'Jalandhar' },
        { name: 'Bathinda Drug Zone', lat: 30.2110, lng: 74.9455, description: 'Drug trafficking area', district: 'Bathinda' },
        { name: 'Mohali Cyber Fraud', lat: 30.7046, lng: 76.7179, description: 'Cyber crime hotspot', district: 'Mohali' },
      ],
      safeZones: [
        { name: 'Golden Temple Complex', lat: 31.6200, lng: 74.8765, description: 'Religious site with comprehensive security', district: 'Amritsar' },
        { name: 'Rock Garden Chandigarh', lat: 30.7520, lng: 76.8069, description: 'Tourist attraction with security', district: 'Chandigarh' },
      ]
    },
    'Kerala': { 
      safetyScore: 88,  // Very few alerts - high safety (3 alerts)
      activeAlerts: [
        { name: 'Kochi Fort Area Scam', lat: 9.9654, lng: 76.2424, description: 'Tourist scams in fort area', district: 'Kochi' },
        { name: 'Thiruvananthapuram Market Theft', lat: 8.5241, lng: 76.9366, description: 'Market pickpocketing', district: 'Thiruvananthapuram' },
        { name: 'Kozhikode Beach Theft', lat: 11.2588, lng: 75.7804, description: 'Beach area theft', district: 'Kozhikode' },
      ],
      safeZones: [
        { name: 'Fort Kochi Beach', lat: 9.9654, lng: 76.2424, description: 'Tourist beach with patrol', district: 'Kochi' },
        { name: 'Alleppey Backwaters', lat: 9.4981, lng: 76.3388, description: 'Tourist area with safety measures', district: 'Alappuzha' },
        { name: 'Munnar Tea Gardens', lat: 10.0889, lng: 77.0595, description: 'Hill station with security', district: 'Idukki' },
      ]
    },
    'Rajasthan': { 
      safetyScore: 69,  // Moderate-high alerts (8 alerts)
      activeAlerts: [
        { name: 'Jaipur Pink City Tourist Scam', lat: 26.9124, lng: 75.7873, description: 'Tourist scams in heritage area', district: 'Jaipur' },
        { name: 'Jodhpur Market Theft', lat: 26.2389, lng: 73.0243, description: 'Market pickpocketing', district: 'Jodhpur' },
        { name: 'Udaipur Tourist Scam', lat: 24.5854, lng: 73.7125, description: 'Tourist-targeted scams', district: 'Udaipur' },
        { name: 'Jaipur MI Road Crime', lat: 26.9124, lng: 75.7873, description: 'Commercial area theft', district: 'Jaipur' },
        { name: 'Ajmer Dargah Scam', lat: 26.4559, lng: 74.6399, description: 'Religious site scams', district: 'Ajmer' },
        { name: 'Bikaner Theft', lat: 28.0229, lng: 73.3119, description: 'Market area crime', district: 'Bikaner' },
        { name: 'Jaisalmer Fort Scam', lat: 26.9157, lng: 70.9083, description: 'Tourist scams', district: 'Jaisalmer' },
        { name: 'Kota Crime Zone', lat: 25.2138, lng: 75.8648, description: 'Multiple crime incidents', district: 'Kota' },
      ],
      safeZones: [
        { name: 'Hawa Mahal Area', lat: 26.9239, lng: 75.8267, description: 'Heritage site with security', district: 'Jaipur' },
        { name: 'Udaipur City Palace', lat: 24.5764, lng: 73.6833, description: 'Palace complex with monitoring', district: 'Udaipur' },
        { name: 'Jaisalmer Fort', lat: 26.9157, lng: 70.9083, description: 'UNESCO heritage with patrol', district: 'Jaisalmer' },
      ]
    },
    'Madhya Pradesh': { 
      safetyScore: 67,  // Moderate-high alerts (7 alerts)
      activeAlerts: [
        { name: 'Indore Sarafa Bazaar Theft', lat: 22.7196, lng: 75.8577, description: 'Market area with theft incidents', district: 'Indore' },
        { name: 'Bhopal New Market Crime', lat: 23.2599, lng: 77.4126, description: 'Market theft hotspot', district: 'Bhopal' },
        { name: 'Gwalior Crime Zone', lat: 26.2183, lng: 78.1828, description: 'Multiple crime incidents', district: 'Gwalior' },
        { name: 'Jabalpur Market Theft', lat: 23.1815, lng: 79.9864, description: 'Commercial area theft', district: 'Jabalpur' },
        { name: 'Indore Rajwada Crime', lat: 22.7196, lng: 75.8577, description: 'Historical area crime', district: 'Indore' },
        { name: 'Bhopal Station Theft', lat: 23.2699, lng: 77.4134, description: 'Railway station crime', district: 'Bhopal' },
        { name: 'Ujjain Temple Scam', lat: 23.1765, lng: 75.7885, description: 'Religious site scams', district: 'Ujjain' },
      ],
      safeZones: [
        { name: 'Upper Lake Bhopal', lat: 23.2400, lng: 77.3280, description: 'Lake area with security patrol', district: 'Bhopal' },
        { name: 'Khajuraho Temples', lat: 24.8318, lng: 79.9199, description: 'UNESCO site with security', district: 'Chhatarpur' },
      ]
    },
    'Andhra Pradesh': { 
      safetyScore: 73, 
      activeAlerts: [
        { name: 'Vijayawada Gang Territory', lat: 16.5062, lng: 80.6480, description: 'Gang-controlled area', district: 'Vijayawada' },
      ],
      safeZones: [
        { name: 'RK Beach Visakhapatnam', lat: 17.7231, lng: 83.3250, description: 'Beach with patrol services', district: 'Visakhapatnam' },
        { name: 'Tirupati Temple Complex', lat: 13.6288, lng: 79.4192, description: 'Religious site with strict security', district: 'Tirupati' },
      ]
    },
    'Haryana': { 
      safetyScore: 69, 
      activeAlerts: [
        { name: 'Gurgaon Cyber Hub Crime', lat: 28.4595, lng: 77.0266, description: 'Cyber crime in IT area', district: 'Gurgaon' },
        { name: 'Faridabad Industrial Theft', lat: 28.4089, lng: 77.3178, description: 'Industrial theft activity', district: 'Faridabad' },
      ],
      safeZones: [
        { name: 'Kingdom of Dreams', lat: 28.4705, lng: 77.0704, description: 'Entertainment complex with security', district: 'Gurgaon' },
        { name: 'Sukhna Lake Chandigarh', lat: 30.7420, lng: 76.8185, description: 'Lake with security patrol', district: 'Panchkula' },
      ]
    },
    'Assam': { 
      safetyScore: 71, 
      activeAlerts: [
        { name: 'Dibrugarh Border Crime', lat: 27.4728, lng: 94.9120, description: 'Border area security concerns', district: 'Dibrugarh' },
      ],
      safeZones: [
        { name: 'Kamakhya Temple', lat: 26.1654, lng: 91.7006, description: 'Religious site with security', district: 'Guwahati' },
        { name: 'Kaziranga National Park', lat: 26.5775, lng: 93.1711, description: 'Protected area with monitoring', district: 'Golaghat' },
      ]
    },
    'Goa': { 
      safetyScore: 82, 
      activeAlerts: [
        { name: 'Baga Beach Tourist Scam', lat: 15.5547, lng: 73.7514, description: 'Tourist scams on beach', district: 'North Goa' },
        { name: 'Calangute Drug Zone', lat: 15.5438, lng: 73.7555, description: 'Drug-related activity', district: 'North Goa' },
      ],
      safeZones: [
        { name: 'Basilica of Bom Jesus', lat: 15.5007, lng: 73.9114, description: 'UNESCO site with security', district: 'South Goa' },
        { name: 'Anjuna Flea Market', lat: 15.5739, lng: 73.7400, description: 'Market area with patrol', district: 'North Goa' },
      ]
    },
    'Bihar': { 
      safetyScore: 60, 
      activeAlerts: [
        { name: 'Patna Gandhi Maidan Crime', lat: 25.5941, lng: 85.1376, description: 'Public area with crime incidents', district: 'Patna' },
        { name: 'Muzaffarpur Gang Territory', lat: 26.1225, lng: 85.3906, description: 'Gang-controlled area', district: 'Muzaffarpur' },
      ],
      safeZones: [
        { name: 'Mahabodhi Temple', lat: 24.6959, lng: 84.9911, description: 'UNESCO heritage site with security', district: 'Gaya' },
      ]
    },
    'Odisha': { 
      safetyScore: 72, 
      activeAlerts: [
        { name: 'Puri Beach Scam', lat: 19.8135, lng: 85.8312, description: 'Tourist scams on beach', district: 'Puri' },
      ],
      safeZones: [
        { name: 'Jagannath Temple Puri', lat: 19.8048, lng: 85.8314, description: 'Religious site with strict security', district: 'Puri' },
        { name: 'Konark Sun Temple', lat: 19.8876, lng: 86.0945, description: 'UNESCO heritage with security', district: 'Puri' },
      ]
    },
    'Jharkhand': { 
      safetyScore: 66, 
      activeAlerts: [
        { name: 'Ranchi Main Road Crime', lat: 23.3441, lng: 85.3096, description: 'Theft on main roads', district: 'Ranchi' },
        { name: 'Jamshedpur Industrial Theft', lat: 22.8046, lng: 86.2029, description: 'Industrial area theft', district: 'Jamshedpur' },
      ],
      safeZones: [
        { name: 'Ranchi Hill Station', lat: 23.3629, lng: 85.3346, description: 'Hill area with safety measures', district: 'Ranchi' },
      ]
    },
    'Chhattisgarh': { 
      safetyScore: 71, 
      activeAlerts: [
        { name: 'Bhilai Industrial Crime', lat: 21.2167, lng: 81.3833, description: 'Industrial theft incidents', district: 'Bhilai' },
      ],
      safeZones: [
        { name: 'Nandan Van Zoo', lat: 21.2379, lng: 81.6337, description: 'Zoo with security coverage', district: 'Raipur' },
      ]
    },
    'Uttarakhand': { 
      safetyScore: 83, 
      activeAlerts: [
        { name: 'Haridwar Ghat Scam', lat: 29.9457, lng: 78.1642, description: 'Tourist scams at religious site', district: 'Haridwar' },
      ],
      safeZones: [
        { name: 'Mussoorie Mall Road', lat: 30.4598, lng: 78.0644, description: 'Tourist area with patrol', district: 'Dehradun' },
        { name: 'Har Ki Pauri Haridwar', lat: 29.9457, lng: 78.1642, description: 'Religious ghat with security', district: 'Haridwar' },
        { name: 'Rishikesh Ashram Area', lat: 30.0869, lng: 78.2676, description: 'Spiritual area with monitoring', district: 'Dehradun' },
      ]
    },
    'Himachal Pradesh': { 
      safetyScore: 88, 
      activeAlerts: [
        { name: 'Manali Tourist Scam', lat: 32.2396, lng: 77.1887, description: 'Tourist scams in hill station', district: 'Manali' },
      ],
      safeZones: [
        { name: 'The Ridge Shimla', lat: 31.1033, lng: 77.1722, description: 'Tourist area with security', district: 'Shimla' },
        { name: 'Mall Road Manali', lat: 32.2432, lng: 77.1892, description: 'Commercial area with patrol', district: 'Manali' },
      ]
    },
    'Jammu & Kashmir': { 
      safetyScore: 58, 
      activeAlerts: [
        { name: 'Jammu City Pickpocket', lat: 32.7266, lng: 74.8570, description: 'Pickpocket activity in city', district: 'Jammu' },
      ],
      safeZones: [
        { name: 'Shalimar Bagh Srinagar', lat: 34.1362, lng: 74.8748, description: 'Garden with security measures', district: 'Srinagar' },
        { name: 'Dal Lake Area', lat: 34.1205, lng: 74.8409, description: 'Tourist area with patrol', district: 'Srinagar' },
      ]
    },
    'Tripura': { 
      safetyScore: 75, 
      activeAlerts: [],
      safeZones: [
        { name: 'Ujjayanta Palace', lat: 23.8366, lng: 91.2791, description: 'Palace museum with security', district: 'Agartala' },
      ]
    },
    'Meghalaya': { 
      safetyScore: 77, 
      activeAlerts: [],
      safeZones: [
        { name: 'Ward Lake Shillong', lat: 25.5681, lng: 91.8800, description: 'Lake area with patrol', district: 'Shillong' },
        { name: 'Living Root Bridges', lat: 25.2579, lng: 91.7185, description: 'Tourist site with monitoring', district: 'Cherrapunji' },
      ]
    },
    'Manipur': { 
      safetyScore: 64, 
      activeAlerts: [],
      safeZones: [
        { name: 'Loktak Lake', lat: 24.5332, lng: 93.7791, description: 'Lake with monitoring', district: 'Imphal East' },
      ]
    },
    'Mizoram': { 
      safetyScore: 79, 
      activeAlerts: [],
      safeZones: [
        { name: 'Solomon Temple', lat: 23.7367, lng: 92.7177, description: 'Religious site with security', district: 'Aizawl' },
      ]
    },
    'Nagaland': { 
      safetyScore: 73, 
      activeAlerts: [],
      safeZones: [
        { name: 'Kohima War Cemetery', lat: 25.6751, lng: 94.1086, description: 'Memorial site with security', district: 'Kohima' },
      ]
    },
    'Arunachal Pradesh': { 
      safetyScore: 81, 
      activeAlerts: [],
      safeZones: [
        { name: 'Tawang Monastery', lat: 27.5861, lng: 91.8589, description: 'Monastery with security', district: 'Itanagar' },
      ]
    },
    'Sikkim': { 
      safetyScore: 90, 
      activeAlerts: [],
      safeZones: [
        { name: 'Tsomgo Lake', lat: 27.3633, lng: 88.7542, description: 'Lake with safety measures', district: 'Gangtok' },
        { name: 'MG Marg Gangtok', lat: 27.3314, lng: 88.6138, description: 'Shopping area with security', district: 'Gangtok' },
      ]
    },
    'Chandigarh': { 
      safetyScore: 84, 
      activeAlerts: [],
      safeZones: [
        { name: 'Sukhna Lake', lat: 30.7420, lng: 76.8185, description: 'Lake with security patrol', district: 'Chandigarh' },
        { name: 'Rock Garden', lat: 30.7520, lng: 76.8069, description: 'Tourist attraction with security', district: 'Chandigarh' },
      ]
    },
    'Puducherry': { 
      safetyScore: 80, 
      activeAlerts: [],
      safeZones: [
        { name: 'Auroville Beach', lat: 12.0050, lng: 79.8092, description: 'Beach with safety measures', district: 'Puducherry' },
        { name: 'Promenade Beach', lat: 11.9270, lng: 79.8316, description: 'Beach with patrol', district: 'Puducherry' },
      ]
    },
    'Lakshadweep': { 
      safetyScore: 95, 
      activeAlerts: [],
      safeZones: [
        { name: 'Agatti Island Beach', lat: 10.8524, lng: 72.1920, description: 'Island beach with patrol', district: 'Kavaratti' },
      ]
    },
    'Andaman & Nicobar': { 
      safetyScore: 92, 
      activeAlerts: [],
      safeZones: [
        { name: 'Cellular Jail Area', lat: 11.6737, lng: 92.7464, description: 'Historic site with security', district: 'Port Blair' },
        { name: 'Radhanagar Beach', lat: 12.0015, lng: 92.9614, description: 'Beach with safety patrol', district: 'Port Blair' },
      ]
    },
    'Dadra & Nagar Haveli': { 
      safetyScore: 85, 
      activeAlerts: [],
      safeZones: [
        { name: 'Vanganga Lake Garden', lat: 20.2741, lng: 73.0169, description: 'Garden with monitoring', district: 'Silvassa' },
      ]
    },
    'Ladakh': { 
      safetyScore: 87, 
      activeAlerts: [],
      safeZones: [
        { name: 'Pangong Lake', lat: 33.7337, lng: 78.7515, description: 'Lake with security measures', district: 'Leh' },
        { name: 'Leh Palace Area', lat: 34.1642, lng: 77.5847, description: 'Historic area with monitoring', district: 'Leh' },
      ]
    },
  };

  // Crime areas data with district information and SVG coordinates
  const allRegionData: {[key: string]: any[]} = {
    'Delhi': [
      { id: 1, name: 'Connaught Place Gang Activity', type: 'gang', severity: 'high', lat: 28.6315, lng: 77.2167, x: 52, y: 28, district: 'Central Delhi' },
      { id: 2, name: 'Sarojini Nagar Theft Hotspot', type: 'theft', severity: 'high', lat: 28.5753, lng: 77.1923, x: 48, y: 34, district: 'South Delhi' },
      { id: 3, name: 'Dwarka Drug Activity Zone', type: 'drug', severity: 'medium', lat: 28.5921, lng: 77.0460, x: 32, y: 32, district: 'South West Delhi' },
      { id: 4, name: 'Rohini Vandalism Area', type: 'vandalism', severity: 'low', lat: 28.7496, lng: 77.0672, x: 34, y: 15, district: 'North West Delhi' },
      { id: 'ds1', name: 'Lodhi Garden Park', type: 'safe', severity: 'safe', lat: 28.5931, lng: 77.2197, x: 52, y: 33, district: 'Central Delhi' },
      { id: 'ds2', name: 'Nehru Place Metro Station', type: 'safe', severity: 'safe', lat: 28.5494, lng: 77.2500, x: 57, y: 37, district: 'South Delhi' },
      { id: 'ds3', name: 'India Gate Monument', type: 'safe', severity: 'safe', lat: 28.6129, lng: 77.2295, x: 54, y: 29, district: 'New Delhi' },
    ],
    'Maharashtra': [
      { id: 1, name: 'Colaba Tourist Scam', type: 'theft', severity: 'medium', lat: 18.9220, lng: 72.8347, x: 45, y: 60, district: 'Mumbai City' },
      { id: 2, name: 'Dharavi Gang Territory', type: 'gang', severity: 'high', lat: 19.0378, lng: 72.8520, x: 47, y: 55, district: 'Mumbai Suburban' },
      { id: 3, name: 'Nagpur Central Crime', type: 'theft', severity: 'high', lat: 21.1458, lng: 79.0882, x: 72, y: 35, district: 'Nagpur' },
      { id: 'ms1', name: 'Marine Drive Promenade', type: 'safe', severity: 'safe', lat: 18.9432, lng: 72.8236, x: 44, y: 62, district: 'Mumbai City' },
      { id: 'ms2', name: 'Gateway of India', type: 'safe', severity: 'safe', lat: 18.9220, lng: 72.8347, x: 45, y: 63, district: 'Mumbai City' },
      { id: 'ms3', name: 'Bandra Fort Area', type: 'safe', severity: 'safe', lat: 19.0459, lng: 72.8206, x: 43, y: 56, district: 'Mumbai Suburban' },
    ],
    'Karnataka': [
      { id: 1, name: 'Bangalore Cyber Crime Hub', type: 'theft', severity: 'medium', lat: 12.9716, lng: 77.5946, x: 55, y: 72, district: 'Bengaluru Urban' },
      { id: 'ks1', name: 'Cubbon Park', type: 'safe', severity: 'safe', lat: 12.9762, lng: 77.5929, x: 54, y: 73, district: 'Bengaluru Urban' },
      { id: 'ks2', name: 'Lalbagh Garden', type: 'safe', severity: 'safe', lat: 12.9507, lng: 77.5848, x: 53, y: 74, district: 'Bengaluru Urban' },
      { id: 'ks3', name: 'Mysore Palace Area', type: 'safe', severity: 'safe', lat: 12.3052, lng: 76.6552, x: 48, y: 78, district: 'Mysuru' },
    ],
    'Tamil Nadu': [
      { id: 1, name: 'Chennai Beach Road Theft', type: 'theft', severity: 'medium', lat: 13.0827, lng: 80.2707, x: 62, y: 70, district: 'Chennai' },
      { id: 2, name: 'T-Nagar Market Pickpocket', type: 'theft', severity: 'low', lat: 13.0418, lng: 80.2341, x: 61, y: 71, district: 'Chennai' },
      { id: 'ts1', name: 'Marina Beach South', type: 'safe', severity: 'safe', lat: 13.0475, lng: 80.2824, x: 63, y: 72, district: 'Chennai' },
      { id: 'ts2', name: 'Mahabalipuram Shore Temple', type: 'safe', severity: 'safe', lat: 12.6169, lng: 80.1932, x: 60, y: 76, district: 'Chengalpattu' },
    ],
    'West Bengal': [
      { id: 1, name: 'Kolkata Park Street Crime', type: 'theft', severity: 'high', lat: 22.5726, lng: 88.3639, x: 70, y: 42, district: 'Kolkata' },
      { id: 2, name: 'Howrah Gang Territory', type: 'gang', severity: 'high', lat: 22.5958, lng: 88.2636, x: 68, y: 41, district: 'Howrah' },
      { id: 'ws1', name: 'Victoria Memorial Park', type: 'safe', severity: 'safe', lat: 22.5448, lng: 88.3426, x: 69, y: 43, district: 'Kolkata' },
      { id: 'ws2', name: 'Eco Park New Town', type: 'safe', severity: 'safe', lat: 22.5818, lng: 88.4730, x: 72, y: 42, district: 'North 24 Parganas' },
    ],
    'Telangana': [
      { id: 1, name: 'Hyderabad HITEC City Cyber', type: 'theft', severity: 'medium', lat: 17.4485, lng: 78.3908, x: 58, y: 64, district: 'Hyderabad' },
      { id: 2, name: 'Charminar Pickpocket', type: 'theft', severity: 'low', lat: 17.3616, lng: 78.4747, x: 59, y: 65, district: 'Hyderabad' },
      { id: 'tls1', name: 'Hussain Sagar Lake', type: 'safe', severity: 'safe', lat: 17.4239, lng: 78.4738, x: 59, y: 63, district: 'Hyderabad' },
      { id: 'tls2', name: 'Ramoji Film City', type: 'safe', severity: 'safe', lat: 17.2543, lng: 78.6808, x: 60, y: 67, district: 'Rangareddy' },
    ],
    'Gujarat': [
      { id: 1, name: 'Ahmedabad CG Road Crime', type: 'theft', severity: 'medium', lat: 23.0225, lng: 72.5714, x: 42, y: 40, district: 'Ahmedabad' },
      { id: 2, name: 'Surat Diamond Market Scam', type: 'theft', severity: 'low', lat: 21.1702, lng: 72.8311, x: 44, y: 48, district: 'Surat' },
      { id: 'gs1', name: 'Sabarmati Ashram', type: 'safe', severity: 'safe', lat: 23.0606, lng: 72.5802, x: 42, y: 39, district: 'Ahmedabad' },
      { id: 'gs2', name: 'Dumas Beach Surat', type: 'safe', severity: 'safe', lat: 21.0886, lng: 72.6633, x: 43, y: 49, district: 'Surat' },
    ],
    'Uttar Pradesh': [
      { id: 1, name: 'Lucknow Hazratganj Crime', type: 'theft', severity: 'medium', lat: 26.8467, lng: 80.9462, x: 64, y: 32, district: 'Lucknow' },
      { id: 2, name: 'Agra Taj Tourist Scam', type: 'theft', severity: 'low', lat: 27.1751, lng: 78.0421, x: 56, y: 30, district: 'Agra' },
      { id: 3, name: 'Kanpur Gang Territory', type: 'gang', severity: 'high', lat: 26.4499, lng: 80.3319, x: 62, y: 34, district: 'Kanpur' },
      { id: 4, name: 'Noida Cyber Crime', type: 'theft', severity: 'medium', lat: 28.5355, lng: 77.3910, x: 54, y: 27, district: 'Noida' },
      { id: 'ups1', name: 'Taj Mahal Complex', type: 'safe', severity: 'safe', lat: 27.1751, lng: 78.0421, x: 56, y: 31, district: 'Agra' },
      { id: 'ups2', name: 'Dashashwamedh Ghat', type: 'safe', severity: 'safe', lat: 25.3050, lng: 83.0107, x: 68, y: 38, district: 'Varanasi' },
    ],
    'Punjab': [
      { id: 1, name: 'Ludhiana Industrial Crime', type: 'theft', severity: 'medium', lat: 30.9010, lng: 75.8573, x: 50, y: 20, district: 'Ludhiana' },
      { id: 2, name: 'Jalandhar Drug Activity', type: 'drug', severity: 'medium', lat: 31.3260, lng: 75.5762, x: 48, y: 18, district: 'Jalandhar' },
      { id: 'ps1', name: 'Golden Temple Complex', type: 'safe', severity: 'safe', lat: 31.6200, lng: 74.8765, x: 46, y: 17, district: 'Amritsar' },
      { id: 'ps2', name: 'Rock Garden Chandigarh', type: 'safe', severity: 'safe', lat: 30.7520, lng: 76.8069, x: 52, y: 21, district: 'Chandigarh' },
    ],
    'Kerala': [
      { id: 'ks1', name: 'Fort Kochi Beach', type: 'safe', severity: 'safe', lat: 9.9654, lng: 76.2424, x: 48, y: 84, district: 'Kochi' },
      { id: 'ks2', name: 'Alleppey Backwaters', type: 'safe', severity: 'safe', lat: 9.4981, lng: 76.3388, x: 49, y: 86, district: 'Alappuzha' },
      { id: 'ks3', name: 'Munnar Tea Gardens', type: 'safe', severity: 'safe', lat: 10.0889, lng: 77.0595, x: 52, y: 83, district: 'Idukki' },
    ],
    'Rajasthan': [
      { id: 1, name: 'Jaipur Pink City Tourist Scam', type: 'theft', severity: 'low', lat: 26.9124, lng: 75.7873, x: 50, y: 32, district: 'Jaipur' },
      { id: 'rs1', name: 'Hawa Mahal Area', type: 'safe', severity: 'safe', lat: 26.9239, lng: 75.8267, x: 51, y: 32, district: 'Jaipur' },
      { id: 'rs2', name: 'Udaipur City Palace', type: 'safe', severity: 'safe', lat: 24.5764, lng: 73.6833, x: 42, y: 38, district: 'Udaipur' },
      { id: 'rs3', name: 'Jaisalmer Fort', type: 'safe', severity: 'safe', lat: 26.9157, lng: 70.9083, x: 38, y: 32, district: 'Jaisalmer' },
    ],
    'Madhya Pradesh': [
      { id: 1, name: 'Indore Sarafa Bazaar Theft', type: 'theft', severity: 'medium', lat: 22.7196, lng: 75.8577, x: 51, y: 42, district: 'Indore' },
      { id: 'mps1', name: 'Upper Lake Bhopal', type: 'safe', severity: 'safe', lat: 23.2400, lng: 77.3280, x: 55, y: 40, district: 'Bhopal' },
      { id: 'mps2', name: 'Khajuraho Temples', type: 'safe', severity: 'safe', lat: 24.8318, lng: 79.9199, x: 62, y: 37, district: 'Chhatarpur' },
    ],
    'Andhra Pradesh': [
      { id: 1, name: 'Vijayawada Gang Territory', type: 'gang', severity: 'medium', lat: 16.5062, lng: 80.6480, x: 63, y: 66, district: 'Vijayawada' },
      { id: 'aps1', name: 'RK Beach Visakhapatnam', type: 'safe', severity: 'safe', lat: 17.7231, lng: 83.3250, x: 68, y: 63, district: 'Visakhapatnam' },
      { id: 'aps2', name: 'Tirupati Temple Complex', type: 'safe', severity: 'safe', lat: 13.6288, lng: 79.4192, x: 60, y: 72, district: 'Tirupati' },
    ],
    'Haryana': [
      { id: 1, name: 'Gurgaon Cyber Hub Crime', type: 'theft', severity: 'medium', lat: 28.4595, lng: 77.0266, x: 50, y: 28, district: 'Gurgaon' },
      { id: 2, name: 'Faridabad Industrial Theft', type: 'theft', severity: 'medium', lat: 28.4089, lng: 77.3178, x: 54, y: 28, district: 'Faridabad' },
      { id: 'hs1', name: 'Kingdom of Dreams', type: 'safe', severity: 'safe', lat: 28.4705, lng: 77.0704, x: 51, y: 27, district: 'Gurgaon' },
    ],
    'Assam': [
      { id: 1, name: 'Dibrugarh Border Crime', type: 'gang', severity: 'medium', lat: 27.4728, lng: 94.9120, x: 78, y: 30, district: 'Dibrugarh' },
      { id: 'as1', name: 'Kamakhya Temple', type: 'safe', severity: 'safe', lat: 26.1654, lng: 91.7006, x: 74, y: 34, district: 'Guwahati' },
      { id: 'as2', name: 'Kaziranga National Park', type: 'safe', severity: 'safe', lat: 26.5775, lng: 93.1711, x: 76, y: 33, district: 'Golaghat' },
    ],
    'Goa': [
      { id: 1, name: 'Baga Beach Tourist Scam', type: 'theft', severity: 'low', lat: 15.5547, lng: 73.7514, x: 43, y: 67, district: 'North Goa' },
      { id: 2, name: 'Calangute Drug Zone', type: 'drug', severity: 'low', lat: 15.5438, lng: 73.7555, x: 43, y: 68, district: 'North Goa' },
      { id: 'goas1', name: 'Basilica of Bom Jesus', type: 'safe', severity: 'safe', lat: 15.5007, lng: 73.9114, x: 44, y: 69, district: 'South Goa' },
    ],
    'Bihar': [
      { id: 1, name: 'Patna Gandhi Maidan Crime', type: 'theft', severity: 'high', lat: 25.5941, lng: 85.1376, x: 70, y: 37, district: 'Patna' },
      { id: 2, name: 'Muzaffarpur Gang Territory', type: 'gang', severity: 'high', lat: 26.1225, lng: 85.3906, x: 71, y: 35, district: 'Muzaffarpur' },
      { id: 'bs1', name: 'Mahabodhi Temple', type: 'safe', severity: 'safe', lat: 24.6959, lng: 84.9911, x: 70, y: 38, district: 'Gaya' },
    ],
    'Odisha': [
      { id: 1, name: 'Puri Beach Scam', type: 'theft', severity: 'low', lat: 19.8135, lng: 85.8312, x: 72, y: 54, district: 'Puri' },
      { id: 'os1', name: 'Jagannath Temple Puri', type: 'safe', severity: 'safe', lat: 19.8048, lng: 85.8314, x: 72, y: 55, district: 'Puri' },
      { id: 'os2', name: 'Konark Sun Temple', type: 'safe', severity: 'safe', lat: 19.8876, lng: 86.0945, x: 73, y: 53, district: 'Puri' },
    ],
    'Jharkhand': [
      { id: 1, name: 'Ranchi Main Road Crime', type: 'theft', severity: 'medium', lat: 23.3441, lng: 85.3096, x: 71, y: 40, district: 'Ranchi' },
      { id: 2, name: 'Jamshedpur Industrial Theft', type: 'theft', severity: 'medium', lat: 22.8046, lng: 86.2029, x: 72, y: 42, district: 'Jamshedpur' },
      { id: 'js1', name: 'Ranchi Hill Station', type: 'safe', severity: 'safe', lat: 23.3629, lng: 85.3346, x: 71, y: 39, district: 'Ranchi' },
    ],
    'Chhattisgarh': [
      { id: 1, name: 'Bhilai Industrial Crime', type: 'theft', severity: 'medium', lat: 21.2167, lng: 81.3833, x: 65, y: 48, district: 'Bhilai' },
      { id: 'cs1', name: 'Nandan Van Zoo', type: 'safe', severity: 'safe', lat: 21.2379, lng: 81.6337, x: 66, y: 47, district: 'Raipur' },
    ],
    'Uttarakhand': [
      { id: 1, name: 'Haridwar Ghat Scam', type: 'theft', severity: 'low', lat: 29.9457, lng: 78.1642, x: 56, y: 23, district: 'Haridwar' },
      { id: 'uks1', name: 'Mussoorie Mall Road', type: 'safe', severity: 'safe', lat: 30.4598, lng: 78.0644, x: 56, y: 21, district: 'Dehradun' },
      { id: 'uks2', name: 'Rishikesh Ashram Area', type: 'safe', severity: 'safe', lat: 30.0869, lng: 78.2676, x: 57, y: 23, district: 'Dehradun' },
    ],
    'Himachal Pradesh': [
      { id: 1, name: 'Manali Tourist Scam', type: 'theft', severity: 'low', lat: 32.2396, lng: 77.1887, x: 53, y: 16, district: 'Manali' },
      { id: 'hps1', name: 'The Ridge Shimla', type: 'safe', severity: 'safe', lat: 31.1033, lng: 77.1722, x: 53, y: 20, district: 'Shimla' },
      { id: 'hps2', name: 'Mall Road Manali', type: 'safe', severity: 'safe', lat: 32.2432, lng: 77.1892, x: 53, y: 17, district: 'Manali' },
    ],
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#FF6EC7';
      case 'medium': return '#FFA500';
      case 'low': return '#FFD700';
      case 'safe': return '#3BE39C';
      default: return '#94A3B8';
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#FF3366';
      case 'medium': return '#FFA500';
      case 'low': return '#FFD700';
      case 'safe': return '#3BE39C';
      default: return '#94A3B8';
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: {[key: string]: string} = {
      gang: '👥',
      theft: '🏴‍☠️',
      drug: '💊',
      vandalism: '🔨',
      danger: '⚠️',
      safe: '✅',
      historical: '📜',
      crowded: '👨‍👩‍👧‍👦',
    };
    return icons[type] || '📍';
  };

  // Get crime areas for selected region and district
  const crimeAreas = selectedLocation?.state
    ? (allRegionData[selectedLocation.state] || []).filter(area => 
        !selectedLocation.district || area.district === selectedLocation.district
      )
    : [];

  const getFilteredAreas = () => {
    let filtered = crimeAreas;

    if (selectedFilter === 'all') return filtered;
    if (['gang', 'theft', 'drug', 'vandalism', 'danger', 'safe', 'historical', 'crowded'].includes(selectedFilter)) {
      return filtered.filter(a => a.type === selectedFilter);
    }
    if (['high', 'medium', 'low'].includes(selectedFilter)) {
      return filtered.filter(a => a.severity === selectedFilter);
    }
    
    return filtered;
  };

  const filteredAreas = getFilteredAreas();

  const handleAlertClick = (alert: AlertLocation) => {
    // Focus Google map on this alert
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.setCenter({ lat: alert.lat, lng: alert.lng });
      googleMapInstanceRef.current.setZoom(15);
    }
  };

  const handleSafeZoneClick = (zone: SafeZoneLocation) => {
    // Focus Google map on this safe zone
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.setCenter({ lat: zone.lat, lng: zone.lng });
      googleMapInstanceRef.current.setZoom(15);
    }
  };

  // Update metrics when location changes
  useEffect(() => {
    if (selectedLocation?.state && onMetricsUpdate) {
      const metrics = regionMetrics[selectedLocation.state];
      if (metrics) {
        const district = selectedLocation.district;
        const activeAlertsCount = district 
          ? metrics.activeAlerts.filter(a => a.district === district).length
          : metrics.activeAlerts.length;
        const safeZonesCount = district
          ? metrics.safeZones.filter(z => z.district === district).length
          : metrics.safeZones.length;

        // Get district-specific safety score if available
        let safetyScore = metrics.safetyScore; // Default to state score
        if (district) {
          const stateDistricts = districtMetrics[selectedLocation.state];
          const districtData = stateDistricts?.[district];
          if (districtData) {
            safetyScore = districtData.safetyScore;
          }
        }

        onMetricsUpdate({
          location: district ? `${district}, ${selectedLocation.state}` : selectedLocation.state,
          safetyScore: safetyScore,
          activeAlerts: activeAlertsCount,
          safeZones: safeZonesCount,
        });
      }
    }
  }, [selectedLocation, onMetricsUpdate]);

  // Initialize Google Maps when location changes
  useEffect(() => {
    if (!selectedLocation?.state || !googleMapRef.current || !isGoogleMapsLoaded()) return;

    // Clear existing markers and circle overlays
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    circleOverlaysRef.current.forEach(circle => circle.setMap(null));
    circleOverlaysRef.current = [];

    // Recalculate filtered areas inside the effect
    const currentCrimeAreas = selectedLocation?.state
      ? (allRegionData[selectedLocation.state] || []).filter(area => 
          !selectedLocation.district || area.district === selectedLocation.district
        )
      : [];

    const currentFilteredAreas = (() => {
      let filtered = currentCrimeAreas;
      if (selectedFilter === 'all') return filtered;
      if (['gang', 'theft', 'drug', 'vandalism', 'danger', 'safe', 'historical', 'crowded'].includes(selectedFilter)) {
        return filtered.filter(a => a.type === selectedFilter);
      }
      if (['high', 'medium', 'low'].includes(selectedFilter)) {
        return filtered.filter(a => a.severity === selectedFilter);
      }
      return filtered;
    })();

    // Get current metrics for alerts and safe zones
    const currentMetrics = regionMetrics[selectedLocation.state];
    const filteredAlerts = currentMetrics?.activeAlerts.filter(a => 
      !selectedLocation?.district || a.district === selectedLocation.district
    ) || [];
    const filteredSafeZones = currentMetrics?.safeZones.filter(z => 
      !selectedLocation?.district || z.district === selectedLocation.district
    ) || [];

    // Calculate map center based on district or state
    let mapCenter;
    let mapZoom;
    
    if (selectedLocation.district) {
      // If district is selected, try to use district-specific center first
      const stateDistricts = districtMetrics[selectedLocation.state];
      const districtData = stateDistricts?.[selectedLocation.district];
      
      if (districtData) {
        // Use predefined district center
        mapCenter = { lat: districtData.centerLat, lng: districtData.centerLng };
        mapZoom = 12;
      } else if (currentFilteredAreas.length > 0) {
        // Fallback: calculate from markers
        const avgLat = currentFilteredAreas.reduce((sum, area) => sum + area.lat, 0) / currentFilteredAreas.length;
        const avgLng = currentFilteredAreas.reduce((sum, area) => sum + area.lng, 0) / currentFilteredAreas.length;
        mapCenter = { lat: avgLat, lng: avgLng };
        mapZoom = 12;
      } else {
        // Last fallback: use state center
        const stateCenter = regionCenters[selectedLocation.state];
        if (!stateCenter) return;
        mapCenter = { lat: stateCenter.lat, lng: stateCenter.lng };
        mapZoom = 11;
      }
    } else {
      // Use state center
      const stateCenter = regionCenters[selectedLocation.state];
      if (!stateCenter) return;
      mapCenter = { lat: stateCenter.lat, lng: stateCenter.lng };
      mapZoom = stateCenter.zoom;
    }

    // Initialize map
    if (!googleMapInstanceRef.current) {
      googleMapInstanceRef.current = new google.maps.Map(googleMapRef.current, {
        center: mapCenter,
        zoom: mapZoom,
        styles: [
          {
            "elementType": "geometry",
            "stylers": [{ "color": "#1a1f2e" }]
          },
          {
            "elementType": "labels.text.stroke",
            "stylers": [{ "color": "#1a1f2e" }]
          },
          {
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#746855" }]
          },
          {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [{ "color": "#2c3e50" }]
          },
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{ "color": "#0B1D3A" }]
          }
        ],
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });
    } else {
      // Update map center and zoom for location changes
      googleMapInstanceRef.current.panTo(mapCenter);
      googleMapInstanceRef.current.setZoom(mapZoom);
    }

    // Add markers for filtered areas
    currentFilteredAreas.forEach(area => {
      const position = { lat: area.lat, lng: area.lng };
      
      // Create semi-transparent circle overlay for heatmap effect (only for crime areas)
      if (area.type !== 'safe') {
        const circle = new google.maps.Circle({
          strokeColor: getSeverityColor(area.severity),
          strokeOpacity: 0.3,
          strokeWeight: 1,
          fillColor: getSeverityColor(area.severity),
          fillOpacity: area.severity === 'high' ? 0.35 : area.severity === 'medium' ? 0.25 : 0.15,
          map: googleMapInstanceRef.current,
          center: position,
          radius: area.severity === 'high' ? 800 : area.severity === 'medium' ? 600 : 400,
        });
        circleOverlaysRef.current.push(circle);
      }
      
      // Create marker using standard Marker API (works reliably)
      const marker = new google.maps.Marker({
        position,
        map: googleMapInstanceRef.current,
        title: area.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: area.severity === 'high' ? 10 : area.severity === 'medium' ? 8 : 6,
          fillColor: getSeverityColor(area.severity),
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        animation: area.severity === 'high' ? google.maps.Animation.BOUNCE : undefined,
      });

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: #000; padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${area.name}</h3>
            <p style="margin: 4px 0;"><strong>District:</strong> ${area.district || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>Type:</strong> ${getTypeIcon(area.type)} ${area.type.charAt(0).toUpperCase() + area.type.slice(1)}</p>
            <p style="margin: 4px 0;"><strong>Severity:</strong> <span style="color: ${getSeverityTextColor(area.severity)}">${area.severity.toUpperCase()}</span></p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">Lat: ${area.lat.toFixed(4)}, Lng: ${area.lng.toFixed(4)}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    // Add markers for active alerts
    filteredAlerts.forEach(alert => {
      const position = { lat: alert.lat, lng: alert.lng };
      
      // Create marker for alert with distinct styling
      const marker = new google.maps.Marker({
        position,
        map: googleMapInstanceRef.current,
        title: alert.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#f59e0b', // Amber color for alerts
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        animation: google.maps.Animation.DROP,
      });

      // Add info window for alert
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: #000; padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #f59e0b;">⚠️ Active Alert</h3>
            <p style="margin: 4px 0; font-weight: bold;">${alert.name}</p>
            <p style="margin: 4px 0;"><strong>District:</strong> ${alert.district}</p>
            <p style="margin: 4px 0; font-size: 13px;">${alert.description}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">Lat: ${alert.lat.toFixed(4)}, Lng: ${alert.lng.toFixed(4)}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    // Add markers for safe zones
    filteredSafeZones.forEach(zone => {
      const position = { lat: zone.lat, lng: zone.lng };
      
      // Create marker for safe zone with distinct styling
      const marker = new google.maps.Marker({
        position,
        map: googleMapInstanceRef.current,
        title: zone.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#10b981', // Green color for safe zones
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      // Add info window for safe zone
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: #000; padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #10b981;">🛡️ Safe Zone</h3>
            <p style="margin: 4px 0; font-weight: bold;">${zone.name}</p>
            <p style="margin: 4px 0;"><strong>District:</strong> ${zone.district}</p>
            <p style="margin: 4px 0; font-size: 13px;">${zone.description}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">Lat: ${zone.lat.toFixed(4)}, Lng: ${zone.lng.toFixed(4)}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });

  }, [selectedLocation?.state, selectedLocation?.district, selectedFilter, googleMapsLoaded]);

  // Render custom map with SVG visualization
  const renderCustomMap = () => {
    if (!selectedLocation?.state) return null;

    return (
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100" height="100" fill="#1a1f2e" />
        <rect width="100" height="100" fill="url(#grid)" />

        {/* Plot areas */}
        {filteredAreas.map((area) => (
          <g key={area.id}>
            {/* Circle for area */}
            <circle
              cx={area.x}
              cy={area.y}
              r={area.severity === 'high' ? 4 : area.severity === 'medium' ? 3 : 2}
              fill={getSeverityColor(area.severity)}
              opacity={area.severity === 'high' ? 0.6 : area.severity === 'medium' ? 0.5 : 0.4}
              className="cursor-pointer hover:opacity-100 transition-opacity"
            />
            <circle
              cx={area.x}
              cy={area.y}
              r={1}
              fill={getSeverityColor(area.severity)}
              className="cursor-pointer"
            />
            {/* Label */}
            <text
              x={area.x}
              y={area.y - (area.severity === 'high' ? 5 : 4)}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="2"
              className="pointer-events-none"
            >
              {getTypeIcon(area.type)}
            </text>
          </g>
        ))}

        {/* Region label */}
        <text x="50" y="95" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="3">
          {selectedLocation.district ? `${selectedLocation.district}, ${selectedLocation.state}` : selectedLocation.state}
        </text>
      </svg>
    );
  };

  const currentMetrics = selectedLocation?.state ? regionMetrics[selectedLocation.state] : null;
  const filteredAlerts = currentMetrics?.activeAlerts.filter(a => 
    !selectedLocation?.district || a.district === selectedLocation.district
  ) || [];
  const filteredSafeZones = currentMetrics?.safeZones.filter(z => 
    !selectedLocation?.district || z.district === selectedLocation.district
  ) || [];

  // Get district-specific safety score
  const getCurrentSafetyScore = () => {
    if (!selectedLocation?.state || !currentMetrics) return 0;
    
    if (selectedLocation.district) {
      const stateDistricts = districtMetrics[selectedLocation.state];
      const districtData = stateDistricts?.[selectedLocation.district];
      if (districtData) {
        return districtData.safetyScore;
      }
    }
    
    return currentMetrics.safetyScore;
  };

  return (
    <section className="bg-[#0B1D3A] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Location Selector - SINGLE LOCATION */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#FF6EC7]/20 rounded-lg">
              <MapPin className="w-6 h-6 text-[#FF6EC7]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Crime Hotspot & Threat Map</h2>
              <p className="text-gray-400">AI-powered analysis with Google Maps integration</p>
            </div>
          </div>
          
          {/* Unified Location Selector */}
          {onLocationChange && (
            <UnifiedLocationSelector onLocationChange={onLocationChange} />
          )}
        </div>

        {!selectedLocation?.state ? (
          /* No Location Selected State */
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#FF6EC7]/20 rounded-full mb-6">
                <MapPin className="w-10 h-10 text-[#FF6EC7]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Select Your Location</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Choose a state or union territory from the dropdown above to view crime hotspots, safe zones, local news, and regional statistics
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <Shield className="w-8 h-8 text-[#3BE39C] mx-auto mb-2" />
                  <p className="text-gray-300 text-sm">Safety Score</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <AlertTriangle className="w-8 h-8 text-[#FF6EC7] mx-auto mb-2" />
                  <p className="text-gray-300 text-sm">Active Alerts</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <CheckCircle2 className="w-8 h-8 text-[#3BE39C] mx-auto mb-2" />
                  <p className="text-gray-300 text-sm">Safe Zones</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Location-based Crime News */}
            <div className="mb-8">
              <LocationCrimeNews selectedLocation={selectedLocation} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Maps Container - Both Google Maps AND Custom Map */}
              <div className="lg:col-span-3 space-y-6">
                {/* Google Maps */}
                <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                  <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-5 h-5 text-[#3BE39C]" />
                      <h3 className="text-white font-medium">Google Maps - Live View</h3>
                    </div>
                    <div className="px-3 py-1 bg-[#3BE39C]/20 border border-[#3BE39C] rounded text-[#3BE39C] text-sm">
                      Real-time Data
                    </div>
                  </div>
                  <div className="relative h-96">
                    <div ref={googleMapRef} className="absolute inset-0" />
                    {!googleMapsLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
                        <div className="text-center">
                          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#3BE39C] mb-4"></div>
                          <p className="text-gray-400">Loading Google Maps...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>


              </div>

              {/* Stats Panel */}
              <div className="space-y-4">
                {/* Safety Score */}
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-[#3BE39C]" />
                      <h3 className="text-white">Safety Score</h3>
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-[#3BE39C] mb-2">
                    {getCurrentSafetyScore()}%
                  </div>
                  <p className="text-sm text-gray-400">
                    {selectedLocation.district ? `${selectedLocation.district}, ` : ''}{selectedLocation.state}
                  </p>
                </div>

                {/* Active Alerts - Clickable */}
                <button
                  onClick={() => setShowAlertsModal(true)}
                  disabled={filteredAlerts.length === 0}
                  className="w-full bg-gray-900 border border-gray-700 hover:border-[#FF6EC7] rounded-xl p-6 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-[#FF6EC7]" />
                      <h3 className="text-white">Active Alerts</h3>
                    </div>
                    <span className="text-xs text-gray-400">Click to view</span>
                  </div>
                  <div className="text-4xl font-bold text-[#FF6EC7] mb-2">
                    {filteredAlerts.length}
                  </div>
                  <p className="text-sm text-gray-400">
                    Dangerous areas reported
                  </p>
                </button>

                {/* Safe Zones - Clickable */}
                <button
                  onClick={() => setShowSafeZonesModal(true)}
                  disabled={filteredSafeZones.length === 0}
                  className="w-full bg-gray-900 border border-gray-700 hover:border-[#3BE39C] rounded-xl p-6 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-[#3BE39C]" />
                      <h3 className="text-white">Safe Zones</h3>
                    </div>
                    <span className="text-xs text-gray-400">Click to view</span>
                  </div>
                  <div className="text-4xl font-bold text-[#3BE39C] mb-2">
                    {filteredSafeZones.length}
                  </div>
                  <p className="text-sm text-gray-400">
                    Protected areas
                  </p>
                </button>

                {/* Date Range Filter */}
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <h4 className="text-white text-sm">Time Range</h4>
                  </div>
                  <select 
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Active Alerts Modal */}
      {showAlertsModal && currentMetrics && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-[#FF6EC7]" />
                <h2 className="text-2xl font-bold text-white">
                  Active Alerts - {selectedLocation?.district ? `${selectedLocation.district}, ` : ''}{selectedLocation?.state}
                </h2>
              </div>
              <button
                onClick={() => setShowAlertsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {filteredAlerts.map((alert, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleAlertClick(alert);
                    setShowAlertsModal(false);
                  }}
                  className="w-full bg-gray-800 border border-gray-700 hover:border-[#FF6EC7] rounded-lg p-4 text-left transition-all"
                >
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-[#FF6EC7] flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-white font-bold mb-1">{alert.name}</h3>
                      <p className="text-sm text-gray-400 mb-2">{alert.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>📍 District: {alert.district}</span>
                        <span>📌 {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-[#FF6EC7]">View on map →</div>
                  </div>
                </button>
              ))}
              {filteredAlerts.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-[#3BE39C] mx-auto mb-4" />
                  <p className="text-gray-400">No active alerts in this area</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Safe Zones Modal */}
      {showSafeZonesModal && currentMetrics && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-[#3BE39C]" />
                <h2 className="text-2xl font-bold text-white">
                  Safe Zones - {selectedLocation?.district ? `${selectedLocation.district}, ` : ''}{selectedLocation?.state}
                </h2>
              </div>
              <button
                onClick={() => setShowSafeZonesModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {filteredSafeZones.map((zone, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleSafeZoneClick(zone);
                    setShowSafeZonesModal(false);
                  }}
                  className="w-full bg-gray-800 border border-gray-700 hover:border-[#3BE39C] rounded-lg p-4 text-left transition-all"
                >
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-[#3BE39C] flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-white font-bold mb-1">{zone.name}</h3>
                      <p className="text-sm text-gray-400 mb-2">{zone.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>📍 District: {zone.district}</span>
                        <span>📌 {zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-[#3BE39C]">View on map →</div>
                  </div>
                </button>
              ))}
              {filteredSafeZones.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                  <p className="text-gray-400">No designated safe zones in this area</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
