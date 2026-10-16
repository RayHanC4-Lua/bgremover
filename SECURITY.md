# Security Policy

**English** | [Bahasa Indonesia](SECURITY.id.md)

## Supported versions

Only the latest version of the website at https://removebg.sbs and the latest Android release are supported.

## Reporting a vulnerability

Please do not open a public issue for security problems.

Email **hello.ryhanc@gmail.com** with:

- A description of the issue and its impact
- Steps to reproduce
- Your device and browser, if relevant

You will get a reply within 7 days. Once the issue is fixed, you will be credited in the changelog if you want.

## Scope

- The website and its service worker
- The Android app in `android/`
- The tester sign-up form and its Supabase table

User images never leave the device, so there is no server-side image storage to attack. Reports about third-party services (Cloudflare, Supabase, Google Play) should go to those vendors.
