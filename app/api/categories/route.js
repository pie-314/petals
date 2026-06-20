import { NextResponse } from 'next/server';
import { DEFAULT_CATEGORY, listCategories } from '../../../watchlist.js';

export function GET() {
  return NextResponse.json({
    defaultCategory: DEFAULT_CATEGORY,
    categories: listCategories(),
  });
}
