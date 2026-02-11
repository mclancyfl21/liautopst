import { getCredentials } from './credential-actions';

interface LinkedInPostResult {
  success: boolean;
  message: string;
  id?: string;
  debug?: any;
}

export async function postToLinkedIn(content: string, imageUrl?: string | null): Promise<LinkedInPostResult> {
  const creds = await getCredentials();
  const { linkedin_access_token, linkedin_urn } = creds;

  const accessToken = linkedin_access_token?.trim();

  console.log('[LINKEDIN_DEBUG] Starting post process (REST API)');
  console.log('[LINKEDIN_DEBUG] URN:', linkedin_urn);
  
  if (!accessToken || !linkedin_urn) {
    return { success: false, message: 'Missing token or URN' };
  }

  try {
    const body = {
      author: linkedin_urn,
      commentary: content,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: []
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false
    };

    if (imageUrl && imageUrl.startsWith('urn:li:')) {
      (body as any).content = {
        media: {
          title: 'Post Image',
          id: imageUrl
        }
      };
    }

    console.log('[LINKEDIN_DEBUG] Payload:', JSON.stringify(body, null, 2));

    const response = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'LinkedIn-Version': '202501',
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const debugInfo = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    };

    console.log('[LINKEDIN_DEBUG] Response Status:', response.status);

    if (response.ok) {
      const postId = response.headers.get('x-restli-id') || 'unknown';
      console.log('[LINKEDIN_SUCCESS] Post created with ID:', postId);
      return { success: true, message: 'Post successful', id: postId, debug: debugInfo };
    } else {
      const errorText = await response.text();
      console.error('[LINKEDIN_ERROR] API returned error:', errorText);
      return { 
        success: false, 
        message: `LinkedIn API Error: ${response.status} ${response.statusText} - ${errorText}`, 
        debug: { ...debugInfo, errorBody: errorText } 
      };
    }
  } catch (error: any) {
    console.error('[LINKEDIN_CRITICAL_ERROR] Fetch failed:', error.message);
    return { 
      success: false, 
      message: `Critical Error: ${error.message}`, 
      debug: { stack: error.stack } 
    };
  }
}
