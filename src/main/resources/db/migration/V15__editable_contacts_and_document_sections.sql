create table document_sections (
    id bigserial primary key,
    title varchar(300) not null,
    slug varchar(320) not null unique,
    parent_id bigint references document_sections(id) on delete cascade,
    sort_order integer not null default 0
);

insert into document_sections (title, slug, sort_order)
select category, 'legacy-' || row_number() over (order by min(sort_order), category), row_number() over (order by min(sort_order), category)
from documents where category is not null and category <> '' group by category;

alter table documents add column section_id bigint references document_sections(id) on delete set null;
alter table documents add column published boolean not null default true;
alter table documents add column updated_at timestamp with time zone not null default now();
update documents d set section_id=s.id from document_sections s where s.title=d.category;

create table site_contacts (
    id bigint primary key default 1 check (id=1),
    city varchar(300) not null,
    address varchar(600) not null,
    public_email varchar(320) not null,
    public_email_note varchar(600) not null,
    chairman_role varchar(300) not null,
    chairman_name varchar(300) not null,
    chairman_email varchar(320) not null,
    assistant_role varchar(300) not null,
    assistant_name varchar(300) not null,
    assistant_email varchar(320) not null
);
insert into site_contacts values (1,'Московская область, г. Коломна','Голутвинская улица, 11','eorok@mail.ru','Для обращений и предложений о сотрудничестве','Председатель отдела','Протоиерей Сергий Якимов','kolomna-obr@yandex.ru','Помощник председателя отдела','Чтец Николай Казинов','nkazinov@mail.ru');
