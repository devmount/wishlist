// Extract the hostname from a given url
export const getBaseUrl = (url: string) => {
  const obj = new URL(url);
  return obj.hostname;
};

// Show a toast notification using Shoelace Alert component
export const notify = (
  title: string,
  variant = 'primary',
  description = '',
  icon = 'info-circle',
  duration = 3000
) => {
  const message = description !== '' ? `<strong>${title}</strong><br />${description}` : title;
  const alert = Object.assign(document.createElement('sl-alert'), {
    variant,
    closable: true,
    duration: duration,
    innerHTML: `
      <sl-icon name="${icon}" slot="icon"></sl-icon>
      ${message}
    `
  });

  document.body.append(alert);
  customElements.whenDefined('sl-alert').then(() => alert.toast());
};

/**
 * Set the favicon in the given color
 */
export const colorFavicon = (color: string) => {
    const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    document.getElementsByTagName('head')[0].appendChild(link);
    link.href = "data:image/svg+xml;base64," + btoa(`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="${color}"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M3 8m0 1a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1z" />
        <path d="M12 8l0 13" />
        <path d="M19 12v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7" />
        <path d="M7.5 8a2.5 2.5 0 0 1 0 -5a4.8 8 0 0 1 4.5 5a4.8 8 0 0 1 4.5 -5a2.5 2.5 0 0 1 0 5" />
      </svg>
    `);

    const meta: HTMLMetaElement = document.querySelector("meta[name='theme-color']") || document.createElement('meta');
    meta.name = "theme-color";
    document.getElementsByTagName('head')[0].appendChild(meta);
    meta.content = color;
}
