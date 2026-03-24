// GlowBook App Configuration
// OAuth credentials configured with actual values from Google Cloud Console

export const config = {
  // Google OAuth - Web Application credential (for Expo development)
  // For standalone iOS builds, use: 910345776823-5fviukt7combuc3dm6oilqglh27f0ueu.apps.googleusercontent.com
  // For standalone Android builds, create Android credential in Google Cloud
  GOOGLE_CLIENT_ID: '910345776823-vu785o1iq8arnuj9ccdci7o3g636afss.apps.googleusercontent.com',
  GOOGLE_REDIRECT_URL: 'com.glowbook.app',

  // Backend API
  API_BASE_URL: 'http://localhost:5000',
  // Update to production: 'https://glowbook-api.onrender.com'

  // Apple Team ID (optional, for reference)
  APPLE_TEAM_ID: 'YOUR_APPLE_TEAM_ID',
};

export default config;
