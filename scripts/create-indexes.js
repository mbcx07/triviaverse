const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

async function main() {
  // Load service account
  const serviceAccount = JSON.parse(
    fs.readFileSync('C:\\secrets\\triviverso.json', 'utf8')
  );

  // Initialize Firebase Admin
  initializeApp({
    credential: cert(serviceAccount),
  });

  const db = getFirestore();

  console.log('Creating Firestore indexes via Admin SDK...');
  console.log('Project:', serviceAccount.project_id);

  // Note: Admin SDK doesn't have a direct method to create indexes
  // We need to use the Firebase REST API or gcloud
  
  // Let's try using fetch to create the index via Firestore Admin API
  const accessToken = await getAccessToken(serviceAccount);
  
  if (!accessToken) {
    console.log('Could not get access token. Creating indexes manually is required.');
    console.log('');
    console.log('Go to: https://console.firebase.google.com/project/triviverso/firestore/indexes');
    console.log('Create index with:');
    console.log('- Collection: messages');
    console.log('- Field 1: scope (Ascending)');
    console.log('- Field 2: createdAt (Ascending)');
    return;
  }

  // Create index via API
  const indexUrl = `https://firestore.googleapis.com/v1/projects/${serviceAccount.project_id}/databases/(default)/collectionGroups/messages/indexes`;
  
  const indexData = {
    fields: [
      { fieldPath: 'scope', order: 'ASCENDING' },
      { fieldPath: 'createdAt', order: 'ASCENDING' }
    ],
    queryScope: 'COLLECTION'
  };

  try {
    const response = await fetch(indexUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(indexData)
    });
    
    if (response.ok) {
      console.log('Index created successfully!');
    } else {
      const error = await response.text();
      console.log('Error creating index:', error);
    }
  } catch (err) {
    console.log('Error:', err.message);
  }
}

async function getAccessToken(serviceAccount) {
  const jwt = require('jsonwebtoken');
  const crypto = require('crypto');
  
  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase'
  };

  const token = jwt.sign(jwtPayload, serviceAccount.private_key, { algorithm: 'RS256' });
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${encodeURIComponent(token)}`
  });

  const data = await response.json();
  return data.access_token;
}

main().catch(console.error);