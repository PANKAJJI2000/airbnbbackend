const https = require('https');

let accessToken = process.env.MAPPLS_ACCESS_TOKEN || null;
let tokenExpiry = null;

function generateToken() {
  return new Promise((resolve, reject) => {
    try {
      const clientId = process.env.MAPPLS_CLIENT_ID;
      const clientSecret = process.env.MAPPLS_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        reject(new Error('MapmyIndia credentials not configured in .env file'));
        return;
      }

      const postData = `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`;

      const options = {
        hostname: 'outpost.mappls.com',
        path: '/api/security/oauth/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode === 401) {
              reject(new Error(`Invalid MapmyIndia credentials. Please verify MAPPLS_CLIENT_ID and MAPPLS_CLIENT_SECRET in .env file. Status: ${res.statusCode}`));
              return;
            }

            if (res.statusCode !== 200) {
              reject(new Error(`Token generation failed with status ${res.statusCode}. Response: ${data}`));
              return;
            }

            const response = JSON.parse(data);
            
            if (!response.access_token) {
              reject(new Error('No access token in response: ' + data));
              return;
            }

            accessToken = response.access_token;
            
            // Set token expiry (response may include expires_in, default to 23 hours)
            const expiresIn = response.expires_in || (23 * 60 * 60);
            tokenExpiry = Date.now() + (expiresIn * 1000);
            
            console.log('✓ MapmyIndia token generated successfully');
            console.log('Token will expire in:', Math.floor(expiresIn / 3600), 'hours');
            resolve(accessToken);
          } catch (error) {
            reject(new Error('Failed to parse token response: ' + error.message + '. Response: ' + data));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error('Network error generating MapmyIndia token: ' + error.message));
      });

      req.write(postData);
      req.end();

    } catch (error) {
      reject(error);
    }
  });
}

async function getValidToken() {
  try {
    // If no token or token expired, generate new one
    if (!accessToken || !tokenExpiry || Date.now() >= tokenExpiry) {
      await generateToken();
    }
    return accessToken;
  } catch (error) {
    console.error('Error getting valid token:', error.message);
    return null;
  }
}

function getClientId() {
  return process.env.MAPPLS_CLIENT_ID;
}

module.exports = {
  generateToken,
  getValidToken,
  getClientId
};
