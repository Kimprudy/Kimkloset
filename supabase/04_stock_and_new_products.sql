-- =============================================================
-- KIMKLOSET — STOCK TRACKING + 10 NEW PRODUCTS
-- Run this ONCE in Supabase → SQL Editor → New query → Run
-- (safe to re-run: it never resets stock you've already edited)
-- =============================================================

-- 1. Stock column: how many pieces you have of each product.
--    Existing products start at 20. Change any number in Table Editor → products → stock.
alter table public.products
  add column if not exists stock integer not null default 20 check (stock >= 0);

-- 2. When an order is PAID, reduce stock by what was bought.
--    Only the server (service role) can run this — shoppers can't call it.
create or replace function public.decrement_stock_for_order(p_order_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.products p
     set stock = greatest(p.stock - oi.qty, 0)
    from (
      select product_id, sum(quantity)::int as qty
        from public.order_items
       where order_id = p_order_id and product_id is not null
       group by product_id
    ) oi
   where p.id = oi.product_id;
$$;

revoke execute on function public.decrement_stock_for_order(uuid) from public, anon, authenticated;
grant execute on function public.decrement_stock_for_order(uuid) to service_role;

-- 3. New products (placeholder prices + stock — edit them anytime in Table Editor)
insert into public.products (slug, name, description, price, category, sizes, colors, image_url, stock)
values
  ('white-ruched-bodycon-midi-dress', 'White Ruched Bodycon Midi Dress',
   'A sleek white V-neck midi dress with a ruched front and a side slit. Stretchy, figure-hugging and easy to dress up or down.',
   28000, 'Dresses', '{XS,S,M,L,XL}', '{White}', '/products/white-ruched-bodycon-midi-dress.jpg', 50),

  ('tangerine-floral-corset-mini-dress', 'Tangerine Floral Corset Mini Dress',
   'A bold orange floral mini dress with a boned corset bodice, ruched skirt and a flirty ruffle hem.',
   30000, 'Dresses', '{XS,S,M,L,XL}', '{Orange}', '/products/tangerine-floral-corset-mini-dress.jpg', 20),

  ('mint-plisse-bustier-mini-dress', 'Mint Plissé Bustier Mini Dress',
   'A strapless mint mini dress in textured plissé fabric with sculpted bustier cups and a body-skimming fit.',
   32000, 'Dresses', '{XS,S,M,L,XL}', '{Mint}', '/products/mint-plisse-bustier-mini-dress.jpg', 20),

  ('black-ruffle-button-front-mini-dress', 'Black Ruffle Button-Front Mini Dress',
   'A black cotton mini dress with dramatic ruffle shoulders, covered buttons, a tie waist and a full, swingy skirt.',
   27000, 'Dresses', '{XS,S,M,L,XL}', '{Black}', '/products/black-ruffle-button-front-mini-dress.jpg', 20),

  ('olive-lace-up-crop-top', 'Olive Lace-Up Crop Top',
   'A long-sleeve olive crop top with a criss-cross lace-up front. Pair it with high-waist jeans for an easy day-to-night look.',
   15000, 'Tops', '{XS,S,M,L,XL}', '{Olive}', '/products/olive-lace-up-crop-top.jpg', 20),

  ('black-lace-cup-bodysuit', 'Black Lace Cup Bodysuit',
   'A black bodysuit with scalloped lace cups, thin straps and a ruched body. Tuck it into jeans or a skirt for a smooth line.',
   18000, 'Tops', '{XS,S,M,L,XL}', '{Black}', '/products/black-lace-cup-bodysuit.jpg', 20),

  ('grey-denim-corset-jumpsuit', 'Grey Denim Corset Jumpsuit',
   'A strapless acid-wash grey denim jumpsuit with a structured corset bodice and straight-leg jeans in one piece.',
   38000, 'Jumpsuits', '{XS,S,M,L,XL}', '{Grey}', '/products/grey-denim-corset-jumpsuit.jpg', 20),

  ('black-satin-corset-burgundy-sequin-skirt-set', 'Black Satin Corset & Burgundy Sequin Skirt Set',
   'A night-out set: a black satin corset top with ruched straps, paired with a burgundy paillette sequin mini skirt.',
   45000, 'Sets', '{XS,S,M,L,XL}', '{"Black & Burgundy"}', '/products/black-satin-corset-burgundy-sequin-skirt-set.jpg', 20),

  ('oat-corset-top-green-cargo-skirt-set', 'Oat Corset Top & Green Cargo Skirt Set',
   'A two-piece set: an oat linen-look corset top with wide straps and a forest-green cargo mini skirt with flap pockets.',
   35000, 'Sets', '{XS,S,M,L,XL}', '{"Oat & Green"}', '/products/oat-corset-top-green-cargo-skirt-set.jpg', 20),

  ('sage-halter-top-black-lace-trouser-set', 'Sage Halter Top & Black Lace Trouser Set',
   'A sage halter tie top with wrap-around straps, paired with high-waist black floral lace flare trousers.',
   33000, 'Sets', '{XS,S,M,L,XL}', '{"Sage & Black"}', '/products/sage-halter-top-black-lace-trouser-set.jpg', 20)
on conflict (slug) do update set
  name        = excluded.name,
  description = excluded.description,
  price       = excluded.price,
  category    = excluded.category,
  sizes       = excluded.sizes,
  colors      = excluded.colors,
  image_url   = excluded.image_url,
  is_active   = true;
  -- (stock is deliberately NOT overwritten on re-run)

-- 4. Placeholder stock for the white feather-cuff dress
update public.products set stock = 50
 where slug = 'ivory-feather-cuff-cutout-dress' and stock = 20;
