import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, Newspaper, Clock, Shield, BarChart3, Bell, X, Phone, Navigation } from 'lucide-react';

interface Crime {
  id: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  location: string;
  distance: string;
  time: string;
  date: string;
}

interface NewsItem {
  id: string;
  headline: string;
  source: string;
  time: string;
  category: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  publishedAt?: string;
}

// Crime templates
const CRIME_TEMPLATES = [
  { type: 'Theft', severity: 'medium', desc: 'Shop theft reported', locations: ['Market Area', 'Shopping Complex', 'Commercial Street', 'Mall Road'] },
  { type: 'Burglary', severity: 'high', desc: 'House burglary, valuables stolen', locations: ['Residential Colony', 'Housing Society', 'Apartments Area', 'Villa Complex'] },
  { type: 'Armed Robbery', severity: 'high', desc: 'Armed robbery at jewelry store', locations: ['Jewelers Street', 'Market Road', 'Commercial Hub'] },
  { type: 'Pickpocketing', severity: 'low', desc: 'Multiple pickpocketing incidents', locations: ['Crowded Market', 'Bus Stand', 'Railway Station'] },
  { type: 'Vehicle Theft', severity: 'medium', desc: 'Motorcycle stolen from parking', locations: ['Market Parking', 'Shopping Complex', 'Mall Parking'] },
  { type: 'Assault', severity: 'medium', desc: 'Physical altercation reported', locations: ['Main Road', 'Public Area', 'Town Center'] },
  { type: 'Fraud', severity: 'medium', desc: 'Financial fraud case registered', locations: ['City Center', 'Market Area', 'Commercial Zone'] },
  { type: 'Vandalism', severity: 'low', desc: 'Property damage reported', locations: ['Public Park', 'Street Corner', 'Residential Area'] }
];

const NEWS_TEMPLATES = {
  arrests: [
    'Police Arrest Gang in Major Crackdown Operation',
    'Wanted Criminal Nabbed After Chase',
    'Robbery Gang Busted, Stolen Items Recovered',
    'Murder Accused Arrested After Investigation',
    'Drug Peddler Caught with Contraband'
  ],
  operations: [
    'Police Launch Special Night Patrol in Area',
    '₹5 Crore Drug Haul Seized by Police',
    'Vehicle Theft Gang Dismantled, 20 Vehicles Recovered',
    'Cyber Crime Cell Busts Online Fraud Racket',
    'Special Task Force Raids Multiple Locations'
  ],
  safety: [
    'New CCTV Cameras Installed for Public Safety',
    'Police Conduct Safety Awareness Program',
    'Community Policing Initiative Shows Results',
    'Crime Rate Shows Declining Trend This Month',
    'Enhanced Patrolling in Residential Areas'
  ]
};

const NEWS_SOURCES = ['Times of India', 'Hindustan Times', 'Indian Express', 'NDTV', 'The Hindu', 'Local News'];
const TIME_LABELS = ['2 hours ago', '4 hours ago', '6 hours ago', '8 hours ago', '12 hours ago', '1 day ago'];

interface LocationCrimeNewsProps {
  fullView?: boolean;
  selectedLocation?: {
    state: string;
    district: string | null;
  } | null;
}

export function LocationCrimeNews({ fullView = false, selectedLocation }: LocationCrimeNewsProps) {
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedCrime, setSelectedCrime] = useState<Crime | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  // Hash function to generate consistent but varied data for each district
  const hashString = (str: string, seed: number = 0): number => {
    const fullStr = `${str}-${seed}`;
    let hash = 0;
    for (let i = 0; i < fullStr.length; i++) {
      const char = fullStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  // Generate location-specific crimes (each district gets unique crime data)
  const generateCrimes = (location: string): Crime[] => {
    const crimeCount = 4;
    const generatedCrimes: Crime[] = [];

    for (let i = 0; i < crimeCount; i++) {
      const hash = hashString(location, i + 100);
      const template = CRIME_TEMPLATES[hash % CRIME_TEMPLATES.length];
      const locationHash = hashString(location, i + 200);
      const timeHash = hashString(location, i + 300);
      const distanceHash = hashString(location, i + 400);
      
      const specificLocation = template.locations[locationHash % template.locations.length];
      const times = ['2 hours ago', '4 hours ago', '6 hours ago', '8 hours ago', '12 hours ago', '1 day ago', '2 days ago'];
      const time = times[timeHash % times.length];
      const distances = ['0.3 km', '0.5 km', '0.8 km', '1.2 km', '1.5 km', '2.1 km', '2.8 km', '3.2 km'];
      const distance = distances[distanceHash % distances.length];

      generatedCrimes.push({
        id: `crime-${location}-${i}`,
        type: template.type,
        severity: template.severity as 'high' | 'medium' | 'low',
        description: template.desc,
        location: specificLocation,
        distance: distance,
        time: time,
        date: 'Nov 7, 2025'
      });
    }

    return generatedCrimes;
  };

  // Generate location-specific news (each district gets unique news items)
  const generateNews = (location: string, displayArea: string): NewsItem[] => {
    const newsCount = 3;
    const generatedNews: NewsItem[] = [];

    for (let i = 0; i < newsCount; i++) {
      const hash = hashString(location, i + 500);
      const categoryHash = hash % 3;
      let headline = '';
      let category = '';

      if (categoryHash === 0) {
        const arrestNews = NEWS_TEMPLATES.arrests[hash % NEWS_TEMPLATES.arrests.length];
        headline = `${arrestNews} in ${displayArea}`;
        category = 'Crime';
      } else if (categoryHash === 1) {
        headline = NEWS_TEMPLATES.operations[hash % NEWS_TEMPLATES.operations.length];
        category = 'Operation';
      } else {
        headline = NEWS_TEMPLATES.safety[hash % NEWS_TEMPLATES.safety.length];
        category = 'Safety';
      }

      const sourceHash = hashString(location, i + 600);
      const timeHash = hashString(location, i + 700);

      generatedNews.push({
        id: `news-${location}-${i}`,
        headline: headline,
        source: NEWS_SOURCES[sourceHash % NEWS_SOURCES.length],
        time: TIME_LABELS[timeHash % TIME_LABELS.length],
        category: category
      });
    }

    return generatedNews;
  };

  // Generate data when location changes
  useEffect(() => {
    if (selectedLocation?.state) {
      const district = selectedLocation.district || '';
      const locationString = district 
        ? `${selectedLocation.state}-${district}` 
        : selectedLocation.state;
      const displayArea = district || selectedLocation.state;
      
      setCrimes(generateCrimes(locationString));
      setNews(generateNews(locationString, displayArea));
    } else {
      setCrimes([]);
      setNews([]);
    }
  }, [selectedLocation]);

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'low': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getNewsIcon = (category: string) => {
    switch(category) {
      case 'Crime': return AlertCircle;
      case 'Safety': return Shield;
      case 'Operation': return BarChart3;
      case 'Alert': return Bell;
      default: return Newspaper;
    }
  };

  const displayLocation = selectedLocation?.district 
    ? `${selectedLocation.district}, ${selectedLocation.state}` 
    : selectedLocation?.state;

  return (
    <div className="w-full">
      {selectedLocation?.state && crimes.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Crime History */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-[#FF6EC7]" />
              <h3 className="text-lg font-semibold text-white">Recent Crime History</h3>
              <span className="ml-auto text-xs text-gray-400">{displayLocation}</span>
            </div>
            
            <div className="space-y-4">
              {crimes.map((crime) => (
                <button 
                  key={crime.id}
                  onClick={() => setSelectedCrime(crime)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 hover:border-[#FF6EC7]/30 transition-all duration-300 text-left cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(crime.severity)}`}>
                      {crime.type}
                    </div>
                    <span className="text-xs text-gray-500 group-hover:text-[#FF6EC7] transition-colors">{crime.distance}</span>
                  </div>
                  <p className="text-white text-sm font-medium mb-1 group-hover:text-[#FF6EC7] transition-colors">{crime.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{crime.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{crime.time}</span>
                    </div>
                  </div>
                  <div className="text-xs text-[#FF6EC7] mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click for details →
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Local Safety News */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Newspaper className="w-5 h-5 text-[#3BE39C]" />
              <h3 className="text-lg font-semibold text-white">Local Safety News</h3>
              <span className="ml-auto text-xs text-gray-400">{displayLocation}</span>
            </div>
            
            <div className="space-y-4">
              {news.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setSelectedNews(item)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 hover:border-[#3BE39C]/30 transition-all duration-300 cursor-pointer group text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#3BE39C]/10 rounded-lg flex-shrink-0 group-hover:bg-[#3BE39C]/20 transition-colors">
                      {React.createElement(getNewsIcon(item.category), { className: "w-4 h-4 text-[#3BE39C]" })}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium mb-2 group-hover:text-[#3BE39C] transition-colors">
                        {item.headline}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">{item.source}</span>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                      <div className="text-xs text-[#3BE39C] mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        Read more →
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Crime Detail Modal */}
      {selectedCrime && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#0B1D3A] rounded-xl max-w-2xl w-full border border-[#FF6EC7]/30 shadow-2xl shadow-[#FF6EC7]/20 my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#FF6EC7]/10 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-[#FF6EC7]" />
                </div>
                <div>
                  <h3 className="text-white text-xl font-semibold">{selectedCrime.type}</h3>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium border mt-1 ${getSeverityColor(selectedCrime.severity)}`}>
                    {selectedCrime.severity.toUpperCase()} SEVERITY
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCrime(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Incident Details */}
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#FF6EC7]" />
                  Incident Details
                </h4>
                <p className="text-gray-300 mb-4">{selectedCrime.description}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Location</div>
                    <div className="text-white text-sm flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-[#FF6EC7]" />
                      {selectedCrime.location}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Distance from you</div>
                    <div className="text-white text-sm flex items-center gap-1">
                      <Navigation className="w-4 h-4 text-[#FF6EC7]" />
                      {selectedCrime.distance}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Time Reported</div>
                    <div className="text-white text-sm flex items-center gap-1">
                      <Clock className="w-4 h-4 text-[#FF6EC7]" />
                      {selectedCrime.time}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">Date</div>
                    <div className="text-white text-sm">{selectedCrime.date}</div>
                  </div>
                </div>
              </div>

              {/* Safety Recommendations */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <h4 className="text-amber-400 font-medium mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Safety Recommendations
                </h4>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    <span>Avoid the {selectedCrime.location} area during late hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    <span>Travel in groups if possible, especially after dark</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    <span>Keep emergency contacts handy and stay alert</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    <span>Report any suspicious activity to local police immediately</span>
                  </li>
                </ul>
              </div>

              {/* Emergency Contact */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <h4 className="text-red-400 font-medium mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Emergency Contacts
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <a href="tel:100" className="bg-white/5 rounded-lg p-3 text-white hover:bg-white/10 transition-colors">
                    <div className="text-xs text-gray-400 mb-1">Police</div>
                    <div className="font-medium">100</div>
                  </a>
                  <a href="tel:112" className="bg-white/5 rounded-lg p-3 text-white hover:bg-white/10 transition-colors">
                    <div className="text-xs text-gray-400 mb-1">Emergency</div>
                    <div className="font-medium">112</div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* News Detail Modal */}
      {selectedNews && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#0B1D3A] rounded-xl max-w-2xl w-full border border-[#3BE39C]/30 shadow-2xl shadow-[#3BE39C]/20 my-8">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#3BE39C]/10 rounded-lg">
                  {React.createElement(getNewsIcon(selectedNews.category), { className: "w-6 h-6 text-[#3BE39C]" })}
                </div>
                <div>
                  <h3 className="text-white text-xl font-semibold">Local Safety Update</h3>
                  <div className="text-sm text-gray-400 mt-1">{selectedNews.category}</div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNews(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <h2 className="text-white text-lg font-medium">{selectedNews.headline}</h2>
              
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{selectedNews.source}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{selectedNews.time}</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 text-gray-300">
                <p>This is a local safety update for {displayLocation}. For full details and latest updates, please check official news sources.</p>
              </div>

              <div className="bg-[#3BE39C]/10 border border-[#3BE39C]/20 rounded-lg p-4">
                <h4 className="text-[#3BE39C] font-medium mb-2">Stay Informed</h4>
                <p className="text-gray-300 text-sm">
                  Follow local news sources and police updates for the latest safety information in your area.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
