<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- Bleeding is stored one row per day in `menstrual_records`; periods and cycles are derived in `src/lib/cycle.ts` — keeps editing per-day simple and predictions pure/testable.
- Cycle/age rules live in pure functions (`src/lib/cycle.ts`, `src/lib/age.ts`) with vitest tests next to them — run them after changing any rule.
- 18+ features are enforced in the database (`current_user_is_adult()` in RLS) and a trigger blocks minors from editing birth date to become adult — UI hiding is never the only guard.
- Profiles are created by the `handle_new_user` trigger from signup metadata (`full_name`, `birth_date`, `terms_accepted`) — signup must send these fields.
- Account deletion runs in a `requireSupabaseAuth` server function that uses the admin client only for the caller's own rows.
- App pages live under `src/routes/_authenticated/` and wrap content in `AppShell` — shared nav without a layout route.
- All UI text is Brazilian Portuguese; colors come from tokens in `src/styles.css`.
