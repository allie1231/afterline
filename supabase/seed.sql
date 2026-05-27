-- =====================================================================
-- AFTERLINE — Seed sample data
--
-- Run this ONCE, AFTER you have signed in via magic link at least once.
--
-- Step 1: In Supabase Dashboard → Authentication → Users, find your row
--         and copy the value in the "User UID" column.
-- Step 2: Replace the placeholder UUID below with your UID.
-- Step 3: Run this script in the SQL Editor.
-- =====================================================================

do $$
declare
  me uuid := '00000000-0000-0000-0000-000000000000';  -- ← REPLACE THIS
begin
  -- Sources
  insert into public.sources (user_id, type, title, creator, publisher, isbn, cover_url, created_at, updated_at)
  values
    (me, 'book',  'Demian',                          'Hermann Hesse',         '민음사',                 '9780060959470', 'https://covers.openlibrary.org/b/isbn/9780060959470-L.jpg', '2026-01-04', '2026-01-04'),
    (me, 'book',  'The Bell Jar',                    'Sylvia Plath',          'Faber & Faber',         '9780571268863', 'https://covers.openlibrary.org/b/isbn/9780571268863-L.jpg', '2026-02-11', '2026-02-11'),
    (me, 'article','On Paying Attention',            'The New Yorker',        null,                    null,            null, '2026-03-02', '2026-03-02'),
    (me, 'lyrics','How to Disappear Completely',     'Radiohead',             'Kid A',                 null,            null, '2026-03-19', '2026-03-19'),
    (me, 'lyrics','Two Slow Dancers',                'Mitski',                'Be the Cowboy',         null,            null, '2026-04-02', '2026-04-02'),
    (me, 'movie', 'Magnolia',                        'Paul Thomas Anderson',  null,                    null,            null, '2026-04-12', '2026-04-12'),
    (me, 'movie', 'In the Mood for Love',            'Wong Kar-wai',          null,                    null,            null, '2026-04-20', '2026-04-20'),
    (me, 'conversation','Late Walk With Y',          'Y',                     null,                    null,            null, '2026-05-04', '2026-05-04'),
    (me, 'other', 'Napkin Notes',                    'Tuesday Cafe',          null,                    null,            null, '2026-05-11', '2026-05-11');

  -- Quotes (joined via title since seed ids are auto-generated)
  insert into public.quotes (user_id, source_id, text, page, note, mood_tags, is_favorite, visibility, created_at, updated_at)
  select me, s.id, q.text, q.page, q.note, q.mood_tags, q.is_favorite, 'private', q.created_at, q.created_at
  from (values
    ('Demian',                       'Each man had only one genuine vocation — to find the way to himself.', '132', '되돌아가는 길이 아니라 안쪽으로 내려가는 길.', array['strange hope','quiet courage'], true,  '2026-01-05'::timestamptz),
    ('Demian',                       'The bird fights its way out of the egg.',                              '76',  null,                                       array['bright anger'],                  false, '2026-01-06'::timestamptz),
    ('The Bell Jar',                 'I took a deep breath and listened to the old brag of my heart. I am, I am, I am.', null, null, array['soft sadness','afterglow'],  true,  '2026-02-12'::timestamptz),
    ('On Paying Attention',          'Attention is the rarest and purest form of generosity.',               null,  null,                                       array['working mind'],                  false, '2026-03-03'::timestamptz),
    ('How to Disappear Completely',  'I''m not here, this isn''t happening.',                                null,  null,                                       array['soft sadness'],                  false, '2026-03-19'::timestamptz),
    ('Two Slow Dancers',             'We''re two slow dancers, last ones out.',                              null,  null,                                       array['afterglow','soft sadness'],      true,  '2026-04-02'::timestamptz),
    ('Magnolia',                     'We may be through with the past, but the past ain''t through with us.', null, null,                                       array['cold truth'],                    false, '2026-04-12'::timestamptz),
    ('In the Mood for Love',         'He remembers those vanished years as though looking through a dusty window pane.', null, null, array['afterglow'],         true,  '2026-04-20'::timestamptz),
    ('Late Walk With Y',             '결국 우리는 자기 자신이 쓴 문장을 따라 살게 되는 것 같아.',           null,  null,                                       array['quiet courage'],                 false, '2026-05-04'::timestamptz),
    ('Napkin Notes',                 '사소함의 정확함.',                                                     null,  '냅킨에 옮겨 적어둔 메모.',                  array['small comfort'],                 false, '2026-05-11'::timestamptz)
  ) as q(title, text, page, note, mood_tags, is_favorite, created_at)
  join public.sources s on s.user_id = me and s.title = q.title;

  -- Collection notes
  insert into public.collection_notes (user_id, source_id, summary, personal_note, keywords, status, started_at, finished_at, created_at, updated_at)
  select me, s.id, n.summary, n.personal_note, n.keywords, n.status, n.started_at, n.finished_at, n.created_at, n.updated_at
  from (values
    ('Demian',                '성장이라는 단어가 갖는 무게에 대해.', '두 번째 읽었을 때 더 또렷해진 책. 새의 비유는 매번 새롭다.', array['growth','self'],     'finished', '2025-12-20'::timestamptz, '2026-01-04'::timestamptz, '2026-01-04'::timestamptz, '2026-01-08'::timestamptz),
    ('The Bell Jar',          null,                                  '읽다 잠시 덮어둔 책. 호흡이 가팔라질 때마다.',               array['depression','self'], 'reading',  '2026-02-08'::timestamptz, null,                       '2026-02-11'::timestamptz, '2026-02-15'::timestamptz),
    ('In the Mood for Love',  '거의 닿지 않는 두 사람의 거리감.',    '다시 보면 더 멀어 보이는 사람들.',                          array['longing','time'],    'finished', null,                       null,                       '2026-04-20'::timestamptz, '2026-04-21'::timestamptz)
  ) as n(title, summary, personal_note, keywords, status, started_at, finished_at, created_at, updated_at)
  join public.sources s on s.user_id = me and s.title = n.title;
end $$;
