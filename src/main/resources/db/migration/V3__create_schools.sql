create table schools (
    id bigserial primary key,
    title varchar(500) not null,
    slug varchar(550) not null unique,
    summary varchar(1500),
    content text not null,
    image_url varchar(1000),
    source_url varchar(1000) not null unique,
    created_at timestamp with time zone not null
);

create index idx_schools_title on schools (title);
