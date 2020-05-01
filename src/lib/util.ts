export const HAS_WINDOW = typeof window !== 'undefined';

// https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md#feature-detection
let _supportsPassive = false;
try {
  const opts = Object.defineProperty({}, 'passive', {
    get: function() {
      _supportsPassive = true;
    },
  });
  (window as any).addEventListener('test', null, opts);
  (window as any).removeEventListener('test', null, opts);
} catch (e) {}

export const SUPPORTS_PASSIVE: boolean = _supportsPassive;

export const passiveEventListenerOption = SUPPORTS_PASSIVE
  ? { passive: true, capture: false }
  : false;

export function isBodyElement(el: Element): el is HTMLBodyElement {
  return el.constructor === HTMLBodyElement;
}

/**
 * Determine if the browser supports CSS transform feature.
 */
export function supportTransform(transform3d: boolean = false): string | false {
  let result: string | false = false;
  const property = transform3d ? 'perspective' : 'transform',
    upper = property.charAt(0).toUpperCase() + property.slice(1),
    prefixes = ['Webkit', 'Moz', 'O', 'ms'],
    support = document.createElement('support'),
    style = support.style;

  (property + ' ' + prefixes.join(upper + ' ') + upper)
    .split(' ')
    .forEach(function(property, i) {
      if (style[property] !== undefined) {
        result = property;
        return false;
      }
    });
  return result;
}

/**
 * Trigger custom event.
 */
export function dispatchCustomEvent(
  element: Element,
  eventName: string,
  data?: any,
) {
  let event!: CustomEvent;
  try {
    event = new CustomEvent(eventName, { detail: data });
  } catch (e) {
    event = document.createEvent('CustomEvent');
    event.initCustomEvent(eventName, true, true, data);
  }
  element.dispatchEvent(event);
}

/**
 * Get current coordinates left and top of specific element.
 */
export function offsetRelative(
  element: HTMLElement,
): { left: number; top: number } {
  const result = { left: 0, top: 0 };

  do {
    const offsetTop = element.offsetTop;
    const offsetLeft = element.offsetLeft;

    if (!isNaN(offsetTop)) result.top += offsetTop;
    if (!isNaN(offsetLeft)) result.left += offsetLeft;

    element = (isBodyElement(element)
      ? element.parentElement
      : element.offsetParent) as HTMLElement;
  } while (element);
  return result;
}

export function addClass(element: Element, className: string) {
  if (!hasClass(element, className)) {
    if (element.classList) element.classList.add(className);
    else element.className += ' ' + className;
  }
}

export function removeClass(element: Element, className: string) {
  if (hasClass(element, className)) {
    if (element.classList) element.classList.remove(className);
    else
      element.className = element.className.replace(
        new RegExp(
          '(^|\\b)' + className.split(' ').join('|') + '(\\b|$)',
          'gi',
        ),
        ' ',
      );
  }
}

export function hasClass(element: Element, className: string) {
  if (element.classList) {
    return element.classList.contains(className);
  } else {
    return new RegExp('(^| )' + className + '( |$)', 'gi').test(
      element.className,
    );
  }
}

export function toHtmlElement(
  source: string | HTMLElement,
  parent: HTMLElement | Document = document,
): HTMLElement | undefined {
  if (typeof source === 'string') {
    const el = parent.querySelector(source);
    return el ? (el as HTMLElement) : undefined;
  }
  return source;
}

export function findParent(
  child: HTMLElement,
  selector: string,
): HTMLElement | undefined {
  const containers = Array.from(document.querySelectorAll(selector));

  for (const container of containers) {
    if (container.contains(child)) return container as HTMLElement;
  }
}

export function extend<T extends object = object>(
  defaults: T,
  options: Partial<T>,
): T {
  const results: T = Object.assign({}, defaults);
  for (const key in defaults) {
    const value = options[key];
    if (value !== undefined) {
      results[key] = value as any;
    }
  }
  return results;
}
