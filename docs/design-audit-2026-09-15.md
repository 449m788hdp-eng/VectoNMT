# Vekto — UX audit, 15 September 2026

## Research and direction

Reviewed primary descriptions of these learning experiences before the redesign:

- [Khan Academy: course and unit mastery](https://support.khanacademy.org/hc/en-us/articles/115002552631-What-are-Course-and-Unit-Mastery): connect practice to actual skill progress. Vekto now recommends a topic only when recorded answers show room to improve.
- [Quizlet: targeted studying with Progress](https://help.quizlet.com/hc/en-ca/articles/360048803491-Using-Progress-for-targeted-studying): make review an actionable learning step. Results lead back to topic practice; completed attempts offer a direct mistakes filter.
- [iLearn](https://ilearn.org.ua/): clear subject-level entry points and distinct test/trainer experiences. Vekto keeps single-subject practice separate from timed simulation.
- [NN/g usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/): visible status, error prevention, recognition, user control and minimalism. Applied to save status, recoverable navigation, selected-answer contrast, empty-state actions and simpler copy.

These are principles, not copied branding or page layouts. Product direction: dark neutral-green surfaces, restrained lime accents, readable text, rounded controls and a quiet exam workspace. No AI is involved in runtime selection, checking or recommendations.

## Screen/component audit

| Surface | Change |
| --- | --- |
| Shell and navigation | Clear active states, keyboard focus, skip link, named screen routes, compact mobile bottom navigation. |
| Overview | Practice-first main action, secondary simulation entry, real weak-topic recommendation, visible active attempt, four enrolled subject cards. |
| Practice setup | Named setup card, readable inputs and count presets, searchable syllabus, topic selection scrolls back to setup, honest availability and empty search feedback. |
| Simulation setup | Two-stage route, optional break copy, accessible fourth-subject selector, single launch action. |
| Exam workspace | Larger conditions and answers, quieter metadata, consistent subject tabs, saved-answer progress, numbered navigation with accessible state labels. |
| Mobile exam | Collapsible question navigator, 44px question targets, stacked matching columns, compact sticky answer actions. |
| Answer types | Reviewed radio, multiple choice, matching, ordering, numeric and three-group layouts; retained scoring and validation. |
| Navigation guard | Dialog offers save-and-continue or deliberate discard; existing answers stay in the database. Only last viewed question ID is stored locally as an optional UI preference. |
| Results and history | Readable real scores, direct mistakes filter, topic follow-up, first-test CTA for empty history. |
| Profile | Four-target layout, optional identity fields, clearer selected fourth subject, responsive form and saved feedback. |
| Break, dialogs and errors | Optional early continuation retained; localized close controls, contained dialog scrolling, visible error feedback, preserved drafts after failure. |
| Loading and motion | Calm initial skeleton, contextual saving states, lazy math renderer, reduced-motion support. |

## Performance changes

- One session initialization response replaces separate browser bootstrap calls for seven subjects and a subsequent dashboard request.
- Bank-version checks skip already-installed subject imports.
- Independent overview and simulation reads run concurrently.
- Test startup loads only selected subject configurations and reuses the selected question rows in its response.
- New D1 indexes support practice selection, official variants, user history and stage navigation.
- Save/reveal/flag opt into compact responses; older clients retain the full-session response contract.
- Navigation between loaded questions performs no network request. Authoritative answers/results remain server-side.
- KaTeX JavaScript loads only for content containing mathematics.

## Validation

- TypeScript check and production build.
- Scoring suite: 412 official answer keys, partial credit, numeric formatting, invalid selections and scale boundaries.
- Platform integration suite: guest access, isolation, revisions, compact and legacy responses, recovery, persistence, no-repeat selection, cancellation, idempotent finish, four simulation configurations, deadlines, optional break and statistics.
- Browser walkthrough: overview, topic search/selection, two-question practice, unsaved-answer dialog, save/reveal, wrong-answer explanation, finish/results/history, profile save, both simulation stages and optional break.
- Browser viewport checks at 1440×1000, 820×1180 and 390×844; checked document width against viewport width, mathematical rendering and mobile answer controls. These are responsive browser checks, not physical-device or full assistive-technology certification.

## Content boundaries

This release changes presentation and runtime efficiency, not the question bank's contents or NMT rules. Existing topic-coverage gaps remain explicitly visible. Some source-derived language questions require a separate content audit to ensure letter highlighting survives the original import; visual improvements alone cannot reconstruct missing source markup.
