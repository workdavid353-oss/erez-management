-- =========================================
-- מערכת ניהול תיקים - סכמת Supabase
-- =========================================

-- 1. טבלת פרופילים (מרחיבה את auth.users)
CREATE TABLE public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. טבלת תיקים ראשית
CREATE TABLE public.cases (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_number         SERIAL,
  court_case_number     TEXT,
  name                  TEXT NOT NULL,
  subject               TEXT,
  category              TEXT,
  additional_info       TEXT,
  initial_price         NUMERIC,
  total_case_value      NUMERIC,
  work_hours            NUMERIC,
  client_offer          NUMERIC,
  total_used            NUMERIC,
  status                TEXT DEFAULT 'חדש',
  notes                 TEXT,
  assigned_employee_id  UUID REFERENCES public.profiles(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_by            UUID REFERENCES public.profiles(id)
);

-- 3. טבלת הקצאות (תיק <-> עובד)
CREATE TABLE public.case_assignments (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id          UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  employee_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  task_type        TEXT,
  general_info     TEXT,
  last_update      TEXT,
  assigned_by_note TEXT,
  charges          NUMERIC,
  status           TEXT DEFAULT 'חדש',
  priority         TEXT,
  target_date      DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(case_id, employee_id)
);

-- =========================================
-- Row Level Security (RLS)
-- =========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_assignments ENABLE ROW LEVEL SECURITY;

-- פרופילים: כל מחובר רואה הכל, רק אדמין יכול לשנות
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (
  auth.uid() = id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- תיקים: כולם קוראים, רק אדמין כותב
CREATE POLICY "cases_select" ON public.cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "cases_insert" ON public.cases FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "cases_update" ON public.cases FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "cases_delete" ON public.cases FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- הקצאות: כולם קוראים, אדמין כותב הכל, עובד מעדכן את שלו
CREATE POLICY "assignments_select" ON public.case_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "assignments_insert" ON public.case_assignments FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "assignments_update" ON public.case_assignments FOR UPDATE TO authenticated USING (
  employee_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "assignments_delete" ON public.case_assignments FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =========================================
-- Trigger: יצירת פרופיל אוטומטית עם הרשמה
-- =========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'employee'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- הגדרת מנהל (הרץ אחרי שנרשמת):
-- =========================================
-- UPDATE public.profiles SET role = 'admin', full_name = 'ענת' WHERE id = 'USER_UUID_HERE';
