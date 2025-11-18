/**
 * Utilities for generating robust CSS selectors for elements
 */

export interface SelectorStrategy {
  type: 'css' | 'xpath' | 'text' | 'ai';
  value: string;
  fallbacks?: string[];
}

export function generateRobustSelector(element: Element): SelectorStrategy {
  const selectors: string[] = [];

  // Try ID first (most specific)
  if (element.id) {
    return {
      type: 'css',
      value: `#${element.id}`,
    };
  }

  // Try unique data attributes
  const dataAttrs = Array.from(element.attributes)
    .filter((attr) => attr.name.startsWith('data-'))
    .map((attr) => `[${attr.name}="${attr.value}"]`);

  for (const dataAttr of dataAttrs) {
    const selector = `${element.tagName.toLowerCase()}${dataAttr}`;
    if (document.querySelectorAll(selector).length === 1) {
      return {
        type: 'css',
        value: selector,
      };
    }
  }

  // Try class combinations
  if (element.className) {
    const classes = Array.from(element.classList).join('.');
    const selector = `${element.tagName.toLowerCase()}.${classes}`;
    if (document.querySelectorAll(selector).length === 1) {
      selectors.push(selector);
    }
  }

  // Generate path-based selector
  const path = generatePathSelector(element);
  selectors.push(path);

  // Try text content for links and buttons
  if (
    element.tagName === 'A' ||
    element.tagName === 'BUTTON' ||
    element.getAttribute('role') === 'button'
  ) {
    const text = element.textContent?.trim();
    if (text && text.length < 50) {
      selectors.push(`${element.tagName.toLowerCase()}:contains("${text}")`);
    }
  }

  return {
    type: 'css',
    value: selectors[0],
    fallbacks: selectors.slice(1),
  };
}

function generatePathSelector(element: Element): string {
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current.tagName !== 'HTML') {
    let selector = current.tagName.toLowerCase();

    // Add ID if present
    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }

    // Add nth-of-type if there are siblings
    const siblings = Array.from(current.parentElement?.children || []);
    const sameTagSiblings = siblings.filter((s) => s.tagName === current!.tagName);

    if (sameTagSiblings.length > 1) {
      const index = sameTagSiblings.indexOf(current) + 1;
      selector += `:nth-of-type(${index})`;
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

export function testSelector(selector: string): {
  found: boolean;
  count: number;
  unique: boolean;
} {
  try {
    const elements = document.querySelectorAll(selector);
    return {
      found: elements.length > 0,
      count: elements.length,
      unique: elements.length === 1,
    };
  } catch (error) {
    return {
      found: false,
      count: 0,
      unique: false,
    };
  }
}

export function findElementWithFallbacks(
  selector: SelectorStrategy
): Element | null {
  // Try primary selector
  let element = findElement(selector.type, selector.value);

  // Try fallbacks if primary fails
  if (!element && selector.fallbacks) {
    for (const fallback of selector.fallbacks) {
      element = findElement('css', fallback);
      if (element) break;
    }
  }

  return element;
}

function findElement(type: string, value: string): Element | null {
  try {
    switch (type) {
      case 'css':
        return document.querySelector(value);

      case 'xpath':
        const result = document.evaluate(
          value,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        return result.singleNodeValue as Element;

      case 'text':
        const elements = Array.from(document.querySelectorAll('*'));
        return (
          (elements.find(
            (el) => el.textContent?.trim() === value
          ) as Element) || null
        );

      default:
        return null;
    }
  } catch (error) {
    return null;
  }
}

