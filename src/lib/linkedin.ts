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
  const version = '202601';

  console.log('[LINKEDIN_DEBUG] Starting post process (REST API)');
  console.log('[LINKEDIN_DEBUG] URN:', linkedin_urn);
  
  if (!accessToken || !linkedin_urn) {
    return { success: false, message: 'Missing token or URN' };
  }

  let imageUrn: string | null = null;

  try {
    // 1. If imageUrl exists, handle the multi-step upload process
    if (imageUrl) {
      console.log('[LINKEDIN_DEBUG] Image detected. Starting upload workflow.');
      
      // A. Download image binary from Cloudinary
      console.log('[LINKEDIN_DEBUG] Fetching image from Cloudinary:', imageUrl);
      const imageRes = await fetch(imageUrl);
      if (!imageRes.ok) throw new Error(`Failed to fetch image from Cloudinary: ${imageRes.statusText}`);
      const imageBuffer = await imageRes.arrayBuffer();
      console.log('[LINKEDIN_DEBUG] Image downloaded. Size:', imageBuffer.byteLength);

      // B. Initialize upload on LinkedIn
      console.log('[LINKEDIN_DEBUG] Initializing LinkedIn image upload');
      const initRes = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'LinkedIn-Version': version,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify({
          initializeUploadRequest: {
            owner: linkedin_urn
          }
        })
      });

      if (!initRes.ok) {
        const err = await initRes.text();
        throw new Error(`LinkedIn Initialize Upload Error (${initRes.status}): ${err}`);
      }

      const initData = await initRes.json();
      const uploadUrl = initData.value.uploadUrl;
      imageUrn = initData.value.image;
      console.log('[LINKEDIN_DEBUG] LinkedIn Image URN:', imageUrn);

      // C. Upload binary to LinkedIn
      console.log('[LINKEDIN_DEBUG] Uploading binary to LinkedIn');
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': imageRes.headers.get('content-type') || 'image/jpeg'
        },
        body: imageBuffer
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        throw new Error(`LinkedIn Binary Upload Error (${uploadRes.status}): ${err}`);
      }
      console.log('[LINKEDIN_DEBUG] Binary upload successful');
    }

    // 2. Create the Post
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

    if (imageUrn) {
      body.content = {
        media: {
          title: 'Post Image',
          id: imageUrn
        }
      };
    }

    console.log('[LINKEDIN_DEBUG] Creating post with payload:', JSON.stringify(body, null, 2));

    const response = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'LinkedIn-Version': version,
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
    console.error('[LINKEDIN_CRITICAL_ERROR] Workflow failed:', error.message);
    return { 
      success: false, 
      message: `Critical Error: ${error.message}`, 
      debug: { stack: error.stack } 
    };
  }
}
