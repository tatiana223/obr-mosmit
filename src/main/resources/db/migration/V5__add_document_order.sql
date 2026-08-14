alter table documents add column sort_order integer not null default 0;
create index idx_documents_sort_order on documents (sort_order);
