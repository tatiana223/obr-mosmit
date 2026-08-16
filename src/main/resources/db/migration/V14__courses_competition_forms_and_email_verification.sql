alter table site_users add column email_verified boolean not null default false;
alter table site_users add column verification_token varchar(100);
alter table site_users add column verification_expires_at timestamp with time zone;
update site_users set email_verified = true;
create unique index idx_site_users_verification_token on site_users (verification_token) where verification_token is not null;

alter table competitions add column gallery_urls text;
alter table competitions add column form_url varchar(1000);
alter table competitions add column form_description text;

create table courses (
    id bigserial primary key,
    title varchar(500) not null,
    description text not null,
    cover_image_url varchar(1000),
    gallery_urls text,
    published boolean not null default false,
    created_at timestamp with time zone not null default now()
);

insert into competitions (title, description, deadline, published, form_description)
select 'Пробный творческий конкурс',
       'Пробный конкурс для проверки регистрации участников и поступления заявок в кабинет администратора.',
       current_date + 60,
       true,
       'Чтобы принять участие, войдите в личный кабинет и заполните заявку.'
where not exists (select 1 from competitions where title = 'Пробный творческий конкурс');
