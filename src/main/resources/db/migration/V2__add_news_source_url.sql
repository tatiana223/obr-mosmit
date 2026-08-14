alter table news add column source_url varchar(1000);
create unique index uq_news_source_url on news (source_url) where source_url is not null;
