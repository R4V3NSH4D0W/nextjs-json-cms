# Nepal Map Story Notes

## Current Direction

The homepage map experience has temporarily replaced the horizontal story slider.
The current interaction model is:

- Default view: full Nepal with all provinces highlighted by color.
- Province click: isolate that province only.
- District click: isolate that district only.
- Back control: shown inside the map at the top-right, used to step back from district to province and from province to country.

The map is intentionally locked down as a guided storytelling graphic:

- No dragging
- No touch panning
- No scroll zoom
- No double-click zoom
- No keyboard navigation

Map transitions use animated `fitBounds`, and district overlays are delayed until the map settles to avoid temporary boundary mismatch during transitions.

## Main Files

- `app/page.tsx`
  Current homepage composition. The old horizontal story section is commented out and the map section is active.

- `components/map/nepal-map-section.tsx`
  Section wrapper, heading, and layout around the map/story experience.

- `components/map/nepal-leaflet-map.tsx`
  Core Leaflet implementation:
  province isolation, district isolation, back button, story panel logic, and transition behavior.

- `components/map/map-story-data.ts`
  Shared constants and authored story content.
  This is now the main place to add future province and district content.

- `app/district/[slug]/page.tsx`
  District deep-dive page template.
  Currently intended for Bagmati district stories.

- `public/geo-json/`
  Source GeoJSON files used by the map.

## Current Content Scope

Only Bagmati Province is fully authored right now.

Bagmati includes:

- Province-level story
- District-level stories
- District slugs for deep-dive pages
- Open-source story images

Other provinces currently:

- Can be selected and isolated on the map
- Show placeholder/coming-later story messaging
- Do not expose district-level storytelling yet

## Bagmati Districts Currently Mapped

- Bhaktapur
- Chitawan
- Dhading
- Dolakha
- Kavrepalanchok
- Kathmandu
- Lalitpur
- Makawanpur
- Nuwakot
- Ramechhap
- Rasuwa
- Sindhuli
- Sindhupalchok

## Open-Source Images

Story images are currently sourced from Wikimedia Commons using `Special:FilePath` URLs.

Relevant config:

- `next.config.ts` includes a remote image pattern for `commons.wikimedia.org`.

If image sourcing changes later, update:

- `components/map/map-story-data.ts`
- `next.config.ts` if a new domain is introduced

## UX Decisions Already Made

- Removed framed map canvas so the map blends into the page.
- Removed generic "plain map" wording and reframed the section as a narrative regional entry point.
- Moved back navigation into the map so the right panel can stay story-focused.
- Prevented manual user movement of the map.
- Removed default Leaflet focus outlines and white background artifacts.

## Suggested Next Steps

1. Move all non-Bagmati provinces from placeholder state to authored province stories.
2. Add district story content for one more province after Bagmati.
3. Add richer district deep-dive pages with gallery, highlights, and local narrative sections.
4. Add province labels directly on the map if needed.
5. Consider replacing Leaflet with a custom SVG-based map later if tighter visual control is needed.

## Important Notes

- The old horizontal slider work still exists in the repo in `components/story/horizontal-story-section.tsx`, but it is currently not active on the homepage.
- If the map transitions ever feel visually off again, check `MapSelectionController` in `components/map/nepal-leaflet-map.tsx` first.
- District boundary rendering is intentionally enabled only for Bagmati right now.
