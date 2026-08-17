create table contact_people (
    id bigserial primary key,
    role varchar(300) not null default '',
    title varchar(200) not null default '',
    name varchar(300) not null default '',
    email varchar(320) not null default '',
    sort_order integer not null default 0
);

insert into contact_people (role, title, name, email, sort_order)
select chairman_role,
       case when chairman_name ~ '^[^ ]+ ' then split_part(chairman_name, ' ', 1) else '' end,
       case when chairman_name ~ '^[^ ]+ ' then substring(chairman_name from position(' ' in chairman_name) + 1) else chairman_name end,
       chairman_email,
       10
from site_contacts
where chairman_name is not null and chairman_name <> '';

insert into contact_people (role, title, name, email, sort_order)
select assistant_role,
       case when assistant_name ~ '^[^ ]+ ' then split_part(assistant_name, ' ', 1) else '' end,
       case when assistant_name ~ '^[^ ]+ ' then substring(assistant_name from position(' ' in assistant_name) + 1) else assistant_name end,
       assistant_email,
       20
from site_contacts
where assistant_name is not null and assistant_name <> '';
