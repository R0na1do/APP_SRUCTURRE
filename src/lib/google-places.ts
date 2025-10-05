export const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        reject(error)
      }
    )
  })
}

export const searchNearbyRestaurants = async (
  location: { lat: number; lng: number },
  radius: number = 5000
) => {
  const url = `/api/places/nearby?lat=${location.lat}&lng=${location.lng}&radius=${radius}`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (response.ok) {
      return data.results
    } else {
      throw new Error(data.error || 'Failed to fetch places data')
    }
  } catch (error) {
    console.error('Places API request failed:', error)
    throw error
  }
}

export const getPlaceDetails = async (placeId: string) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
  
  if (!apiKey) {
    throw new Error('Google Places API key not found')
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,user_ratings_total,photos,website&key=${apiKey}`
  
  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === 'OK') {
      return data.result
    } else {
      throw new Error(`Place details API error: ${data.status}`)
    }
  } catch (error) {
    console.error('Place details API request failed:', error)
    throw error
  }
}
