import axios from 'axios';

export interface Province {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  phone_code: number;
  districts: District[];
}

export interface District {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  short_codename: string;
  province_code: number;
}

const API_URL = 'https://provinces.open-api.vn/api';

export const locationApi = {
  getProvinces: async () => {
    const { data } = await axios.get<Province[]>(`${API_URL}/p/`);
    return data;
  },
  getDistricts: async (provinceCode: number) => {
    const { data } = await axios.get<Province>(`${API_URL}/p/${provinceCode}?depth=2`);
    return data.districts;
  },
  geocode: async (address: string) => {
    const { data } = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: {
        q: address,
        format: 'json',
        limit: 1
      }
    });
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  }
};
