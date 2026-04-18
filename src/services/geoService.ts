export interface EventLocation {
  longitude: number;
  latitude: number;
  name: string;
  street: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  displayAddress: string;
}

interface PhotonProperties {
  name?: string;
  street?: string;
  city?: string;
  town?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface PhotonFeature {
  geometry: {
    coordinates: [number, number];
  };
  properties: PhotonProperties;
}

interface PhotonResponse {
  features: PhotonFeature[];
}

const PHOTON_API_URL = 'https://photon.komoot.io/api/';

/**
 * @summary A service for interacting with the Photon geocoding API to retrieve location data.
 */
export const GeocodingService = {
  
  /**
   * @summary Searches for event locations based on a text query using the Photon API.
   * @param query - The search string representing an address or place name.
   * @param limit - The maximum number of results to return (defaults to 5).
   * @returns An array of formatted location objects.
   */
  async searchEventLocation(query: string, limit: number = 5): Promise<EventLocation[]> {
    if (!query || query.trim() === '') return [];

    try {
      const response = await fetch(`${PHOTON_API_URL}?q=${encodeURIComponent(query)}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Photon API error: ${response.status}`);
      }

      const data = (await response.json()) as PhotonResponse;

      return data.features.map((feature: PhotonFeature): EventLocation => {
        const props = feature.properties;
        const cityOrTown = props.city || props.town || '';

        return {
          longitude: feature.geometry.coordinates[0],
          latitude: feature.geometry.coordinates[1],
          name: props.name || '',
          street: props.street || '',
          city: cityOrTown,
          state: props.state || '',
          postcode: props.postcode || '',
          country: props.country || '',
          displayAddress: [props.name, props.street, cityOrTown]
            .filter(Boolean)
            .join(', ')
        };
      });

    } catch (error) {
      console.error('Failed to fetch geodata:', error);
      return [];
    }
  }
};