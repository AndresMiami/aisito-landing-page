exports.handler = async function(event, context) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Google Maps API Key not configured in Netlify environment variables.' })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ apiKey: apiKey })
  };
};
