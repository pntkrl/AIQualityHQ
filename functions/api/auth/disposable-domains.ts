// List of known temporary / disposable email domains
export const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'temp-mail.org', 'mailinator.com', '10minutemail.com',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'yopmail.com',
  'yopmail.fr', 'yopmail.net', 'trashmail.com', 'trashmail.net',
  'dispostable.com', 'getairmail.com', 'sharklasers.com', 'throwawaymail.com',
  'getnada.com', 'inboxalias.com', 'maildrop.cc', 'emailondeck.com',
  'crazymailing.com', 'tempail.com', 'tempinbox.com', 'disposablemail.com',
  'mytrashmail.com', 'fakeinbox.com', 'anonymbox.com', 'generator.email',
  'minuteinbox.com', 'mohmal.com', 'bupmail.com', 'tmail.ws',
  'burnermail.io', 'mailnesia.com', 'discard.email', 'spambox.us',
  'receive-sms-online.info', 'receive-sms.com', 'receivesms.co',
  'temp-mail.ru', 'tempmail.net', 'tempmail.de', 'tempmail.com.br',
  'luxusmail.org', 'boun.cr', 'armyspy.com', 'cuvox.de', 'dayrep.com',
  'einrot.com', 'fleckens.hu', 'gustr.com', 'jourrapide.com', 'rhyta.com',
  'teleworm.us', 'superrito.com', '0815.ru', '10minutemail.co.uk',
  '10minutemail.net', '10minutemail.org', '20minutemail.com', '33mail.com',
  'anonbox.net', 'binkmail.com', 'bobmail.info', 'chacuo.net', 'clrmail.com',
  'cool.fr.nf', 'courriel.fr.nf', 'discardmail.com', 'dodgeit.com',
  'drdrb.com', 'dropmail.me', 'e4ward.com', 'email4u.org', 'emailna.co',
  'emkei.cz', 'filzmail.com', 'get2mail.fr', 'gishpuppy.com', 'grr.la',
  'hidingname.com', 'hidemail.de', 'hmamail.com', 'incognitomail.org',
  'jetable.org', 'kasmail.com', 'ktear.net', 'spambox.org', 'spambog.de'
]);

export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@').pop()?.toLowerCase().trim();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}
