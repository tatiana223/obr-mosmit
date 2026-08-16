create table site_users (
    id bigserial primary key,
    email varchar(320) not null unique,
    display_name varchar(200) not null,
    password_hash varchar(255) not null,
    role varchar(20) not null check (role in ('ADMIN', 'USER')),
    enabled boolean not null default true,
    created_at timestamp with time zone not null default now()
);

create table competitions (
    id bigserial primary key,
    title varchar(500) not null,
    description text not null,
    deadline date,
    published boolean not null default false,
    created_at timestamp with time zone not null default now()
);

create table competition_applications (
    id bigserial primary key,
    competition_id bigint not null references competitions(id) on delete cascade,
    user_id bigint not null references site_users(id) on delete cascade,
    participant_name varchar(250) not null,
    school_name varchar(500) not null,
    age_group varchar(100),
    comment text,
    status varchar(30) not null default 'NEW' check (status in ('NEW', 'ACCEPTED', 'REJECTED')),
    admin_comment text,
    created_at timestamp with time zone not null default now(),
    unique (competition_id, user_id)
);

create index idx_competitions_published on competitions (published, deadline);
create index idx_competition_applications_status on competition_applications (status, created_at);
