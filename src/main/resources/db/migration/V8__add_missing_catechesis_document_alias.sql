insert into documents (title, slug, category, summary, content, attachments, source_url, sort_order, created_at)
select
    'Рекомендации к деятельности штатного помощника благочинного по религиозному образованию и катехизации',
    'rekomendatsii-pomoshchniku-blagochinnogo-po-obrazovaniyu-i-katekhizatsii',
    'III. Катехизация и оглашение',
    'Рекомендации к деятельности штатного помощника благочинного по религиозному образованию и катехизации.',
    '<p>Документ доступен для просмотра в формате PDF.</p>',
    'Рекомендации к деятельности штатного помощника благочинного по религиозному образованию и катехизации|' || split_part(attachments, '|', 2),
    source_url || '#pomoshchnik-blagochinnogo',
    sort_order + 1,
    now()
from documents
where source_url = 'https://eorok.ru/images/PDF_documents_EOROiK/DOCUMETY_S_SINOD_SAYTA/KATEHIZIS_I_OGLASH_2021/3.pdf'
  and not exists (
    select 1 from documents where slug = 'rekomendatsii-pomoshchniku-blagochinnogo-po-obrazovaniyu-i-katekhizatsii'
  );
