# MirrorIQ

**Stop guessing. See what works.**

MirrorIQ is a visual fashion decision engine that helps shoppers compare the clothes they are considering on themselves before committing to a purchase.

## The Problem
Online fashion shopping forces people to guess whether a look will actually work for them. Standard virtual try-on tools generate one image at a time, leaving the user to mentally compare options.

## The Solution
MirrorIQ lets a user upload ONE photo, select an occasion and style preference, choose 1–3 garments they are considering, and instantly see them all on themselves side-by-side. It then calculates a transparent "Match Score" to recommend the strongest option.

**YouCam VTO = visualization engine**
**MirrorIQ = decision engine**

## User Flow
1. **Upload:** One clear, front-facing photo with shoulders visible.
2. **Intent:** Select an occasion (Everyday, Work, Date Night, Party) and style (Minimal, Street, Classic).
3. **Choices:** Select up to 3 garments from a curated catalog.
4. **Look Lab:** See generated virtual try-on results side-by-side.
5. **Decision:** View the MirrorIQ Match Score and recommendation.

## YouCam Apparel VTO Integration
MirrorIQ integrates **Perfect Corp. YouCam Apparel Virtual Try-On (V4)**.

### Server-Side Architecture
All YouCam API interactions are handled server-side via Next.js API routes (`/api/vto`, `/api/vto/status`). The API key never reaches the browser.

### Why `src_file_id` and Presigned Uploads?
While the YouCam API documentation mentions `src_file_url`, their servers cannot reliably fetch from arbitrary public URLs due to hotlink protection and CDN restrictions (resulting in `error_download_image`). 

To ensure 100% reliability, MirrorIQ implements the official **presigned S3 upload flow**:
1. `POST /s2s/v2.0/file` to get a presigned PUT URL and `file_id`.
2. `PUT` the binary image directly to Amazon S3.
3. Submit the VTO task using `src_file_id` and `ref_file_id`.

## Match Score
The **MirrorIQ Match Score** is a deterministic, transparent heuristic calculated by MirrorIQ (NOT by YouCam). It is based on:
- Style preference compatibility
- Occasion compatibility
- Garment style tags

It is an experimental product feature to help users articulate why a look works. It makes no scientific, medical, or objective attractiveness claims.

## Environment Setup & DEMO_MODE

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local