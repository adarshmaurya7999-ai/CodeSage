-- Pull Requests table
create table pull_requests (
  id            text primary key default gen_random_uuid()::text,
  owner         text not null,
  repo          text not null,
  pr_number     integer not null,
  pr_title      text not null,
  author        text not null,
  risk_score    integer default 0,
  risk_level    text default 'LOW',
  summary       text default '',
  commit_sha    text not null,
  created_at    timestamp with time zone default now()
);

-- Findings table
create table findings (
  id               text primary key default gen_random_uuid()::text,
  pull_request_id  text references pull_requests(id) on delete cascade,
  severity         text not null,
  category         text not null,
  owasp_code       text,
  owasp_name       text,
  file             text not null,
  line             integer not null,
  comment          text not null,
  fix_suggestion   text,
  created_at       timestamp with time zone default now()
);

-- Index for fast lookups by repo
create index idx_prs_repo on pull_requests(owner, repo);
create index idx_findings_pr on findings(pull_request_id);

-- GitHub OAuth users (CodeSage login)
create table users (
  id              text primary key default gen_random_uuid()::text,
  github_id       bigint unique not null,
  github_login    text unique not null,
  name            text,
  avatar_url      text,
  email           text,
  created_at      timestamp with time zone default now(),
  updated_at      timestamp with time zone default now()
);

-- GitHub access tokens (server-side only; use service role from API routes)
create table github_tokens (
  user_id         text primary key references users(id) on delete cascade,
  access_token    text not null,
  scopes          text,
  created_at      timestamp with time zone default now(),
  updated_at      timestamp with time zone default now()
);

create index idx_users_github_login on users(github_login);
