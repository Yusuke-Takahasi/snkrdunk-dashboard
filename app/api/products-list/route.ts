import { NextRequest } from 'next/server';
import { getProductsList, parseListParams } from '../../../lib/productsList';
import { getAppSettings, getFeeSettings } from '../../../utils/appSettings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function searchParamsToRecord(
  searchParams: URLSearchParams
): { [key: string]: string | string[] | undefined } {
  const record: { [key: string]: string | string[] | undefined } = {};
  searchParams.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

export async function GET(request: NextRequest) {
  const searchParams = searchParamsToRecord(request.nextUrl.searchParams);
  const params = parseListParams(searchParams);
  const appSettings = await getAppSettings();
  const feeSettings = getFeeSettings(appSettings);
  const result = await getProductsList(params, { feeSettings });
  return Response.json(result);
}
