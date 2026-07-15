-- Create the stock_items table for Pawning Stock Management
create table if not exists public.stock_items (
    id uuid default gen_random_uuid() primary key,
    bill_no varchar not null,
    price numeric(12, 2) not null default 0.00,
    weight numeric(10, 3) not null default 0.000,
    date date not null,
    item_type varchar not null, -- PP, PR, NL, EAR, etc.
    status varchar not null default 'Active', -- 'Active', 'Withdrawn'
    withdrawal_date date,
    withdrawal_reason varchar,
    withdrawal_notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.stock_items enable row level security;

-- Create policies to allow all actions for authenticated users (or public depending on project rules)
create policy "Allow public read access" 
on public.stock_items for select 
using (true);

create policy "Allow public insert access" 
on public.stock_items for insert 
with check (true);

create policy "Allow public update access" 
on public.stock_items for update 
using (true);

create policy "Allow public delete access" 
on public.stock_items for delete 
using (true);
