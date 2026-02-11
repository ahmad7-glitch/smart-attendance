-- ============================================
-- Performance Indexes & Materialized Views
-- Run this AFTER schema.sql
-- ============================================

-- ---- Additional Performance Indexes ----

-- Composite index for date-range queries (weekly trend, monthly reports)
CREATE INDEX IF NOT EXISTS idx_attendance_date_status 
  ON public.attendance_logs(date, status);

-- Index on created_at for sorting/filtering by creation time
CREATE INDEX IF NOT EXISTS idx_attendance_created_at 
  ON public.attendance_logs(created_at);

-- Index for user role lookups (used in middleware, RLS policies)
CREATE INDEX IF NOT EXISTS idx_users_role 
  ON public.users(role);

-- Covering index for common dashboard query pattern
CREATE INDEX IF NOT EXISTS idx_attendance_user_date_status 
  ON public.attendance_logs(user_id, date, status);

-- ---- Materialized View: Monthly Attendance Summary ----
-- Avoids repeated aggregation for reports and stats

CREATE MATERIALIZED VIEW IF NOT EXISTS public.monthly_attendance_summary AS
SELECT
  u.id AS user_id,
  u.full_name,
  date_trunc('month', al.date)::date AS month,
  COUNT(*) FILTER (WHERE al.status = 'PRESENT') AS present_count,
  COUNT(*) FILTER (WHERE al.status = 'LATE') AS late_count,
  COUNT(*) FILTER (WHERE al.status = 'INCOMPLETE') AS incomplete_count,
  COUNT(*) AS total_days,
  ROUND(
    (COUNT(*) FILTER (WHERE al.status IN ('PRESENT', 'LATE'))::numeric / 
     NULLIF(COUNT(*), 0)) * 100, 1
  ) AS attendance_rate
FROM public.users u
LEFT JOIN public.attendance_logs al ON al.user_id = u.id
WHERE u.role = 'teacher'
GROUP BY u.id, u.full_name, date_trunc('month', al.date)::date;

-- Index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_summary_user_month
  ON public.monthly_attendance_summary(user_id, month);

-- Function to refresh the materialized view (call daily or on-demand)
CREATE OR REPLACE FUNCTION public.refresh_monthly_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.monthly_attendance_summary;
END;
$$;

-- ---- RPC: Get Dashboard Stats in Single Call ----
-- Reduces multiple round-trips to a single DB call

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(target_date date DEFAULT CURRENT_DATE)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  result json;
  total_teachers int;
  present_count int;
  late_count int;
  incomplete_count int;
BEGIN
  SELECT COUNT(*) INTO total_teachers 
  FROM public.users WHERE role = 'teacher';

  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE status = 'PRESENT'), 0),
    COALESCE(COUNT(*) FILTER (WHERE status = 'LATE'), 0),
    COALESCE(COUNT(*) FILTER (WHERE status = 'INCOMPLETE'), 0)
  INTO present_count, late_count, incomplete_count
  FROM public.attendance_logs 
  WHERE date = target_date;

  result := json_build_object(
    'totalTeachers', total_teachers,
    'presentToday', present_count,
    'lateToday', late_count,
    'incompleteToday', incomplete_count,
    'attendancePercentage', 
      CASE WHEN total_teachers > 0 
        THEN ROUND(((present_count + late_count)::numeric / total_teachers) * 100)
        ELSE 0 
      END
  );

  RETURN result;
END;
$$;

-- ---- RPC: Get Weekly Trend in Single Call ----

CREATE OR REPLACE FUNCTION public.get_weekly_trend(days int DEFAULT 7)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  result json;
  total_teachers int;
BEGIN
  SELECT COUNT(*) INTO total_teachers 
  FROM public.users WHERE role = 'teacher';

  SELECT json_agg(row_to_json(t) ORDER BY t.date)
  INTO result
  FROM (
    SELECT 
      d.date::text AS date,
      COALESCE(COUNT(*) FILTER (WHERE al.status = 'PRESENT'), 0) AS present,
      COALESCE(COUNT(*) FILTER (WHERE al.status = 'LATE'), 0) AS late,
      GREATEST(0, total_teachers - 
        COALESCE(COUNT(*) FILTER (WHERE al.status = 'PRESENT'), 0) -
        COALESCE(COUNT(*) FILTER (WHERE al.status = 'LATE'), 0)
      ) AS absent
    FROM generate_series(
      CURRENT_DATE - (days - 1), 
      CURRENT_DATE, 
      '1 day'::interval
    ) AS d(date)
    LEFT JOIN public.attendance_logs al ON al.date = d.date::date
    GROUP BY d.date
  ) t;

  RETURN COALESCE(result, '[]'::json);
END;
$$;
