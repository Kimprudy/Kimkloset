-- =============================================================
-- KIMKLOSET — PRODUCT CATALOG (placeholder prices in Naira)
-- Run this SECOND in Supabase → SQL Editor → New query → Run
-- Safe to re-run: it updates products that already exist.
-- Images live in the app at /public/products/<slug>.jpg
-- =============================================================

insert into public.products (slug, name, description, price, category, sizes, colors, image_url)
values
  ('noir-sculpted-blazer-dress', 'Noir Sculpted Blazer Dress',
   'A sharp black blazer dress with padded shoulders, peak lapels and a cropped overlay that cinches into a sculpted waist. Made to turn heads at dinner, the office or a night out.',
   45000, 'Outerwear', '{XS,S,M,L,XL}', '{Black}', '/products/noir-sculpted-blazer-dress.jpg'),

  ('sunset-satin-twist-dress', 'Sunset Satin Twist Dress',
   'A long-sleeve satin dress in a bold watercolour print of orange, violet and teal, with a deep V neckline and a front twist that hugs the waist.',
   32000, 'Dresses', '{XS,S,M,L,XL}', '{Multicolour}', '/products/sunset-satin-twist-dress.jpg'),

  ('midnight-lace-satin-midi-dress', 'Midnight Lace Satin Midi Dress',
   'A black satin midi slip dress with delicate eyelash-lace trim, a sheer lace corset panel and a draped, figure-hugging skirt.',
   38000, 'Dresses', '{XS,S,M,L,XL}', '{Black}', '/products/midnight-lace-satin-midi-dress.jpg'),

  ('ivory-cowl-neck-top', 'Ivory Cowl Neck Top',
   'A soft, sleeveless ivory top with a fluid cowl neckline and gentle draping. Dress it up with a skirt or keep it easy with jeans.',
   15000, 'Tops', '{XS,S,M,L,XL}', '{Ivory}', '/products/ivory-cowl-neck-top.jpg'),

  ('mint-gauze-button-down-shirt', 'Mint Gauze Button-Down Shirt',
   'A breezy button-down shirt in textured mint cotton gauze with a relaxed fit and roll-up sleeves. Your go-to for hot Lagos days.',
   18000, 'Tops', '{XS,S,M,L,XL}', '{Mint}', '/products/mint-gauze-button-down-shirt.jpg'),

  ('indigo-denim-corset-top', 'Indigo Denim Corset Top',
   'A structured indigo denim corset top with contrast stitching, a front zip, fold-over collar details and adjustable straps.',
   22000, 'Tops', '{XS,S,M,L,XL}', '{Indigo}', '/products/indigo-denim-corset-top.jpg'),

  ('sage-satin-ruched-maxi-dress', 'Sage Satin Ruched Maxi Dress',
   'A sage green satin maxi dress with quilted cups, thin straps and all-over ruching that follows your curves to the floor.',
   35000, 'Dresses', '{XS,S,M,L,XL}', '{Sage}', '/products/sage-satin-ruched-maxi-dress.jpg'),

  ('black-plunge-backless-bodysuit', 'Black Plunge Backless Bodysuit',
   'A backless shaping bodysuit with a deep plunge, moulded cups and clear adjustable straps. The invisible base for open-back and low-cut looks.',
   20000, 'Shapewear', '{XS,S,M,L,XL}', '{Black}', '/products/black-plunge-backless-bodysuit.jpg'),

  ('ivory-feather-cuff-cutout-dress', 'Ivory Feather-Cuff Cutout Dress',
   'A long-sleeve ivory mini dress with a sculpted underbust cutout, a ruched wrap skirt and soft feather-trimmed cuffs. Made for birthdays, dinners and every big night out.',
   42000, 'Dresses', '{XS,S,M,L,XL}', '{Ivory}', '/products/ivory-feather-cuff-cutout-dress.jpg')
on conflict (slug) do update set
  name        = excluded.name,
  description = excluded.description,
  price       = excluded.price,
  category    = excluded.category,
  sizes       = excluded.sizes,
  colors      = excluded.colors,
  image_url   = excluded.image_url,
  is_active   = true;
