/**
 * Screen reader announcer utility.
 * Creates a live region to announce dynamic content changes to screen readers.
 */

let announcer: HTMLElement | null = null;
let timeoutId: ReturnType<typeof setTimeout> | null = null;

/**
 * Initialize the announcer element if it doesn't exist.
 */
function getAnnouncer(priority: 'polite' | 'assertive'): HTMLElement {
  // Check if announcer already exists with the right priority
  const existingAnnouncer = document.getElementById(`sr-announcer-${priority}`);
  if (existingAnnouncer) {
    return existingAnnouncer;
  }

  // Create new announcer
  const newAnnouncer = document.createElement('div');
  newAnnouncer.id = `sr-announcer-${priority}`;
  newAnnouncer.setAttribute('aria-live', priority);
  newAnnouncer.setAttribute('aria-atomic', 'true');
  newAnnouncer.setAttribute('role', 'status');
  newAnnouncer.className = 'sr-only';
  document.body.appendChild(newAnnouncer);

  return newAnnouncer;
}

/**
 * Announce a message to screen readers.
 *
 * @param message - The message to announce
 * @param priority - 'polite' waits for user to finish, 'assertive' interrupts
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (typeof document === 'undefined') return;

  const announcer = getAnnouncer(priority);

  // Clear any pending timeout
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  // Clear the announcer first to ensure the message is announced
  // even if it's the same as the previous message
  announcer.textContent = '';

  // Use a small delay to ensure the clear is processed
  timeoutId = setTimeout(() => {
    announcer.textContent = message;
  }, 50);
}

/**
 * Clear all announcements.
 */
export function clearAnnouncements() {
  if (typeof document === 'undefined') return;

  const politeAnnouncer = document.getElementById('sr-announcer-polite');
  const assertiveAnnouncer = document.getElementById('sr-announcer-assertive');

  if (politeAnnouncer) politeAnnouncer.textContent = '';
  if (assertiveAnnouncer) assertiveAnnouncer.textContent = '';
}
