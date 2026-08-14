create table documents (
    id bigserial primary key,
    title varchar(600) not null,
    slug varchar(650) not null unique,
    category varchar(300),
    summary varchar(1500),
    content text not null,
    attachments text,
    source_url varchar(1000) not null unique,
    created_at timestamp with time zone not null
);
create index idx_documents_title on documents (title);
