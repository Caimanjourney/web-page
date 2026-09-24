# Moirai static site

`styles.css` is the production stylesheet served with the page. It is generated from the Tailwind classes in `index.html`, so visitors do not need to download or run Tailwind in their browser.

After changing Tailwind classes or `tailwind.config.js`, regenerate it before publishing:

```sh
npm install
npm run build:css
```

The site itself remains a static deployment: publish the contents of `web-page/` as usual.
