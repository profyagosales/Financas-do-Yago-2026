insert into public.categories (user_id, name, type, is_default)
select id, category_name, category_type, true
from auth.users
cross join (
  values
    ('Salario', 'income'),
    ('Freelance', 'income'),
    ('Moradia', 'expense'),
    ('Mercado', 'expense'),
    ('Transporte', 'expense'),
    ('Saude', 'expense'),
    ('Lazer', 'expense'),
    ('Transferencia', 'transfer')
) as seed(category_name, category_type)
on conflict do nothing;
