-- Keep the archive in the same eight sections as on the legacy site.
-- This also fixes rows imported before section detection was added.
update documents
set category = case
    when source_url like '%/dokumenty/17-glavnoe%' then 'Главное'
    when source_url like '%/dokumenty/20-osnovy-pravoslavnoj-kultury%'
      or source_url like '%/OSNOVY_PRAVOSLAVNOY_KULTURY%' then 'I. Основы Православной культуры'
    when source_url like '%/dokumenty/18-voskresnye-shkoly%'
      or source_url like '%/VOSKRESNYE_SHKOLY%' then 'II. Воскресные школы'
    when source_url like '%/dokumenty/19-katekhizatsiya-i-oglashenie%'
      or source_url like '%/KATEHIZIS_I_OGLASH_2021/%' then 'III. Катехизация и оглашение'
    when source_url like '%/dokumenty/21-pravoslavnyj-komponent-osnovnogo-dopolnitelnogo-obrazovaniya%'
      or source_url like '%/PRAV_KOMPONENT_2021/%' then 'IV. Православный компонент'
    when source_url like '%/dokumenty/27-konfessionalnaya-attestatsiya%' then 'V. Конфессиональная аттестация'
    when source_url like '%/dokumenty/26-rasporyazheniya%' then 'VI. Распоряжения'
    when source_url like '%/dokumenty/22-tsentry-podgotovki-prikhodskikh-spetsialistov%' then 'VII. Центры подготовки приходских специалистов'
    when source_url like '%/dokumenty/23-monitoring%' then 'Мониторинг'
    else category
end;

create index if not exists idx_documents_category_order
    on documents (category, sort_order, title);
