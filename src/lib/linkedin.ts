import { getCredentials } from './credential-actions';

interface LinkedInPostResult {
  success: boolean;
  message: string;
  id?: string;
  debug?: any;
}

export async function postToLinkedIn(content: string, imageUrl?: string | null): Promise<LinkedInPostResult> {
  const creds = await getCredentials();
  const keys = Object.keys(creds);
  console.log('[LINKEDIN_DEBUG] Available Credential Keys:', keys);
  
  const { linkedin_client_id, linkedin_access_token, linkedin_urn } = creds;

  console.log('[LINKEDIN_DEBUG] Starting post process');
  console.log('[LINKEDIN_DEBUG] URN:', linkedin_urn);
  console.log('[LINKEDIN_DEBUG] Has Image:', !!imageUrl);
  console.log('[LINKEDIN_DEBUG] Token Present:', !!linkedin_access_token);

  if (!linkedin_access_token || !linkedin_urn) {
    const missing = [];
    if (!linkedin_access_token) missing.push('Access Token');
    if (!linkedin_urn) missing.push('URN');
    
    console.error('[LINKEDIN_ERROR] Missing credentials in database:', missing.join(', '));
    return { 
      success: false, 
      message: `LinkedIn configuration incomplete. Missing: ${missing.join(', ')}`,
      debug: { hasToken: !!linkedin_access_token, hasUrn: !!linkedin_urn }
    };
  }
  
  const accessToken = linkedin_access_token.trim();

  try {
    const body: any = {
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
      body.content = {
        media: {
          title: 'Post Image',
          id: imageUrl
        }
      };
      console.log('[LINKEDIN_DEBUG] Image URN added to body');
    } else if (imageUrl) {
      console.log('[LINKEDIN_DEBUG] Image URL detected - skipping (LinkedIn requires Asset URNs for media)');
    }

    console.log('[LINKEDIN_DEBUG] Payload:', JSON.stringify(body, null, 2));
    console.log('[LINKEDIN_DEBUG] Using Token (Masked):', accessToken.substring(0, 5) + '...' + accessToken.substring(accessToken.length - 5));

    const response = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'LinkedIn-Version': '202401',
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
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
