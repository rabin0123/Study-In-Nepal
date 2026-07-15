<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"
      dir="ltr"
      data-bs-theme="light"
      data-color-theme="Blue_Theme"
      data-layout="vertical"
      @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>
        <script src="https://code.iconify.design/iconify-icon/3.1.1/iconify-icon.min.js"></script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.ico" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link rel="preload" href="/hero-video1.mp4" as="video" type="video/mp4" fetchpriority="high" />

        {{-- ─────────────────────────────────────────────────────────────
             MaterialM theme — global CSS
             Loaded site-wide so the Partner Portal sidebar/navbar (which
             uses MaterialM's Bootstrap markup) renders correctly on every
             Inertia page, not just on full reloads.
        ───────────────────────────────────────────────────────────── --}}
        <link rel="stylesheet" href="/assets/css/styles.css">
        <link rel="stylesheet" href="/assets/libs/owl.carousel/dist/assets/owl.carousel.min.css">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])

        <x-inertia::head>
            <title>{{ config('app.name', 'Study In Nepal') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased link-sidebar">
        <x-inertia::app />

        {{-- ─────────────────────────────────────────────────────────────
             MaterialM theme — global JS
             Order matters: vendor bundle (jQuery + Bootstrap + Popper)
             must load before any theme script that depends on them.
             These stay at the very end of <body> so the Inertia root
             (#app, rendered by <x-inertia::app />) exists in the DOM
             before the scripts run and bind their (delegated) handlers.
        ───────────────────────────────────────────────────────────── --}}
        <script src="/assets/js/vendor.min.js"></script>
        <script src="/assets/libs/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
        <script src="/assets/libs/simplebar/dist/simplebar.min.js"></script>
        <script src="/assets/js/theme/app.init.js"></script>
        <script src="/assets/js/theme/theme.js"></script>
        <script src="/assets/js/theme/app.min.js"></script>
        <script src="/assets/js/theme/sidebarmenu-default.js"></script>
        <script src="https://code.iconify.design/iconify-icon/3.1.1/iconify-icon.min.js"></script>
    </body>
</html>