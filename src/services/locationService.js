const COUNTRIES_NOW_BASE_URL = "https://countriesnow.space/api/v0.1";

let cachedCountriesAndCities = null;

export const getCountriesAndCities = async () => {
  if (cachedCountriesAndCities) {
    return cachedCountriesAndCities;
  }

  const response = await fetch(`${COUNTRIES_NOW_BASE_URL}/countries`);

  if (!response.ok) {
    throw new Error("Failed to load countries and cities.");
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(result.msg || "Could not load country and city data.");
  }

  cachedCountriesAndCities = result.data
    .map((item) => ({
      country: item.country,
      cities: item.cities || [],
    }))
    .sort((a, b) => a.country.localeCompare(b.country));

  return cachedCountriesAndCities;
};