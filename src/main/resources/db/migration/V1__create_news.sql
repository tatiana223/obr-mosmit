create table news (
    id bigserial primary key,
    title varchar(300) not null,
    slug varchar(350) not null unique,
    summary varchar(1000),
    content text not null,
    cover_image_url varchar(1000),
    status varchar(30) not null,
    published_at timestamp with time zone,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create index idx_news_status_published_at on news (status, published_at desc);
