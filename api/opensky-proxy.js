const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { flightNumber, flightDate, landingTime = '14:00' } = req.query;
    
    if (!flightNumber || !flightDate) {
      return res.status(400).json({ error: 'Missing flightNumber or flightDate' });
    }

    console.log(`🔍 OpenSky Proxy: Searching for ${flightNumber} on ${flightDate} at ${landingTime}`);

    // Convert date + landing time to Unix timestamps (1 hour window around landing time)
    const landingHour = parseInt(landingTime.split(':')[0]);
    const beginTime = Math.floor(new Date(flightDate + `T${landingHour - 1}:00:00Z`).getTime() / 1000);
    const endTime = Math.floor(new Date(flightDate + `T${landingHour + 1}:00:00Z`).getTime() / 1000);

    const openSkyUrl = `https://opensky-network.org/api/states/all?begin=${beginTime}&end=${endTime}`;
    
    console.log(`   URL: ${openSkyUrl}`);

                    // Make authenticated call to OpenSky using API Client credentials
                console.log('   🔐 Using API Client authentication:');
                console.log('   - Client ID: ontimely-api-client');
                console.log('   - Client Secret: UfBPW8y1p5gW1UWmtLCAS8O7W4DUbnP4');
                
                const response = await fetch(openSkyUrl, {
                  headers: {
                    'X-API-Client': 'ontimely-api-client',
                    'X-API-Secret': 'UfBPW8y1p5gW1UWmtLCAS8O7W4DUbnP4',
                    'User-Agent': 'Timely/1.0'
                  }
                });

    console.log(`   Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   Error: ${response.status} ${response.statusText}`);
      console.error(`   Response preview: ${errorText.substring(0, 500)}...`);
      
      // Check if response is HTML (error page)
      if (errorText.includes('<html') || errorText.includes('<!DOCTYPE')) {
        return res.status(500).json({ 
          error: `OpenSky API returned HTML error page (status: ${response.status})`,
          details: 'The API returned an HTML page instead of JSON. This usually means authentication failed or the endpoint is incorrect.'
        });
      }
      
      return res.status(response.status).json({ 
        error: `OpenSky API error: ${response.status}`,
        details: errorText.substring(0, 500)
      });
    }

    const responseText = await response.text();
    console.log(`   Raw response preview: ${responseText.substring(0, 200)}...`);
    
    let flightData;
    try {
      flightData = JSON.parse(responseText);
      console.log(`✅ OpenSky data received: ${flightData?.length || 0} flights`);
    } catch (parseError) {
      console.error('   ❌ Failed to parse OpenSky response as JSON:', parseError);
      console.error('   Response was HTML/error page, not JSON');
      return res.status(500).json({ 
        error: 'OpenSky API returned invalid response (HTML instead of JSON)',
        details: responseText.substring(0, 500)
      });
    }

    // Find the specific flight
    if (flightData && Array.isArray(flightData) && flightData.length > 0) {
      console.log(`   Searching through ${flightData.length} flights for ${flightNumber}`);
      
      const flight = flightData.find((f) => {
        if (!f[1]) return false; // callsign is at index 1 in states array
        const cleanCallsign = f[1].replace(/\s/g, '').toUpperCase();
        const cleanFlightNumber = flightNumber.toUpperCase();
        return cleanCallsign.includes(cleanFlightNumber);
      });

      if (flight) {
        console.log(`✅ Found flight: ${flight[1]}`);
        return res.json({
          success: true,
          flight: {
            flight_number: flightNumber,
            flight_date: flightDate,
            flight_status: 'confirmed',
            departure_airport: 'Unknown', // states endpoint doesn't have airport info
            arrival_airport: 'Unknown',
            departure_time: flight[3] ? new Date(flight[3] * 1000).toISOString() : undefined, // firstSeen at index 3
            arrival_time: flight[4] ? new Date(flight[4] * 1000).toISOString() : undefined, // lastSeen at index 4
            departure_iata: 'Unknown',
            arrival_iata: 'Unknown',
            api_source: 'OpenSky States API (Real Flight Data)',
            raw_data: flight
          }
        });
      }
    }

    // Flight not found
    return res.status(404).json({ 
      error: `Flight ${flightNumber} not found in OpenSky data for ${flightDate}`,
      available_flights: flightData?.length || 0
    });

  } catch (error) {
    console.error('❌ OpenSky proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}; 