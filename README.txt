# Comic Vault — free personal comic tracker

## What's included
- `index.html`: single-page personal inventory app
- Barcode scanner using the open-source ZXing browser library (loaded from a public CDN)
- Manual comic entry/editing, inventory search, status filters, series goals, CSV import/export, full JSON backup/restore
- Data saved in the browser's local storage; no account or paid backend

## Important limitations
- Barcode decoding is not the same as identifying a comic. This app scans the barcode, then lets you search the web and confirm/enter the record.
- Cover-image recognition and live market valuation are not included in this first version.
- Browser-local data does not automatically sync across devices. Download JSON backups regularly.
- Camera access generally requires HTTPS or localhost. Opening the HTML directly from a phone's file manager may not allow camera access.
- The scanner library is loaded from a free public CDN, so barcode scanning needs internet access. The inventory itself is stored locally.
- This app is a starting version; test it with a small batch and export a backup before entering thousands of comics.

## How to use it
1. For ordinary computer use, open `index.html` in a modern browser.
2. To use camera scanning on a phone, publish the folder as a static site over HTTPS (a free static hosting service such as GitHub Pages can do this). No paid hosting is required.
3. Tap **Add / Scan**, grant camera permission, scan a barcode, then verify the comic details and press **Save comic**.
4. To transfer to another device, export a JSON backup on the old device and restore it on the new one.

## Free hosting note
The app has no server-side code and requires no API key. Hosting it publicly means the page itself is publicly accessible, but your collection records remain in that browser's local storage and are not uploaded by this app. Do not put personal records directly into the HTML file.
