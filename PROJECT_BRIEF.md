# Project Brief: Afterline

## 0. Project Overview

Afterline은 책, 아티클, 가사, 영화, 대화 등에서 발견한 인상 깊은 문장을 수집하고, 출처별로 정리하며, 감정과 생각을 함께 기록하는 개인 문장 아카이브 웹앱입니다.

이 앱은 일반적인 독서노트 앱이나 메모앱처럼 보이면 안 됩니다.
핵심 경험은 "개인 에디토리얼 아카이브에 문을 열고 들어가, 수집한 문장과 노트를 꺼내 보는 것"입니다.

사용자는 먼저 카테고리의 문을 선택하고, 그 문 안에 들어가면 해당 유형의 출처들이 책장/아카이브 형태로 보입니다.
책을 선택하면 책장 속 책등이 보이고, 책등에는 책 제목이 적혀 있으며, 클릭하면 해당 책의 수집노트로 이동합니다.

앱 이름은 **Afterline**입니다.

Brand copy:

- Lines that stayed after reading.
- 읽고 난 뒤에도 남은 문장들.

---

## 1. Core Concept

### Main Metaphor

Entrance → Doors → Room → Shelf → Spine → Collection Note

- Entrance: 아카이브 입구
- Doors: 책 / 아티클 / 가사 / 영화 / 대화 / 기타로 들어가는 문
- Room: 선택한 출처 유형의 방
- Shelf: 해당 방 안의 책장 또는 아카이브 선반
- Spine: 개별 출처 카드. 책의 경우 책등
- Collection Note: 출처별 수집노트

Afterline은 "문장 저장 앱"이 아니라
**문장과 생각이 보관된 개인 에디토리얼 아카이브**처럼 느껴져야 합니다.

---

## 2. Visual Direction

### Keywords

- Editorial
- Book Spine
- Archive
- Swiss Typography
- Vertical Text
- Fragment Layout
- Black & White
- Accent Colors
- Door Panels
- Bookshelf
- Collection Note
- Personal Archive

### Design Mood

힙하고 트렌디하며 에디토리얼한 스타일을 원합니다.

너무 귀엽거나 다이어리 앱처럼 보이면 안 됩니다.
너무 평범한 독서기록 앱처럼 보여도 안 됩니다.

전체적으로는 다음 레퍼런스 방향을 따릅니다.

- 세로 타이포그래피
- 책등처럼 긴 직사각형 패널
- 흑백 기반
- 강한 원색 포인트
- 책장/문/아카이브 패널 느낌
- 포스터 같은 레이아웃
- 약간 실험적인 그리드

### Color System

```css
:root {
  --bg: #111111;
  --paper: #f5f1e8;
  --ink: #111111;
  --white: #ffffff;
  --muted: #8c867d;
  --line: #d8d1c5;

  --blue: #2f5fbb;
  --green: #3f8f66;
  --yellow: #f2d23c;
  --red: #e94b2e;
  --orange: #f26938;
  --cyan: #7fc7c6;
}
```

### Typography

Recommended:
- Serif title font: Cormorant Garamond or Libre Baskerville
- UI font: Pretendard or Inter
- Meta font: IBM Plex Mono

Typography should feel like editorial book design. Large English labels are the main visual element. Korean labels should appear smaller as sub-labels.

---

## 3. Navigation

Use English as the main label and Korean as a small sub-label.

Recommended navigation:
- INDEX / 색인
- ROOMS / 방
- NEW LINE / 새 문장
- COLLECTIONS / 수집노트
- MOOD / 감정
- SOURCE / 출처
- DATA / 데이터
- SETTINGS / 설정

---

## 4. Pages

### /

Entrance page.

Purpose: 사용자가 Afterline 아카이브에 진입하는 첫 화면입니다.

Content:
- AFTERLINE logo/type
- Brand copy
- Enter Archive button
- Today's Line preview optional

Example:
```
AFTERLINE

Lines that stayed after reading.
읽고 난 뒤에도 남은 문장들.

[ ENTER ARCHIVE ]
```

Interaction:
- Clicking ENTER ARCHIVE goes to /rooms.
- Transition should feel like entering an archive, with fade/scale animation.

---

### /rooms

Door category page.

This is one of the most important screens.

Show large editorial door panels for each category:
- BOOKS / 책
- ARTICLES / 아티클
- LYRICS / 가사
- MOVIES / 영화
- CONVERSATIONS / 대화
- OTHERS / 기타

Each door panel should include:
- English title
- small Korean label
- short description
- number of collected sources
- number of collected lines

Example door:
```
BOOKS
책

Collected lines
from printed pages.

024 SOURCES
081 LINES
```

Interaction:
- Use Framer Motion if available.
- On hover: subtle tilt, scale, or border glow
- On click: selected door scales up and transitions into matching room
- The transition should feel editorial and restrained
- Avoid literal cartoon door graphics
- Use panel-based door metaphor

Recommended transition:
- Door panel expands
- Typography enlarges
- Background fades to black
- Matching room appears

---

### /rooms/book

Book Room.

This page shows book sources as a bookshelf.
Important: Each spine represents one book/source, not one quote.

Book spine content:
- Book title
- Author
- Number of collected lines
- Reading status
- Mood color accent
- Small Afterline mark

When hovering a spine:
- Spine moves slightly forward
- Maybe slight shadow or scale
- Cursor indicates click

When clicking a spine:
- Animate as if the book is pulled from the shelf
- Navigate to /sources/[id]

---

### /rooms/article

Article Room.

Article sources should appear as thin archive clippings, slim spines, or editorial panels.

Each article item includes:
- Article title
- Author or publisher
- URL/domain
- Number of collected lines
- Keywords or mood tags

The visual style may be slightly flatter and thinner than Book Room.

---

### /rooms/lyrics

Lyrics Room.

Lyrics sources can be shown as record sleeve or track-list inspired panels.

Each source includes:
- Song title
- Artist
- Album optional
- Number of collected lines
- Mood tag

If implementation time is limited, reuse the spine/panel layout but style it differently.

---

### /rooms/movie

Movie Room.

Movie sources can be shown as archive cards or poster-like narrow panels.

Each source includes:
- Movie title
- Director optional
- Year optional
- Number of collected lines

---

### /rooms/conversation

Conversation Room.

For memorable lines from conversations.

Each source can appear as:
- Conversation title
- Person/context optional
- Date
- Number of collected lines

---

### /rooms/other

Other Room.

For uncategorized sources.
Display as archive boxes or neutral editorial panels.

---

### /sources/[id]

Collection Note page.

Every source has a Collection Note.

This page includes:
- Source metadata
- Collected lines
- Personal note
- Summary
- Keywords
- Mood tags
- Source-specific note fields

This should be the main detailed page.

Example for book:
```
AFTERLINE / BOOK / COLLECTION NOTE

DEMIAN
Hermann Hesse
민음사

Collected Lines 08
Reading Status: Finished

────────────────────

LINES / 수집 문장

01
"quote text here"

memo
personal memo here

mood
strange hope / 이상한 희망

────────────────────

READING NOTE / 독서노트

Summary
...

My Thought
...
```

Tabs:
- LINES / 문장
- NOTES / 노트
- INFO / 정보

For books, include Reading Note fields inside Collection Note.
For articles, include URL, publisher, read date, summary, keywords.
For lyrics, include artist, album, listening context, mood.

---

### /quotes/new

New Line page.

This is where users add a new collected line.

Fields:
- Source type
- Source selection or new source creation
- Quote text
- Page/location optional
- Note
- Mood tags
- Color mood
- Favorite toggle
- Visibility

Flow:
1. Choose source type
2. Search or create source
3. Add quote text
4. Add memo/mood
5. Save

For book source type: Provide book search modal.
Manual input must always be possible even if API search fails.

---

### /collections

Collection Notes index.

Show all collection notes across categories.

Filter by:
- Source type
- Mood tag
- Keyword
- Updated date
- Favorite

---

### /mood

Mood index.

Show mood tags and related lines.

Mood tags can be bilingual.

Examples:
- quiet courage / 고요한 용기
- soft sadness / 부드러운 쓸쓸함
- strange hope / 이상한 희망
- cold truth / 차가운 진실
- small comfort / 작은 위로
- working mind / 일하는 마음
- bright anger / 선명한 분노
- afterglow / 잔광

---

### /data

Data page.

Supabase is the main database, but users must be able to export and import CSV.

Features:
- Export CSV
- Import CSV
- Import preview
- Duplicate warning
- Download CSV template

---

## 5. Core Features

### 1. Supabase Integration

Use Supabase as the main database.

Required:
- Authentication
- User-specific data
- Quotes table
- Sources table
- Collection notes table
- CSV import/export connected to Supabase data

Every quote, source, and collection note should belong to a user.

---

### 2. Quote CRUD

Users can create, read, update, and delete quotes.

Quote fields:
- text
- source_id
- page
- note
- mood_tags
- color_mood
- is_favorite
- visibility
- created_at
- updated_at

---

### 3. Source CRUD

Sources are books, articles, lyrics, movies, conversations, or others.

A source can have multiple quotes.

Source fields:
- type
- title
- creator
- publisher
- published_date
- isbn
- cover_url
- url
- external_provider
- external_id

---

### 4. Collection Note CRUD

Every source has one Collection Note.

Collection Note contains:
- summary
- personal note
- keywords
- reading status
- rating
- started date
- finished date
- source-specific metadata

---

### 5. Book Search

When source_type is book, provide book search.

Book search should support:
- title search
- author display
- publisher display
- ISBN
- cover image

API priority:
1. Aladin Open API
2. Naver Book Search API
3. Google Books API
4. Open Library Covers API

API keys should be managed in .env.local.

If no cover image is found, create a typographic placeholder cover using the book title and creator.

Typographic placeholder cover example:
```
DEMIAN

HERMANN
HESSE

AFTERLINE
BOOK SOURCE
```

---

### 6. Today's Line

Home or Index should show one random quote as Today's Line.

Include:
- Quote text
- Source title
- Mood tag
- Button: Shuffle Line
- Button: Open Detail

---

### 7. Search and Filters

Filters:
- source type
- mood tag
- favorite
- keyword
- source title
- creator
- reading status

Search should look through:
- quote text
- source title
- creator
- note
- keywords

---

### 8. CSV Export

Users can export all quote data as CSV.

CSV columns:
```
text,source_type,source_title,creator,page,url,note,mood_tags,color_mood,is_favorite,visibility,created_at
```

Mood tags should be exported as semicolon-separated values.

Example:
```
"문장 내용","book","데미안","Hermann Hesse","123","","메모","quiet courage;small comfort","#6D8EA0","false","private","2026-05-27"
```

---

### 9. CSV Import

Users can import quotes from CSV.

Import rules:
- Required fields: text, source_type, source_title
- mood_tags are separated by semicolon
- If created_at is empty, use current date
- If source_type is empty, set as other
- If visibility is empty, set as private
- If duplicate text + source_title exists, show warning before import
- Show import preview before saving
- When importing, create source if matching source does not exist
- If matching source exists, connect quote to that source

---

### 10. CSV Template Download

Provide downloadable CSV template with headers and one example row.

---

## 6. Data Model

Use Supabase Postgres.

### profiles

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);
```

### sources

```sql
create table sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('book', 'article', 'lyrics', 'movie', 'conversation', 'other')),
  title text not null,
  creator text,
  publisher text,
  published_date text,
  isbn text,
  cover_url text,
  url text,
  external_provider text,
  external_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### quotes

```sql
create table quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  source_id uuid references sources(id) on delete set null,
  text text not null,
  page text,
  note text,
  mood_tags text[] default '{}',
  color_mood text,
  is_favorite boolean default false,
  visibility text default 'private' check (visibility in ('private', 'public')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### collection_notes

```sql
create table collection_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  source_id uuid references sources(id) on delete cascade,
  title text,
  summary text,
  personal_note text,
  keywords text[] default '{}',
  status text check (status in ('to_read', 'reading', 'finished', 'archived')),
  rating numeric,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### RLS

Enable Row Level Security.

Users should only access their own:
- profiles
- sources
- quotes
- collection_notes

Create policies for select, insert, update, delete based on `auth.uid() = user_id`.

---

## 7. Components

Build these components:

- AppHeader
- SideNav
- EntranceHero
- DoorGrid
- DoorPanel
- RoomHeader
- BookRoom
- ArticleRoom
- LyricsRoom
- SourceShelf
- BookSpineCard
- ArchivePanelCard
- CollectionNotePage
- QuoteList
- QuoteItem
- QuoteForm
- SourceForm
- BookSearchModal
- MoodTagPicker
- SourceBadge
- CsvImportPanel
- CsvExportButton
- CsvTemplateButton
- RandomQuotePanel
- TypographicCover
- EmptyState
- LoadingState

Most important components:
- DoorPanel
- BookSpineCard
- CollectionNotePage
- BookSearchModal
- CsvImportPanel

---

## 8. Interaction Details

### Door Interaction

Use Framer Motion.

Interaction:
- hover: slight scale or tilt
- hover: border/line becomes visible
- click: panel expands and transitions to room
- page transition: fade and scale

Do not make the door look cartoonish. It should feel like an editorial panel that behaves like a door.

### Book Spine Interaction

Book spines should look like vertical book spines.

Interaction:
- hover: spine moves slightly forward
- hover: title becomes more readable
- click: spine pulls out slightly
- then navigate to Collection Note

### Collection Note Interaction

Inside Collection Note:
- Lines should be numbered
- Notes should be easy to edit
- Mood tags should be visible
- Add New Line button should be prominent
- Edit Source Info should be available

---

## 9. UX Principles

- Adding a quote should be quick.
- Manual input should always be possible.
- Book API failure should not block saving.
- CSV import/export should make data feel portable.
- The app should feel like entering a private editorial archive.
- The design should be distinctive enough for a portfolio.
- Avoid generic note app UI.
- Avoid cute diary app feeling.
- Prioritize typography, grid, vertical text, and archive feeling.

---

## 10. Suggested Development Order

### Phase 1: Basic Setup
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase client
- Auth
- Basic routing
- RLS setup

### Phase 2: Database CRUD
- sources CRUD
- quotes CRUD
- collection_notes CRUD

### Phase 3: Core Screens
- Entrance page
- Rooms page
- Book Room
- Source Collection Note page
- New Line page

### Phase 4: Book Search
- Book search modal
- API route for book search
- Cover image saving
- Typographic fallback cover

### Phase 5: CSV
- CSV export
- CSV import
- Import preview
- Duplicate warning
- Template download

### Phase 6: Visual Polish
- Door interaction
- Book spine interaction
- Editorial layout
- Mood colors
- Responsive layout

### Phase 7: Extra Features
- Today's Line
- Mood index
- Collections index
- Advanced search/filter
- Card/List view alternatives

---

## 11. Final App Identity

Afterline is not just a reading note app.

It is:
A personal editorial archive where collected lines live behind doors, on shelves, inside collection notes.

Core sentence:
Afterline is a private archive of lines that stayed after reading, listening, and living.

Korean explanation:
Afterline은 책, 아티클, 가사, 영화, 대화에서 오래 남은 문장들을 출처별 수집노트로 보관하는 개인 문장 아카이브입니다.

---

## 12. Project Decisions (재영)

- 1차 목표: 재영 혼자 쓰는 1인용 데모 겸 포트폴리오. 멀티유저 회원가입 UI는 만들지 않음.
- Supabase 계정은 이미 있음. DB 연결은 뒤쪽 Phase에서.
- 인증은 나중에 Supabase 매직링크(비밀번호 없는 이메일 로그인) 단일 사용자 방식으로. RLS(auth.uid() = user_id)는 기획안대로 유지.
- 빌드 순서: 화면·인터랙션(임시 데이터) 먼저 → Supabase 연결 → 책검색/CSV는 그 뒤.
