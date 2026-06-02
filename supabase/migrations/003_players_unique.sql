-- Add unique constraint so upsert onConflict: 'display_name' works
alter table players add constraint players_display_name_unique unique (display_name);
