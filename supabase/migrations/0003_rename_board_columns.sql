-- Board columns change from To Do / In Progress / Done / Shipped to
-- To Do / In Progress / Test/Validate / Done (ADR-006, docs/DECISIONS.md).
-- The 3rd column becomes a testing stage; the old 4th column ("Shipped")
-- becomes the new "Done". Existing cards are remapped, not just relabeled:
-- old "done" -> "test_validate", old "shipped" -> "done".

alter table cards drop constraint cards_column_key_check;

update cards set column_key = case column_key
  when 'done' then 'test_validate'
  when 'shipped' then 'done'
  else column_key
end
where column_key in ('done', 'shipped');

alter table cards add constraint cards_column_key_check
  check (column_key in ('todo', 'in_progress', 'test_validate', 'done'));
