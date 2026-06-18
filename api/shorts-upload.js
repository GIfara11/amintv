import { handleUpload } from '@vercel/blob/client';
import {
  assertAdminRequest,
  buildPublishedMetadata,
  MAX_VIDEO_BYTES,
  parsePublicationPayload,
  requireTrustedOrigin,
  writeShortMetadata
} from './_shorts-store.js';

export async function POST(request) {
  try {
    const body = await request.json();
    if (body?.type === 'blob.generate-client-token') requireTrustedOrigin(request);

    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = parsePublicationPayload(clientPayload);
        assertAdminRequest(request, payload.password);
        if (!pathname.startsWith(`shorts/videos/${payload.id}-`)) {
          throw new Error('Invalid upload path');
        }

        return {
          allowedContentTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            id: payload.id,
            title: payload.title,
            caption: payload.caption
          })
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = parsePublicationPayload(tokenPayload);
        await writeShortMetadata(buildPublishedMetadata(payload, blob));
      }
    });

    return Response.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Short upload failed', error);
    return Response.json(
      { error: error.message || 'Upload failed' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
