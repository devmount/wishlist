// Shoelace web components, bundled instead of loaded from a CDN.
// Only components used in the app are imported, add new ones here.
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/themes/dark.css';
import { registerIconLibrary } from '@shoelace-style/shoelace/dist/utilities/icon-library.js';

import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/button-group/button-group.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/color-picker/color-picker.js';
import '@shoelace-style/shoelace/dist/components/copy-button/copy-button.js';
import '@shoelace-style/shoelace/dist/components/details/details.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/drawer/drawer.js';
import '@shoelace-style/shoelace/dist/components/format-date/format-date.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/relative-time/relative-time.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/switch/switch.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';

// Icons are bundled too, only the used ones are imported, add new ones here
import arrowReturnLeftIcon from '@shoelace-icons/arrow-return-left.svg';
import arrowRightIcon from '@shoelace-icons/arrow-right.svg';
import bagCheckIcon from '@shoelace-icons/bag-check.svg';
import bagPlusIcon from '@shoelace-icons/bag-plus.svg';
import cartCheckIcon from '@shoelace-icons/cart-check.svg';
import cartDashIcon from '@shoelace-icons/cart-dash.svg';
import checkCircleIcon from '@shoelace-icons/check-circle.svg';
import chevronBarExpandIcon from '@shoelace-icons/chevron-bar-expand.svg';
import circleIcon from '@shoelace-icons/circle.svg';
import clipboardCheckIcon from '@shoelace-icons/clipboard-check.svg';
import clipboardPlusIcon from '@shoelace-icons/clipboard-plus.svg';
import clipboardXIcon from '@shoelace-icons/clipboard-x.svg';
import envelopeIcon from '@shoelace-icons/envelope.svg';
import exclamationCircleIcon from '@shoelace-icons/exclamation-circle.svg';
import houseDoorIcon from '@shoelace-icons/house-door.svg';
import infoCircleIcon from '@shoelace-icons/info-circle.svg';
import lightningIcon from '@shoelace-icons/lightning.svg';
import link45degIcon from '@shoelace-icons/link-45deg.svg';
import listIcon from '@shoelace-icons/list.svg';
import listNestedIcon from '@shoelace-icons/list-nested.svg';
import patchExclamationIcon from '@shoelace-icons/patch-exclamation.svg';
import patchMinusIcon from '@shoelace-icons/patch-minus.svg';
import pencilIcon from '@shoelace-icons/pencil.svg';
import plusIcon from '@shoelace-icons/plus.svg';
import shareIcon from '@shoelace-icons/share.svg';
import shieldLockIcon from '@shoelace-icons/shield-lock.svg';
import tagIcon from '@shoelace-icons/tag.svg';
import trashIcon from '@shoelace-icons/trash.svg';

const icons: Record<string, string> = {
  'arrow-return-left': arrowReturnLeftIcon,
  'arrow-right': arrowRightIcon,
  'bag-check': bagCheckIcon,
  'bag-plus': bagPlusIcon,
  'cart-check': cartCheckIcon,
  'cart-dash': cartDashIcon,
  'check-circle': checkCircleIcon,
  'chevron-bar-expand': chevronBarExpandIcon,
  'circle': circleIcon,
  'clipboard-check': clipboardCheckIcon,
  'clipboard-plus': clipboardPlusIcon,
  'clipboard-x': clipboardXIcon,
  'envelope': envelopeIcon,
  'exclamation-circle': exclamationCircleIcon,
  'house-door': houseDoorIcon,
  'info-circle': infoCircleIcon,
  'lightning': lightningIcon,
  'link-45deg': link45degIcon,
  'list': listIcon,
  'list-nested': listNestedIcon,
  'patch-exclamation': patchExclamationIcon,
  'patch-minus': patchMinusIcon,
  'pencil': pencilIcon,
  'plus': plusIcon,
  'share': shareIcon,
  'shield-lock': shieldLockIcon,
  'tag': tagIcon,
  'trash': trashIcon,
};

registerIconLibrary('default', {
  resolver: (name) => icons[name],
});
