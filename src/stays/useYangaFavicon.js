import { useEffect } from 'react';

const YANGA_ICON = '/yanga%20google%20icon.png';

// Shows the Yanga icon in the browser tab while a Yanga page is open, and puts the
// JR icon back when the visitor moves on to the rest of the site.
export default function useYangaFavicon() {
  useEffect(() => {
    const links = Array.from(document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]'));
    const originals = links.map((l) => ({ link: l, href: l.getAttribute('href'), type: l.getAttribute('type') }));

    // Make sure there is an icon link to change, even if index.html has none.
    let created = null;
    if (!links.some((l) => l.rel.includes('icon') && l.rel !== 'apple-touch-icon')) {
      created = document.createElement('link');
      created.rel = 'icon';
      document.head.appendChild(created);
      links.push(created);
    }

    links.forEach((l) => {
      l.setAttribute('href', YANGA_ICON);
      l.setAttribute('type', 'image/png');
    });

    return () => {
      originals.forEach(({ link, href, type }) => {
        link.setAttribute('href', href);
        if (type) link.setAttribute('type', type); else link.removeAttribute('type');
      });
      if (created) created.remove();
    };
  }, []);
}
