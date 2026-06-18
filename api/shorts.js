import { listAllShorts, SHORT_STATUS } from './_shorts-store.js';

export async function GET() {
  try {
    const items = await listAllShorts();

    return Response.json(
      items.filter((item) => item.status === SHORT_STATUS.PUBLISHED),
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' } }
    );
  } catch (error) {
    console.error('Failed to load shorts', error);
    return Response.json({ error: 'Shorts feed is unavailable' }, { status: 500 });
  }
}
