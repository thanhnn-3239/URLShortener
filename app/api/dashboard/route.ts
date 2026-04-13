import { NextRequest, NextResponse } from 'next/server';
import { getDashboardData } from '@/services/analytics';
import { logger } from '@/lib/logger';
import { ValidationError } from '@/lib/errors';

/**
 * GET /api/dashboard
 *
 * Retrieves aggregated analytics dashboard data with optional date range filtering.
 *
 * Query Parameters:
 *   - startDate (optional): YYYY-MM-DD format, defaults to 30 days ago
 *   - endDate (optional): YYYY-MM-DD format, defaults to today
 *   - groupBy (optional): 'daily' or 'weekly', defaults to 'daily'
 *
 * Response:
 *   - dailyTrends: Array of { date, clicks }
 *   - weeklyTrends: Array of { week, startDate, clicks }
 *   - topLinks: Array of top 10 short links by click count
 *   - insights: Analytics insights (peak source/device, trend direction)
 *   - totalClicks: Total clicks in the date range
 *   - dateRange: The requested date range
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');
    const groupBy = (url.searchParams.get('groupBy') as 'daily' | 'weekly') || 'daily';

    // Default to last 30 days
    const endDate = endDateParam || new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = startDateParam || thirtyDaysAgo.toISOString().split('T')[0];

    // Validate date format and range
    if (!startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      logger.error('invalid_date_format', { startDate });
      return NextResponse.json(
        { error: 'Invalid startDate format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    if (!endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      logger.error('invalid_date_format', { endDate });
      return NextResponse.json(
        { error: 'Invalid endDate format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate date range
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T23:59:59Z`);

    if (start > end) {
      logger.error('invalid_date_range', { startDate, endDate });
      return NextResponse.json(
        { error: 'endDate must be after startDate' },
        { status: 400 }
      );
    }

    // Validate groupBy parameter
    if (!['daily', 'weekly'].includes(groupBy)) {
      logger.error('invalid_groupby', { groupBy });
      return NextResponse.json(
        { error: 'groupBy must be "daily" or "weekly"' },
        { status: 400 }
      );
    }

    logger.info('dashboard_request', {
      startDate,
      endDate,
      groupBy
    });

    // Get dashboard data
    const dashboardData = await getDashboardData({
      startDate,
      endDate,
      groupBy
    });

    logger.info('dashboard_success', {
      totalClicks: dashboardData.totalClicks,
      topLinksCount: dashboardData.topLinks.length,
      dailyPointsCount: dashboardData.dailyTrends.length
    });

    // Set caching headers (5 minute TTL)
    const response = NextResponse.json(dashboardData);
    response.headers.set('Cache-Control', 'public, max-age=300');
    return response;
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.error('dashboard_validation_error', { message: error.message });
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    logger.error('dashboard_error', {
      message: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Failed to retrieve dashboard data' },
      { status: 500 }
    );
  }
}
