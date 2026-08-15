-- Free Render services have an ephemeral filesystem. Keep direct document
-- attachments on their original public URLs so they survive restarts.
update documents
set attachments = split_part(attachments, '|', 1) || '|' || source_url
where attachments is not null
  and attachments <> ''
  and source_url ~* '[.](pdf|doc|docx|xls|xlsx|zip|rar)([?].*)?$';
