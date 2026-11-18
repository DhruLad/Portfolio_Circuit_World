# Circuit World

Dhru Lad's playable engineering portfolio. The map is a circuit board with four districts around the MCU hub, each of the 15 projects is a building with its own mini-game, and every project you open lights up its trace back to the hub.

No frameworks and no build step: plain HTML, CSS and JavaScript.

## Run it

Double-click `index.html`. That's all.

## Add a project

1. Open `content.js`, copy one project block inside `projects`, and change the text. The comment at the top of the file lists every field.
2. Set `category` to an existing district's name, or to a new name to create a new district.
3. Optional: pick a `sprite` (building art) and a `demo` (mini-game). The names are listed at the top of `content.js` and `js/demos.js`.
4. Optional: put photos in `assets/projects/<id>/` and list the file names in `photos`.
5. Save. The board, the project panels, the map and Quick View all pick it up.

Each district holds four buildings per row and grows a new row when it fills.

## Before you share it

In `content.js`, under `profile`:

- `email`: the address you want public.
- `resume`: put a public PDF (without your phone number) at `assets/resume.pdf`, then set `resume: "assets/resume.pdf"`.

In `index.html`: once the site is live, change `og:image` to the full address of `assets/preview.png` and add an `og:url` tag, then check the card in LinkedIn Post Inspector.

## Put it online with GitHub Pages

1. Create a public repository named `<your-username>.github.io`.
2. Upload everything in this folder.
3. In the repository's Settings, open Pages and publish from the main branch.

The site appears at `https://<your-username>.github.io/`. A single project can be linked directly, for example `https://<your-username>.github.io/#function-generator`.

## Files

```
index.html          page shell, share-preview tags, script tags in load order
style.css           title screen, top bar, panels, Quick View
content.js          every word and fact about Dhru and his projects
js/engine.js        game loop, keyboard and touch input, camera, collision
js/art.js           palette, sprite and tile pixel grids, drawing helpers
js/world.js         builds the board from content.js: hub, districts, buildings, traces
js/ui.js            title, top bar, project panel, map, Quick View, finale
js/demos.js         mini-demos, registered by name
assets/projects/    project photos, one folder per project id
assets/preview.png  1200 x 627 share image
```

To change how Dhru looks, edit the colours in `PAL` at the top of `js/art.js`.
