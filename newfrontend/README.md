# சான்றகம் UI starter

This is a visual layer and page-shell starter for the existing React/Vite frontend. It does not replace the existing Flask backend or feature logic.

## Included image assignments
- Home: `temple-home.png`
- Kural page: `palm-leaf-lamp.png`
- Dictionary: `inscription.png`
- Word history: `stone-pillars.png`
- Daily Kural: `palm-leaf-scroll.png`
- Thiruvalluvar guide: `thiruvalluvar.png`

## Install
Copy the `public/images`, `src/components`, and `src/pages` contents into:
`D:\\github\\newfrontend`

If prompted, merge the folders. Do not replace your existing `App.jsx`, routing, or feature components.

## Integration
1. Import `SaanragamHome` in your current app/router and use it for the home route.
2. For each existing feature route, keep the existing functionality and render it as children of the matching page shell:
   - `KuralPageShell`
   - `WordMeaningPageShell`
   - `WordHistoryPageShell`
   - `DailyKuralPageShell`
   - `ThiruvalluvarPageShell`
3. Example:
   ```jsx
   <WordHistoryPageShell>
     <ExistingWordHistoryComponent />
   </WordHistoryPageShell>
   ```
4. Ensure `src/components/SaanragamLayout.css` is imported by `SaanragamLayout.jsx` (already included).
5. Run `npm run dev` and test each route. These shells are not a replacement for existing components or API calls.

## Notes
- Uses standard React and CSS; no extra npm dependencies.
- The page backgrounds use a dark overlay so foreground text remains readable.
- Google Fonts import is optional; the UI falls back to system fonts if offline.
- The links in `SaanragamHome.jsx` are example paths. Adjust them to match the routes already configured in your app.

## App setup
Install router dependency in the Vite project: `npm install react-router-dom`.
The supplied `src/App.jsx` and `src/App.css` provide a basic route structure and placeholder feature pages. These are starter screens; connect the existing Flask endpoints next.
