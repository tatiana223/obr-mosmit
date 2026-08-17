-- Убрать тестовый конкурс из публичного раздела
delete from competitions
where title = 'Пробный творческий конкурс';
