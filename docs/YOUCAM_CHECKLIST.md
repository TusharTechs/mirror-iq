# YouCam Live Integration Verification Form (Prototype 0.2)

Legend: VERIFIED | REPORTED-PLAYGROUND | NOT VERIFIED

## 0. Official references
- Doc portal URL: __________
- Skin API doc page: __________
- Clothes VTO doc page: __________
- Playground URL: __________
- Verbatim excerpts: docs/youcam-official-excerpts.md (create when pasted)

## A. Authentication — NOT VERIFIED
- Key format: __________
- Header name + exact syntax: __________ (playground report: API-key authorization; syntax unverified)
- Extra token step: __________
- Same mechanism for Skin + VTO: __________

## B. Skin Analysis — NOT VERIFIED
- Endpoint + method: __________
- Content type / upload mechanism: __________
- Image field name: __________
- Parameter to limit categories (minimum useful set): __________
- Sync vs async: __________ ; task id field: __________ ; status endpoint: __________
- Success response sample: __________
- Error response sample: __________
- Returned skin fields + value representation: __________
- Units per call: __________

## C. Clothes VTO — NOT VERIFIED
- Submit endpoint + method: __________
- Person photo field / requirements: __________
- Garment image field / requirements / category param: __________
- Sync vs async: __________ ; task id field: __________ ; status endpoint template: __________
- Result image format (URL/base64/binary): __________
- Failure response sample: __________
- Units per call: __________
- REPORTED-PLAYGROUND (pending doc check): JPEG/PNG ≤10 MB; min 512×384; long side ≤4096 px.
- App policy: keep 4 MB cap; reject invalid input client-side before spending units.

## D. Live test log
- Skin call: NOT RUN
- VTO call: NOT RUN
- Units consumed: 0