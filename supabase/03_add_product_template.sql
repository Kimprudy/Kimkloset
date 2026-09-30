-- =============================================================
-- ADD A NEW PRODUCT (copy this, change the values, Run in SQL Editor)
-- Easier alternative: Supabase → Table Editor → products → Insert row
-- =============================================================
-- slug       : unique, lowercase, words joined with dashes (used in the web address)
-- price      : whole Naira, no commas or ₦ sign (25000 = ₦25,000)
-- category   : Dresses, Tops, Outerwear or Shapewear (a new word creates a new category tab)
-- image_url  : the photo's public URL from Supabase Storage,
--              OR /products/<file>.jpg if you put the photo in the project's public/products folder
insert into public.products (slug, name, description, price, category, sizes, colors, image_url)
values (
  'red-satin-cowl-dress',
  'Red Satin Cowl Dress',
  'A fluid red satin midi dress with a soft cowl neckline and thin straps.',
  30000,
  'Dresses',
  '{XS,S,M,L,XL}',
  '{Red}',
  'https://YOUR-PROJECT.supabase.co/storage/v1/object/public/products/red-satin-cowl-dress.jpg'
);

-- Hide a product without deleting it (keeps old orders intact):
-- update public.products set is_active = false where slug = 'red-satin-cowl-dress';

-- Change a price:
-- update public.products set price = 28000 where slug = 'red-satin-cowl-dress';
