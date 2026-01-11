/**
 * Test fixtures for parser tests
 */

export const validGeoJSON = `{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-122.4194, 37.7749]
      },
      "properties": {
        "name": "Blue Bottle Coffee",
        "address": "66 Mint St, San Francisco, CA 94103",
        "Comment": "Best pour-over in the city!",
        "Google Maps URL": "https://maps.google.com/?cid=123456789"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-122.4083, 37.7833]
      },
      "properties": {
        "name": "Tartine Bakery",
        "address": "600 Guerrero St, San Francisco, CA 94110",
        "Comment": "Amazing sourdough and pastries",
        "Google Maps URL": "https://maps.google.com/?cid=987654321"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-122.4, 37.78]
      },
      "properties": {
        "name": "Dolores Park"
      }
    }
  ]
}`;

export const geoJSONWithLocation = `{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "Location": {
          "Business Name": "Onsen Hot Spring",
          "Address": "123 Spa Lane, Kyoto",
          "Geo Coordinates": {
            "Latitude": 35.0116,
            "Longitude": 135.7681
          }
        },
        "Comment": "Cute hot spring with outdoor baths",
        "Google Maps URL": "https://www.google.com/maps/place/?q=place_id:ChIJ123"
      }
    }
  ]
}`;

export const malformedGeoJSON = `{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {}
    }
  ]
}`;

export const validCSV = `Title,Note,URL,Address,Location Geo Coordinates
Blue Bottle Coffee,Best pour-over in the city!,https://maps.google.com/?cid=123,"66 Mint St, San Francisco, CA","37.7749,-122.4194"
Tartine Bakery,Amazing sourdough,https://maps.google.com/?cid=987,"600 Guerrero St, SF","37.7833,-122.4083"
Dolores Park,,,"Mission District, SF",`;

export const csvWithQuotes = `Title,Note,URL
"Coffee Shop, The Best","Great coffee with ""special"" beans",https://maps.google.com/?cid=111
Simple Place,No quotes here,https://maps.google.com/?cid=222`;

export const csvWithSeparateCoords = `Name,List,Latitude,Longitude,Note
Onsen Hot Spring,Travel,35.0116,135.7681,Cute hot spring
Mountain View,Hiking,37.3861,-122.0839,Great views`;

export const csvMissingTitle = `Note,URL
Some note,https://maps.google.com/?cid=123`;

export const invalidFormat = `This is just plain text
Not JSON or CSV
Just some random content`;

export const emptyFile = ``;

export const jsonNotGeoJSON = `{
  "places": [
    {"name": "Place 1"},
    {"name": "Place 2"}
  ]
}`;
