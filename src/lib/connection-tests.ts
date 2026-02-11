'use server';

import { v2 as cloudinary } from 'cloudinary';
import { getCredentials } from './credential-actions';
import { db } from '@/db';
import { aiProviders, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from './auth';

async function getUserId() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session.user.id;
}

export async function testCloudinaryConnection(provided?: { cloudName?: string, apiKey?: string, apiSecret?: string }) {
  let config = provided;

  if (!config || !config.cloudName || !config.apiKey || !config.apiSecret) {
    const creds = await getCredentials();
    config = {
      cloudName: provided?.cloudName || creds.cloudinary_cloud_name,
      apiKey: provided?.apiKey || creds.cloudinary_api_key,
      apiSecret: provided?.apiSecret || creds.cloudinary_api_secret,
    };
  }
  
  const missing = [];
  if (!config.cloudName) missing.push('Cloud Name');
  if (!config.apiKey) missing.push('API Key');
  if (!config.apiSecret) missing.push('API Secret');

  if (missing.length > 0) {
    return { success: false, message: `Missing: ${missing.join(', ')}` };
  }

  try {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
    });

    // Simple ping to test connection
    await cloudinary.api.ping();
    return { success: true, message: 'Cloudinary connection successful' };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `Cloudinary Error: ${errorMessage}` };
  }
}

export async function testLinkedInConnection(provided?: { clientId?: string, clientSecret?: string, urn?: string }) {
  let config = provided;

  if (!config || !config.clientId || !config.clientSecret || !config.urn) {
    const creds = await getCredentials();
    config = {
      clientId: provided?.clientId || creds.linkedin_client_id,
      clientSecret: provided?.clientSecret || creds.linkedin_client_secret,
      urn: provided?.urn || creds.linkedin_urn,
    };
  }

  if (!config.clientId || !config.clientSecret || !config.urn) {
    return { success: false, message: 'Missing LinkedIn credentials' };
  }

  try {
    const isUrnValid = config.urn.startsWith('urn:li:organization:');
    if (!isUrnValid) {
      return { success: false, message: 'Invalid LinkedIn URN format' };
    }
    
    return { success: true, message: 'LinkedIn credentials format validated (Full API test requires OAuth flow)' };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `LinkedIn Error: ${errorMessage}` };
  }
}

export async function testAiProviderConnection(id: number) {
  const userId = await getUserId();
  const provider = await db.select().from(aiProviders).where(and(eq(aiProviders.id, id), eq(aiProviders.userId, userId))).get();
  
  if (!provider) return { success: false, message: 'Provider not found' };

  try {
    // Normalize endpoint (ensure no trailing slash, add path if missing)
    let url = provider.endpoint.replace(/\/$/, '');
    if (!url.endsWith('/chat/completions') && !url.includes('/completions')) {
      url += '/chat/completions';
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (provider.apiKey) {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: 'Say "Hello World"' }],
        max_tokens: 10
      })
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || 'Success (No content returned)';
      return { success: true, message: `AI Response: ${content}` };
    } else {
      const errorText = await response.text();
      return { success: false, message: `AI Error (${response.status}): ${errorText.substring(0, 100)}` };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `Connection Error: ${errorMessage}` };
  }
}
