# MirrorIQ

**See what works on you before you commit.**

MirrorIQ is a hackathon prototype for the YouCam API Skin AI & Apparel VTO Hackathon.

It combines:

- YouCam Skin AI analysis
- YouCam Apparel Virtual Try-On
- a transparent MirrorIQ Match Score

into one decision-making experience.

## Problem

Online fashion shopping forces people to guess whether a look will actually work for them.

MirrorIQ turns that guess into an interactive decision.

## Core Flow

1. Upload a photo.
2. Analyze the photo with YouCam Skin AI.
3. Choose an occasion and style preference.
4. Select 1 to 3 garments.
5. Generate apparel try-on previews.
6. Compare looks side-by-side.
7. See a deterministic MirrorIQ Match Score.

## Architecture

Browser  
→ Next.js API routes  
→ YouCam API adapter  
→ YouCam API  

The browser never receives the YouCam API key.

Key directories:

```txt
app/api/skin          Skin analysis route
app/api/vto           Apparel VTO submit route
app/api/vto/status    Apparel VTO status route
lib/youcam            YouCam integration layer
lib/scoring           MirrorIQ Match Score
data/garments         Local garment catalog
public/garments       Placeholder garment assets