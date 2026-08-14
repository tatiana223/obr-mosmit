create table school_details (
    id bigserial primary key,
    school_id bigint not null references schools(id) on delete cascade,
    section_key varchar(50) not null,
    label varchar(300) not null,
    content text not null,
    sort_order integer not null default 0
);

create index idx_school_details_school_order on school_details (school_id, sort_order, id);
