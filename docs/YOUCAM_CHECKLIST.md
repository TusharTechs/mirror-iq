# YouCam Live Integration Checklist

Before setting `DEMO_MODE=false`, verify from the official YouCam hackathon documentation:

## Authentication

- [ ] Base URL
- [ ] API key header format
  - `Authorization: Bearer ...`
  - or `x-api-key: ...`
  - or another documented format

## Skin Analysis

- [ ] Skin endpoint path
- [ ] HTTP method
- [ ] Request content type
  - multipart/form-data
  - JSON base64
  - other
- [ ] Image field name
- [ ] Required image constraints
- [ ] Response shape
  - skin type
  - radiance
  - redness
  - texture
  - moisture/hydration
  - or other supported fields

Update:

- `.env.local`
- `lib/youcam/config.ts`
- `lib/youcam/normalize.ts`

## Apparel VTO

- [ ] VTO submit endpoint path
- [ ] HTTP method
- [ ] Person image field name
- [ ] Garment image field name
- [ ] Whether VTO is synchronous or asynchronous
- [ ] Job/task/request id field name
- [ ] Status endpoint path template
- [ ] Status values
- [ ] Result image field
  - URL
  - base64
  - binary image
- [ ] Rate limits
- [ ] Timeout guidance
- [ ] Supported garment image formats

Update:

- `.env.local`
- `lib/youcam/config.ts`
- `lib/youcam/normalize.ts`
- `lib/youcam/vto.ts` if the official flow differs materially

## Credit Safety

- [ ] `DEMO_MODE=true` while developing UI
- [ ] Only switch to live after endpoint verification
- [ ] Test with one photo and one garment first
- [ ] Log the number of units consumed after each live test