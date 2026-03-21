// District-specific metrics with safety scores for each district
export interface DistrictMetrics {
  safetyScore: number;
  centerLat: number;
  centerLng: number;
}

export const districtMetrics: {[state: string]: {[district: string]: DistrictMetrics}} = {
  'Delhi': {
    'Central Delhi': { safetyScore: 62, centerLat: 28.6315, centerLng: 77.2167 },
    'North Delhi': { safetyScore: 58, centerLat: 28.7496, centerLng: 77.0672 },
    'South Delhi': { safetyScore: 68, centerLat: 28.5494, centerLng: 77.2501 },
    'East Delhi': { safetyScore: 64, centerLat: 28.6127, centerLng: 77.2773 },
    'West Delhi': { safetyScore: 60, centerLat: 28.6692, centerLng: 77.0954 },
    'New Delhi': { safetyScore: 75, centerLat: 28.6143, centerLng: 77.1995 },
    'North West Delhi': { safetyScore: 61, centerLat: 28.7496, centerLng: 77.0672 },
    'North East Delhi': { safetyScore: 59, centerLat: 28.7041, centerLng: 77.2750 },
    'South West Delhi': { safetyScore: 65, centerLat: 28.5921, centerLng: 77.0460 },
    'South East Delhi': { safetyScore: 66, centerLat: 28.5494, centerLng: 77.2754 },
    'Shahdara': { safetyScore: 57, centerLat: 28.6692, centerLng: 77.2954 },
  },
  'Maharashtra': {
    'Mumbai City': { safetyScore: 68, centerLat: 18.9220, centerLng: 72.8347 },
    'Mumbai Suburban': { safetyScore: 70, centerLat: 19.0378, centerLng: 72.8520 },
    'Pune': { safetyScore: 74, centerLat: 18.5089, centerLng: 73.8077 },
    'Nagpur': { safetyScore: 69, centerLat: 21.1458, centerLng: 79.0882 },
    'Thane': { safetyScore: 72, centerLat: 19.2183, centerLng: 72.9781 },
    'Nashik': { safetyScore: 76, centerLat: 19.9975, centerLng: 73.7898 },
    'Aurangabad': { safetyScore: 73, centerLat: 19.8762, centerLng: 75.3433 },
  },
  'Karnataka': {
    'Bengaluru Urban': { safetyScore: 76, centerLat: 12.9716, centerLng: 77.5946 },
    'Bengaluru Rural': { safetyScore: 82, centerLat: 13.2257, centerLng: 77.5120 },
    'Mysuru': { safetyScore: 85, centerLat: 12.3052, centerLng: 76.6552 },
    'Mangaluru': { safetyScore: 80, centerLat: 12.9141, centerLng: 74.8560 },
    'Hubballi-Dharwad': { safetyScore: 78, centerLat: 15.3647, centerLng: 75.1240 },
  },
  'Tamil Nadu': {
    'Chennai': { safetyScore: 70, centerLat: 13.0827, centerLng: 80.2707 },
    'Coimbatore': { safetyScore: 75, centerLat: 11.0168, centerLng: 76.9558 },
    'Madurai': { safetyScore: 71, centerLat: 9.9252, centerLng: 78.1198 },
    'Tiruchirappalli': { safetyScore: 74, centerLat: 10.7905, centerLng: 78.7047 },
    'Salem': { safetyScore: 73, centerLat: 11.6643, centerLng: 78.1460 },
    'Chengalpattu': { safetyScore: 77, centerLat: 12.6169, centerLng: 80.1932 },
    'The Nilgiris': { safetyScore: 88, centerLat: 11.4102, centerLng: 76.6950 },
  },
  'West Bengal': {
    'Kolkata': { safetyScore: 66, centerLat: 22.5726, centerLng: 88.3639 },
    'Howrah': { safetyScore: 64, centerLat: 22.5958, centerLng: 88.2636 },
    'North 24 Parganas': { safetyScore: 70, centerLat: 22.6157, centerLng: 88.4005 },
    'South 24 Parganas': { safetyScore: 69, centerLat: 22.1627, centerLng: 88.4324 },
    'Darjeeling': { safetyScore: 81, centerLat: 27.0410, centerLng: 88.2663 },
    'Siliguri': { safetyScore: 72, centerLat: 26.7271, centerLng: 88.3953 },
  },
  'Telangana': {
    'Hyderabad': { safetyScore: 73, centerLat: 17.4485, centerLng: 78.3908 },
    'Secunderabad': { safetyScore: 75, centerLat: 17.4399, centerLng: 78.4983 },
    'Rangareddy': { safetyScore: 77, centerLat: 17.2543, centerLng: 78.6808 },
    'Medchal-Malkajgiri': { safetyScore: 74, centerLat: 17.5473, centerLng: 78.5818 },
    'Warangal': { safetyScore: 76, centerLat: 17.9689, centerLng: 79.5941 },
  },
  'Gujarat': {
    'Ahmedabad': { safetyScore: 78, centerLat: 23.0225, centerLng: 72.5714 },
    'Surat': { safetyScore: 82, centerLat: 21.1702, centerLng: 72.8311 },
    'Vadodara': { safetyScore: 79, centerLat: 22.3072, centerLng: 73.1812 },
    'Rajkot': { safetyScore: 81, centerLat: 22.3039, centerLng: 70.8022 },
    'Gandhinagar': { safetyScore: 85, centerLat: 23.2156, centerLng: 72.6369 },
  },
  'Uttar Pradesh': {
    'Lucknow': { safetyScore: 64, centerLat: 26.8467, centerLng: 80.9462 },
    'Kanpur': { safetyScore: 58, centerLat: 26.4499, centerLng: 80.3319 },
    'Agra': { safetyScore: 62, centerLat: 27.1751, centerLng: 78.0421 },
    'Varanasi': { safetyScore: 60, centerLat: 25.3050, centerLng: 83.0107 },
    'Noida': { safetyScore: 70, centerLat: 28.5355, centerLng: 77.3910 },
    'Ghaziabad': { safetyScore: 61, centerLat: 28.6692, centerLng: 77.4538 },
    'Prayagraj': { safetyScore: 63, centerLat: 25.4358, centerLng: 81.8463 },
  },
  'Punjab': {
    'Ludhiana': { safetyScore: 74, centerLat: 30.9010, centerLng: 75.8573 },
    'Amritsar': { safetyScore: 78, centerLat: 31.6200, centerLng: 74.8765 },
    'Jalandhar': { safetyScore: 72, centerLat: 31.3260, centerLng: 75.5762 },
    'Patiala': { safetyScore: 76, centerLat: 30.3398, centerLng: 76.3869 },
    'Chandigarh': { safetyScore: 85, centerLat: 30.7333, centerLng: 76.7794 },
  },
};
