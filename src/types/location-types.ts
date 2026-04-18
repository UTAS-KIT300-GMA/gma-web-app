/** * 
 * @summary Standardized structure for an event location used throughout the app.
 * @property {number} longitude - The east-west coordinate.
 * @property {number} latitude - The north-south coordinate.
 * @property {string} name - The specific name of the place or venue.
 * @property {string} street - The street address.
 * @property {string} city - The city or town.
 * @property {string} state - The region or state.
 * @property {string} postcode - The postal code.
 * @property {string} country - The country name.
 * @property {string} displayAddress - A formatted, human-readable address string for UI display.
 */
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

/** * 
 * @summary Raw property data structure returned by the Photon API.
 * @property {string} [name] - The name of the point of interest.
 * @property {string} [street] - Street name and house number.
 * @property {string} [city] - Primary city designation.
 * @property {string} [town] - Smaller municipal designation used as a fallback.
 * @property {string} [state] - Regional state or province.
 * @property {string} [postcode] - Postal or zip code.
 * @property {string} [country] - Full country name.
 */
export interface PhotonProperties {
  name?: string;
  street?: string;
  city?: string;
  town?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

/** * 
 * @summary Single GeoJSON feature structure representing a result from the Photon API.
 * @property {Object} geometry - The spatial data for the feature.
 * @property {number} geometry.coordinates - Coordinate pair in [longitude, latitude] format.
 * @property {PhotonProperties} properties - The address and place details.
 */
export interface PhotonFeature {
  geometry: {
    coordinates: [number, number];
  };
  properties: PhotonProperties;
}

/** * 
 * @summary Standardized response object for the Photon Geocoding Service.
 * @property {PhotonFeature[]} features - Array of location features returned by the search.
 */
export interface PhotonResponse {
  features: PhotonFeature[];
}