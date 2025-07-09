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
