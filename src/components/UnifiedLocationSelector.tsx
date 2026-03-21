import React, { useState } from 'react';
import { Globe, Navigation } from 'lucide-react';

interface UnifiedLocationSelectorProps {
  onLocationChange: (location: {
    state: string;
    district: string | null;
  }) => void;
}

// Districts for major states
const stateDistricts: {[key: string]: string[]} = {
  'Delhi': ['Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'New Delhi', 'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi', 'Shahdara'],
  'Maharashtra': ['Mumbai City', 'Mumbai Suburban', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur'],
  'Karnataka': ['Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Mangaluru', 'Hubballi-Dharwad', 'Belagavi', 'Kalaburagi'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore'],
  'West Bengal': ['Kolkata', 'Howrah', 'North 24 Parganas', 'South 24 Parganas', 'Darjeeling', 'Siliguri', 'Durgapur'],
  'Telangana': ['Hyderabad', 'Rangareddy', 'Medchal-Malkajgiri', 'Warangal Urban', 'Karimnagar', 'Nizamabad'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar'],
  'Uttar Pradesh': ['Lucknow', 'Agra', 'Varanasi', 'Kanpur', 'Noida', 'Ghaziabad', 'Meerut', 'Allahabad', 'Bareilly'],
  'Punjab': ['Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Chandigarh'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha', 'Kannur'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Ratlam'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Kakinada', 'Nellore'],
  'Haryana': ['Gurgaon', 'Faridabad', 'Rohtak', 'Panipat', 'Karnal', 'Ambala', 'Hisar'],
  'Assam': ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat', 'Nagaon', 'Tezpur'],
  'Goa': ['North Goa', 'South Goa'],
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Purnia'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Puri', 'Rourkela', 'Berhampur', 'Sambalpur'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Durg', 'Korba'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Nainital', 'Mussoorie'],
  'Himachal Pradesh': ['Shimla', 'Manali', 'Dharamshala', 'Kullu', 'Solan'],
  'Jammu & Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur'],
  'Tripura': ['Agartala', 'Dharmanagar'],
  'Meghalaya': ['Shillong', 'Tura'],
  'Manipur': ['Imphal East', 'Imphal West'],
  'Mizoram': ['Aizawl', 'Lunglei'],
  'Nagaland': ['Kohima', 'Dimapur'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun'],
  'Sikkim': ['Gangtok', 'Namchi'],
  'Chandigarh': ['Chandigarh'],
  'Puducherry': ['Puducherry', 'Karaikal'],
  'Lakshadweep': ['Kavaratti'],
  'Andaman & Nicobar': ['Port Blair'],
  'Dadra & Nagar Haveli': ['Silvassa'],
  'Ladakh': ['Leh', 'Kargil'],
};

export function UnifiedLocationSelector({ onLocationChange }: UnifiedLocationSelectorProps) {
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict(''); // Reset district when state changes
    onLocationChange({ state, district: null });
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    onLocationChange({ state: selectedState, district: district || null });
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Globe className="w-4 h-4 text-[#FF6EC7]" />
        <select 
          value={selectedState}
          onChange={(e) => handleStateChange(e.target.value)}
          className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm min-w-[180px]"
        >
          <option value="">Select State/UT...</option>
          <optgroup label="States">
            <option value="Delhi">Delhi</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="West Bengal">West Bengal</option>
            <option value="Telangana">Telangana</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Punjab">Punjab</option>
            <option value="Kerala">Kerala</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Madhya Pradesh">Madhya Pradesh</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Haryana">Haryana</option>
            <option value="Assam">Assam</option>
            <option value="Goa">Goa</option>
            <option value="Bihar">Bihar</option>
            <option value="Odisha">Odisha</option>
            <option value="Jharkhand">Jharkhand</option>
            <option value="Chhattisgarh">Chhattisgarh</option>
            <option value="Uttarakhand">Uttarakhand</option>
            <option value="Himachal Pradesh">Himachal Pradesh</option>
            <option value="Jammu & Kashmir">Jammu & Kashmir</option>
            <option value="Tripura">Tripura</option>
            <option value="Meghalaya">Meghalaya</option>
            <option value="Manipur">Manipur</option>
            <option value="Mizoram">Mizoram</option>
            <option value="Nagaland">Nagaland</option>
            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
            <option value="Sikkim">Sikkim</option>
          </optgroup>
          <optgroup label="Union Territories">
            <option value="Chandigarh">Chandigarh</option>
            <option value="Puducherry">Puducherry</option>
            <option value="Lakshadweep">Lakshadweep</option>
            <option value="Andaman & Nicobar">Andaman & Nicobar</option>
            <option value="Dadra & Nagar Haveli">Dadra & Nagar Haveli</option>
            <option value="Ladakh">Ladakh</option>
          </optgroup>
        </select>
      </div>
      
      {selectedState && stateDistricts[selectedState] && (
        <div className="flex items-center space-x-2">
          <Navigation className="w-4 h-4 text-[#3BE39C]" />
          <select 
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm min-w-[160px]"
          >
            <option value="">All Districts</option>
            {stateDistricts[selectedState].map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
