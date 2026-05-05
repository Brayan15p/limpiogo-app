-- Migration: auto-update pro rating after review insert
create or replace function update_pro_rating(pro_uuid uuid)
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set
    rating        = (select round(avg(rating)::numeric, 2) from public.reviews where reviewed_id = pro_uuid),
    total_reviews = (select count(*) from public.reviews where reviewed_id = pro_uuid),
    updated_at    = now()
  where id = pro_uuid;
end;
$$;
