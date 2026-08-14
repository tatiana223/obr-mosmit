-- Additional legacy file paths discovered after V6 had already been applied.
update documents
set category = case
    when source_url ~ '/DOCUMETY_S_SINOD_SAYTA/[0-9]+[.]pdf$'
      then 'I. Основы Православной культуры'
    when source_url like '%/VSK_SHK_2021/%'
      then 'II. Воскресные школы'
    when source_url like '%/KONFES_ATTESTAT_2021/%'
      then 'V. Конфессиональная аттестация'
    when source_url like '%/Rasporyazheniya_2021_20/%'
      then 'VI. Распоряжения'
    when source_url like '%/images/docs/anketa_%'
      then 'Мониторинг'
    else category
end;
