import {
  offsetRelative,
  supportTransform,
  dispatchCustomEvent,
  addClass,
  removeClass,
  toHtmlElement,
  findParent,
  passiveEventListenerOption,
  extend,
} from './util';

export type SpacingFunction = (sidebar: BusySidebar) => number;

export interface Options {
  /**
   * Container element or selector to know what the beginning and end of sticky element.
   */
  container?: HTMLElement | string;

  /**
   * Inner wrapper selector or element.
   */
  innerWrapper?: HTMLElement | string;

  /**
   * Additional top spacing of the element when it becomes sticky.
   */
  topSpacing?: number | SpacingFunction;

  /**
   * Additional bottom spacing of the element when it becomes sticky.
   */
  bottomSpacing?: number | SpacingFunction;

  /**
   * The name of CSS class to apply to elements when they have become stuck.
   */
  stickyClass?: string | false;

  /**
   * Set the minimum width or media query string.
   * The sidebar returns to its normal position if its query matched.
   */
  mediaQuery?: string | number | false;

  /**
   * If you have set this property to Nuber, it will periodically monitor the container element's offset.
   */
  watchOffsetInterval?: number | false;
}

export interface Settings extends Omit<Required<Options>, 'container'> {}

export type AffixedType =
  | 'STATIC'
  | 'VIEWPORT-TOP'
  | 'VIEWPORT-BOTTOM'
  | 'CONTAINER-BOTTOM'
  | 'VIEWPORT-UNBOTTOM';

export type Direction = 'down' | 'up';

export interface Dimensions {
  translateY: number;
  maxTranslateY: number;
  topSpacing: number;
  lastTopSpacing: number;
  bottomSpacing: number;
  lastBottomSpacing: number;
  sidebarHeight: number;
  sidebarWidth: number;
  containerTop: number;
  containerHeight: number;
  containerBottom: number;
  viewportHeight: number;
  viewportTop: number;
  lastViewportTop: number;
  sidebarLeft: number;
  viewportBottom: number;
  viewportLeft: number;
}

export interface UpdateTriggerEvent {
  type: string;
}

interface StyleInfo {
  inner: {
    position: '' | 'fixed' | 'absolute' | 'relative';
    top: string;
    bottom: string;
    left: string;
    width: string;
    transform: string;
  };
  outer: {
    position: '' | 'relative';
    height: string;
  };
}

export const EVENT_KEY = '.BusySidebar';

export const DEFAULT_INNER_WRAPPER_CLASS_NAME = 'inner-wrapper-sticky';

export const DEFAULTS: Settings = {
  topSpacing: 0,
  bottomSpacing: 0,
  innerWrapper: `.${DEFAULT_INNER_WRAPPER_CLASS_NAME}`,
  stickyClass: 'is-affixed',
  mediaQuery: false,
  watchOffsetInterval: false,
};

/**
 * Sticky Sidebar Class.
 */
export default class BusySidebar {
  options: Settings;
  sidebar: HTMLElement;
  sidebarInner: HTMLElement;
  container: HTMLElement;

  /**
   * Current Affix Type of sidebar element.
   */
  affixedType: AffixedType = 'STATIC';

  direction: Direction = 'down';

  /**
   * Dimensions of sidebar, container and screen viewport.
   */
  dimensions: Dimensions = {
    translateY: 0,
    maxTranslateY: 0,
    topSpacing: 0,
    lastTopSpacing: 0,
    bottomSpacing: 0,
    lastBottomSpacing: 0,
    sidebarHeight: 0,
    sidebarWidth: 0,
    containerTop: 0,
    containerHeight: 0,
    containerBottom: 0,
    viewportHeight: 0,
    viewportTop: 0,
    lastViewportTop: 0,
    sidebarLeft: 0,
    viewportBottom: 0,
    viewportLeft: 0,
  };

  readonly support: {
    transform: string | false;
    transform3d: string | false;
  } = {
    transform: false,
    transform3d: false,
  };

  private _isInitialized: boolean = false;
  private _isPasued: boolean = false;
  private _isDestroyed: boolean = false;
  private _reStyle: boolean = false;
  private _mql: MediaQueryList | null = null;
  private _mediaMatched: boolean = false;
  private _running: boolean = false;
  private _resizeObserver: ResizeObserver | null = null;

  get isInitialized() {
    return this.isInitialized;
  }

  get isPasued() {
    return this._isPasued;
  }

  get isDestroyed() {
    return this._isDestroyed;
  }

  /**
   * Sticky Sidebar Constructor.
   * @param container - Container element or selector to know what the beginning and end of sticky element.
   * @param sidebar - The sidebar element or sidebar selector.
   * @param options - The options of sticky sidebar.
   */
  constructor(sidebar: HTMLElement | string, options: Options = {}) {
    this.options = extend(DEFAULTS, options);

    this.handleEvent = this.handleEvent.bind(this);
    this._handleResizeObserver = this._handleResizeObserver.bind(this);
    this._handleMediaQuery = this._handleMediaQuery.bind(this);
    this._setSupportFeatures();

    const _sidebar = toHtmlElement(sidebar);
    if (!_sidebar) {
      throw new Error('There is no specific sidebar element.');
    }
    this.sidebar = _sidebar;

    let container: HTMLElement | undefined = undefined;

    const { container: _c } = options;
    if (_c) {
      container = typeof _c === 'string' ? findParent(this.sidebar, _c) : _c;
    } else {
      container =
        (this.sidebar.parentElement as HTMLElement | null) || undefined;
    }

    if (container && !container.contains(this.sidebar)) container = undefined;
    if (!container) {
      throw new Error('The container does not contains on the sidebar.');
    }
    this.container = container;

    const { innerWrapper } = this.options;
    let sidebarInner: HTMLElement | undefined = undefined;

    // Get sticky sidebar inner wrapper, if not found, will create one.
    if (innerWrapper) {
      sidebarInner = toHtmlElement(innerWrapper, this.sidebar);
    }

    if (!sidebarInner) {
      let wrapper = document.createElement('div');
      wrapper.setAttribute('class', DEFAULT_INNER_WRAPPER_CLASS_NAME);
      this.sidebar.appendChild(wrapper);

      while (this.sidebar.firstChild !== wrapper) {
        const { firstChild } = this.sidebar;
        firstChild && wrapper.appendChild(firstChild);
      }

      sidebarInner = toHtmlElement(
        `.${DEFAULT_INNER_WRAPPER_CLASS_NAME}`,
        this.sidebar,
      );
    }

    if (!sidebarInner) {
      throw new Error('There is no specific sidebar inner element.');
    }

    this.sidebarInner = sidebarInner;

    // Check media query and Breakdown sticky sidebar.
    let { mediaQuery } = this.options;
    if (typeof mediaQuery === 'number') {
      mediaQuery = `(min-width: ${mediaQuery}px)`;
    }
    this.options.mediaQuery = mediaQuery;
    if (mediaQuery) {
      this._mql = window.matchMedia(mediaQuery);
      this._mql.addListener(this._handleMediaQuery);
    }
    this._checkMediaQuery();

    // Calculate dimensions of sidebar, container and viewport.
    this.calcDimensions();

    // Affix sidebar in proper position.
    this.stickyPosition();

    // Bind all events.
    window.addEventListener('load', this, false);
    window.addEventListener('resize', this, passiveEventListenerOption);
    window.addEventListener('scroll', this, passiveEventListenerOption);

    this._resizeObserver = new ResizeObserver(this._handleResizeObserver);
    this._resizeObserver.observe(this.sidebarInner);
    this._resizeObserver.observe(this.container);

    this.sidebar.addEventListener('update' + EVENT_KEY, this);

    // Inform other properties the sticky sidebar is initialized.
    this._isInitialized = true;
  }

  pause() {
    this._isPasued = true;
  }

  resume() {
    this._isPasued = false;
  }

  setTopSpacing(topSpacing: Settings['topSpacing']) {
    this.options.topSpacing = topSpacing;
    this._calcDimensionsWithScroll();
  }

  setBottomSpacing(bottomSpacing: Settings['bottomSpacing']) {
    this.options.bottomSpacing = bottomSpacing;
    this._calcDimensionsWithScroll();
  }

  /**
   * Destroy sticky sidebar plugin.
   */
  destroy() {
    if (this._isDestroyed) return;

    window.addEventListener('load', this, false);
    window.removeEventListener('resize', this, passiveEventListenerOption);
    window.removeEventListener('scroll', this, passiveEventListenerOption);

    if (this._mql) {
      this._mql.removeListener(this._handleMediaQuery);
      this._mql = null;
    }

    if (this._resizeObserver) {
      this._resizeObserver.unobserve(this.sidebarInner);
      this._resizeObserver.unobserve(this.container);
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }

    typeof this.options.stickyClass === 'string' &&
      removeClass(this.sidebar, this.options.stickyClass);

    this.sidebar.style.minHeight = '';
    this.sidebar.removeEventListener('update' + EVENT_KEY, this);

    const styleReset: StyleInfo = {
      inner: {
        position: '',
        top: '',
        left: '',
        bottom: '',
        width: '',
        transform: '',
      },
      outer: {
        height: '',
        position: '',
      },
    };

    for (const key in styleReset.outer) {
      this.sidebar.style[key] = styleReset.outer[key];
    }

    for (const key in styleReset.inner) {
      this.sidebarInner.style[key] = styleReset.inner[key];
    }

    this._isDestroyed = true;
  }

  /**
   * Calculates dimensions of sidebar, container and screen viewpoint
   */
  calcDimensions() {
    if (!this._mediaMatched) return;
    const dims = this.dimensions;

    // Container of sticky sidebar dimensions.
    dims.containerTop = offsetRelative(this.container).top;
    dims.containerHeight = this.container.clientHeight;
    dims.containerBottom = dims.containerTop + dims.containerHeight;

    // Sidebar dimensions.
    dims.sidebarHeight = this.sidebarInner.offsetHeight;
    dims.sidebarWidth = this.sidebarInner.offsetWidth;

    // Screen viewport dimensions.
    dims.viewportHeight = window.innerHeight;

    // Maximum sidebar translate Y.
    dims.maxTranslateY = dims.containerHeight - dims.sidebarHeight;

    this._calcDimensionsWithScroll();
  }

  /**
   * Determine whether the sidebar is bigger than viewport.
   */
  isSidebarFitsViewport(): boolean {
    const dims = this.dimensions;
    const offset =
      this.direction === 'down' ? dims.lastBottomSpacing : dims.lastTopSpacing;
    return (
      this.dimensions.sidebarHeight + offset < this.dimensions.viewportHeight
    );
  }

  /**
   * Observe browser scrolling direction top and down.
   */
  observeScrollDir() {
    const dims = this.dimensions;
    if (dims.lastViewportTop === dims.viewportTop) return;

    const furthest = 'down' === this.direction ? Math.min : Math.max;

    // If the browser is scrolling not in the same direction.
    if (dims.viewportTop === furthest(dims.viewportTop, dims.lastViewportTop)) {
      this.direction = 'down' === this.direction ? 'up' : 'down';
    }
  }

  /**
   * Switches between functions stack for each event type, if there's no
   * event, it will re-initialize sticky sidebar.
   */
  updateSticky(event: UpdateTriggerEvent) {
    if (this._isDestroyed || this._running) return;
    this._running = true;

    (eventType => {
      requestAnimationFrame(() => {
        switch (eventType) {
          // When browser is scrolling and re-calculate just dimensions
          // within scroll.
          case 'scroll':
            this._calcDimensionsWithScroll();
            this.observeScrollDir();
            this.stickyPosition();
            break;

          // When browser is resizing or there's no event,
          // re-calculate dimensions.
          case 'resize':
          default:
            this.calcDimensions();
            this.stickyPosition(true);
            break;
        }
        this._running = false;
      });
    })(event.type);
  }

  handleEvent(event: Event) {
    this.updateSticky(event);
  }

  /**
   * Cause the sidebar to be sticky according to affix type by adding inline
   * style, adding helper class and trigger events.
   */
  protected stickyPosition(force?: boolean) {
    if (!this._mediaMatched) return;

    force = this._reStyle || force || false;

    const affixType = this._getAffixType();
    const style = this._getStyle(affixType);

    if ((this.affixedType !== affixType || force) && affixType) {
      const affixEvent =
        'affix.' + affixType.toLowerCase().replace('viewport-', '') + EVENT_KEY;
      dispatchCustomEvent(this.sidebar, affixEvent);

      if ('STATIC' === affixType) {
        this.options.stickyClass &&
          removeClass(this.sidebar, this.options.stickyClass);
      } else {
        this.options.stickyClass &&
          addClass(this.sidebar, this.options.stickyClass);
      }

      for (const key in style.outer) {
        // const unit = 'number' === typeof style.outer[key] ? 'px' : '';
        this.sidebar.style[key] = style.outer[key]; // + unit;
      }

      for (const key in style.inner) {
        // const unit = 'number' === typeof style.inner[key] ? 'px' : '';
        this.sidebarInner.style[key] = style.inner[key]; // + unit;
      }

      const affixedEvent =
        'affixed.' +
        affixType.toLowerCase().replace('viewport-', '') +
        EVENT_KEY;
      dispatchCustomEvent(this.sidebar, affixedEvent);
    } else {
      if (this._isInitialized) {
        this.sidebarInner.style.left = style.inner.left;
      }
    }

    this.affixedType = affixType;
  }

  private _handleResizeObserver() {
    this.updateSticky({ type: 'resize' });
  }

  private _handleMediaQuery() {
    this._checkMediaQuery();
    this.updateSticky({ type: 'resize' });
  }

  private _getSpacing(spacing: number | SpacingFunction) {
    return typeof spacing === 'number' ? spacing : spacing(this);
  }

  /**
   * Gets affix type of sidebar according to current scroll top and scrolling direction.
   */
  private _getAffixType(): AffixedType {
    this._calcDimensionsWithScroll();
    const dims = this.dimensions;
    const colliderTop = dims.viewportTop + dims.topSpacing;
    let affixType = this.affixedType;

    if (
      colliderTop <= dims.containerTop ||
      dims.containerHeight <= dims.sidebarHeight
    ) {
      dims.translateY = 0;
      affixType = 'STATIC';
    } else {
      affixType =
        'up' === this.direction
          ? this._getAffixTypeScrollingUp()
          : this._getAffixTypeScrollingDown();
    }

    // Make sure the translate Y is not bigger than container height.
    dims.translateY = Math.max(0, dims.translateY);
    dims.translateY = Math.min(dims.containerHeight, dims.translateY);
    dims.translateY = Math.round(dims.translateY);

    dims.lastViewportTop = dims.viewportTop;
    return affixType;
  }

  /**
   * Some dimensions values need to be up-to-date when scrolling the page.
   */
  private _calcDimensionsWithScroll() {
    const dims = this.dimensions;

    dims.sidebarLeft = offsetRelative(this.sidebar).left;
    dims.containerTop = offsetRelative(this.container).top;
    dims.containerBottom = dims.containerTop + dims.containerHeight;

    dims.viewportTop =
      document.documentElement.scrollTop || document.body.scrollTop;
    dims.viewportBottom = dims.viewportTop + dims.viewportHeight;
    dims.viewportLeft =
      document.documentElement.scrollLeft || document.body.scrollLeft;

    dims.topSpacing = this._getSpacing(this.options.topSpacing);
    dims.bottomSpacing = this._getSpacing(this.options.bottomSpacing);

    if ('VIEWPORT-TOP' === this.affixedType) {
      // Adjust translate Y in the case decrease top spacing value.
      if (dims.topSpacing < dims.lastTopSpacing) {
        dims.translateY += dims.lastTopSpacing - dims.topSpacing;
        this._reStyle = true;
      }
    } else if ('VIEWPORT-BOTTOM' === this.affixedType) {
      // Adjust translate Y in the case decrease bottom spacing value.
      if (dims.bottomSpacing < dims.lastBottomSpacing) {
        dims.translateY += dims.lastBottomSpacing - dims.bottomSpacing;
        this._reStyle = true;
      }
    }

    dims.lastTopSpacing = dims.topSpacing;
    dims.lastBottomSpacing = dims.bottomSpacing;
  }

  /**
   * Get affix type while scrolling down.
   */
  private _getAffixTypeScrollingDown() {
    const dims = this.dimensions;
    const sidebarBottom = dims.sidebarHeight + dims.containerTop;
    const colliderTop = dims.viewportTop + dims.topSpacing;
    const colliderBottom = dims.viewportBottom - dims.bottomSpacing;
    let affixType = this.affixedType;

    if (this.isSidebarFitsViewport()) {
      if (dims.sidebarHeight + colliderTop >= dims.containerBottom) {
        dims.translateY = dims.containerBottom - sidebarBottom;
        affixType = 'CONTAINER-BOTTOM';
      } else if (colliderTop >= dims.containerTop) {
        dims.translateY = colliderTop - dims.containerTop;
        affixType = 'VIEWPORT-TOP';
      }
    } else {
      if (dims.containerBottom <= colliderBottom) {
        dims.translateY = dims.containerBottom - sidebarBottom;
        affixType = 'CONTAINER-BOTTOM';
      } else if (sidebarBottom + dims.translateY <= colliderBottom) {
        dims.translateY = colliderBottom - sidebarBottom;
        affixType = 'VIEWPORT-BOTTOM';
      } else if (
        dims.containerTop + dims.translateY <= colliderTop &&
        0 !== dims.translateY &&
        dims.maxTranslateY !== dims.translateY
      ) {
        affixType = 'VIEWPORT-UNBOTTOM';
      }
    }

    return affixType;
  }

  /**
   * Get affix type while scrolling up.
   */
  private _getAffixTypeScrollingUp(): AffixedType {
    const dims = this.dimensions;
    const sidebarBottom = dims.sidebarHeight + dims.containerTop;
    const colliderTop = dims.viewportTop + dims.topSpacing;
    const colliderBottom = dims.viewportBottom - dims.bottomSpacing;
    let affixType = this.affixedType;

    if (colliderTop <= dims.translateY + dims.containerTop) {
      dims.translateY = colliderTop - dims.containerTop;
      affixType = 'VIEWPORT-TOP';
    } else if (dims.containerBottom <= colliderBottom) {
      dims.translateY = dims.containerBottom - sidebarBottom;
      affixType = 'CONTAINER-BOTTOM';
    } else if (!this.isSidebarFitsViewport()) {
      if (
        dims.containerTop <= colliderTop &&
        0 !== dims.translateY &&
        dims.maxTranslateY !== dims.translateY
      ) {
        affixType = 'VIEWPORT-UNBOTTOM';
      }
    }

    return affixType;
  }

  /**
   * Gets inline style of sticky sidebar wrapper and inner wrapper according
   * to its affix type.
   */
  private _getStyle(affixType: AffixedType): StyleInfo {
    const style: StyleInfo = {
      inner: {
        position: 'relative',
        top: '',
        left: '',
        bottom: '',
        width: '',
        transform: '',
      },
      outer: {
        height: '',
        position: '',
      },
    };

    let inner: Partial<StyleInfo['inner']> | undefined = undefined;
    let outer: Partial<StyleInfo['outer']> | undefined = undefined;

    const dims = this.dimensions;

    switch (affixType) {
      case 'VIEWPORT-TOP':
        inner = {
          position: 'fixed',
          top: `${dims.topSpacing}px`,
          left: `${dims.sidebarLeft - dims.viewportLeft}px`,
          width: `${dims.sidebarWidth}px`,
        };
        break;
      case 'VIEWPORT-BOTTOM':
        inner = {
          position: 'fixed',
          top: 'auto',
          left: `${dims.sidebarLeft}px`,
          bottom: `${dims.bottomSpacing}px`,
          width: `${dims.sidebarWidth}px`,
        };
        break;
      case 'CONTAINER-BOTTOM':
      case 'VIEWPORT-UNBOTTOM':
        const translate = this._getTranslate(0, dims.translateY + 'px');
        if (translate) {
          inner = { transform: translate };
        } else {
          inner = {
            position: 'absolute',
            top: `${dims.translateY}px`,
            width: `${dims.sidebarWidth}px`,
          };
        }
        break;
    }

    switch (affixType) {
      case 'VIEWPORT-TOP':
      case 'VIEWPORT-BOTTOM':
      case 'VIEWPORT-UNBOTTOM':
      case 'CONTAINER-BOTTOM':
        outer = {
          position: 'relative',
          height: `${dims.sidebarHeight}px`,
        };
        break;
    }

    style.outer = {
      ...style.outer,
      ...outer,
    };

    style.inner = {
      ...style.inner,
      ...inner,
    };
    return style;
  }

  private _checkMediaQuery() {
    const { _mql } = this;
    if (_mql && !_mql.matches) {
      this._mediaMatched = false;
      this.affixedType = 'STATIC';

      this.sidebar.removeAttribute('style');
      this.options.stickyClass &&
        removeClass(this.sidebar, this.options.stickyClass);
      this.sidebarInner.removeAttribute('style');
    } else {
      this._mediaMatched = true;
    }
  }

  /**
   * Set browser support features to the public property.
   */
  private _setSupportFeatures() {
    const { support } = this;

    support.transform = supportTransform();
    support.transform3d = supportTransform(true);
  }

  /**
   * Get translate value, if the browser supports transfrom3d, it will adopt it.
   * and the same with translate. if browser doesn't support both return false.
   */
  private _getTranslate(
    y: string | number = 0,
    x: string | number = 0,
    z: string | number = 0,
  ): string | false {
    if (this.support.transform3d) {
      return `translate3d(${y}, ${x}, ${z})`;
    } else if (this.support.transform) {
      return `translate(${y}, ${x})`;
    } else {
      return false;
    }
  }

  /**
   * Gets default values of configuration options.
   */
  static get defaults() {
    return DEFAULTS;
  }
}
